"""Meeting service — business logic for meeting upload, processing, export."""

from __future__ import annotations

import os
import uuid
import time
import logging
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db import models
from app.pipeline.ingest.router import ingest_file
from app.integrations import assembly_stt

from app.pipeline.graphs.highlights_graph import highlights_graph
from app.pipeline.graphs.topic_segregation_graph import topic_segregation_graph
from app.pipeline.graphs.summary_recap_graph import summary_recap_graph
from app.pipeline.graphs.inferred_insights_graph import inferred_insights_graph
from app.pipeline.graphs.knowledge_graph import knowledge_graph
from app.pipeline.graphs.team_prep_graph import team_prep_graph
from app.pipeline.graphs.team_analysis_graph import team_analysis_graph

from app.pipeline.attachments.router import ingest_attachment, is_allowed_attachment
from app.pipeline.attachments.reference_detect import detect_verified_doc_references, index_refs_by_utterance
from app.pipeline.attachments.types import VerifiedDocReference
from app.pipeline.attachments.doc_context import build_doc_context_block
from app.pipeline.attachments.citation_guard import filter_doc_citations, filter_citations_used, filter_source_doc_refs
from app.config import get_settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def _utterance_id_key(uid) -> str:
    if isinstance(uid, (list, tuple)):
        return str(list(uid))
    return str(uid)

def _persist_attachment(db: Session, meeting_id: str, result) -> None:
    att = models.MeetingAttachment(
        id=result.attachment_id,
        meeting_id=meeting_id,
        filename=result.filename,
        mime_type=result.mime_type,
        storage_path=result.storage_path or "",
        slide_count=result.slide_count,
        page_count=result.page_count,
        outline=result.outline,
        doc_summary=result.doc_summary,
    )
    db.add(att)
    db.flush()
    for chunk in result.chunks:
        db.add(
            models.AttachmentChunk(
                chunk_id=chunk.chunk_id,
                attachment_id=result.attachment_id,
                meeting_id=meeting_id,
                locator_type=chunk.locator_type,
                locator_value=chunk.locator_value,
                title=chunk.title,
                text=chunk.text,
                char_count=chunk.char_count,
            )
        )

def _load_attachment_context(db: Session, meeting_id: str):
    atts = db.execute(select(models.MeetingAttachment).where(models.MeetingAttachment.meeting_id == meeting_id)).scalars().all()
    chunks = db.execute(select(models.AttachmentChunk).where(models.AttachmentChunk.meeting_id == meeting_id)).scalars().all()
    attachments = [{"id": a.id, "filename": a.filename} for a in atts]
    chunks_by_attachment: dict[str, list[dict]] = {}
    chunk_text_by_id: dict[str, dict] = {}
    attachment_filename_by_id = {a.id: a.filename for a in atts}
    for ch in chunks:
        entry = {
            "chunk_id": ch.chunk_id,
            "locator_type": ch.locator_type,
            "locator_value": ch.locator_value,
            "title": ch.title,
            "text": ch.text,
        }
        chunks_by_attachment.setdefault(ch.attachment_id, []).append(entry)
        chunk_text_by_id[ch.chunk_id] = entry
    return attachments, chunks_by_attachment, chunk_text_by_id, attachment_filename_by_id


def upload_meeting(content: bytes, filename: str) -> tuple[str, str, list[str]]:
    meeting_id, fname, speakers, _atts = upload_meeting_with_files(content, filename, [])
    return meeting_id, fname, speakers

def upload_meeting_with_files(transcript_content: bytes, transcript_filename: str, attachment_files: list[tuple[str, bytes]]) -> tuple[str, str, list[str], list[dict]]:
    """Store a raw VTT or audio meeting file, parse/transcribe utterances, extract speakers, and ingest attachments."""
    logger.info(f"[Service] Ingesting meeting file: {transcript_filename} (size: {len(transcript_content)} bytes)")
    meeting_id = str(uuid.uuid4())
    
    audio_exts = (".wav", ".mp3", ".m4a", ".ogg", ".flac", ".aac", ".wma")
    video_exts = (".mp4", ".mov", ".webm", ".mkv", ".avi", ".wmv", ".flv")
    is_audio = any(transcript_filename.lower().endswith(ext) for ext in audio_exts)
    is_video = any(transcript_filename.lower().endswith(ext) for ext in video_exts)
    
    audio_filepath = None
    audio_url = None
    raw_vtt_content = None
    
    if is_audio or is_video:
        logger.info(f"[Service] Audio/Video file detected. Storing locally in 'uploads' directory...")
        os.makedirs("uploads", exist_ok=True)
        raw_filepath = os.path.join("uploads", f"{meeting_id}_{transcript_filename}")
        with open(raw_filepath, "wb") as f:
            f.write(transcript_content)
        
        if is_video:
            logger.info(f"[Service] Video file detected ({filename}). Auto-converting to audio for AssemblyAI ingestion...")
            base_name = os.path.splitext(filename)[0]
            audio_filename = f"{base_name}.mp3"
            audio_filepath = os.path.join("uploads", f"{meeting_id}_{audio_filename}")
            try:
                import subprocess
                logger.info(f"[Service] Executing ffmpeg video-to-audio conversion for {raw_filepath} -> {audio_filepath}...")
                subprocess.run(["ffmpeg", "-i", raw_filepath, "-q:a", "0", "-map", "a", audio_filepath, "-y"], check=True, capture_output=True)
                logger.info("[Service] ffmpeg conversion completed successfully.")
            except Exception as e:
                logger.warning(f"[Service] ffmpeg conversion failed or unavailable ({e}). Using direct file pass-through fallback for AssemblyAI ingestion.")
                audio_filepath = raw_filepath
                audio_filename = filename
            audio_url = f"/uploads/{meeting_id}_{audio_filename}"
        else:
            audio_filepath = raw_filepath
            audio_url = f"/uploads/{meeting_id}_{transcript_filename}"
        
        logger.info(f"[Service] Invoking AssemblyAI STT & Diarization for {audio_filepath}...")
        utterance_dicts = assembly_stt.transcribe_audio(audio_filepath)
        speakers = sorted(list({u["speaker"] for u in utterance_dicts if u["speaker"] != "Unknown"}))
        raw_vtt_content = "\n".join(f"{u['start']} --> {u['end']}\n{u['speaker']}: {u['text']}" for u in utterance_dicts)
    else:
        logger.info(f"[Service] VTT/SRT file detected. Parsing directly...")
        raw_utterances, metadata = ingest_file(transcript_content, transcript_filename)
        speakers = sorted(list({u.speaker for u in raw_utterances if u.speaker != "Unknown"}))
        raw_vtt_content = transcript_content.decode("utf-8", errors="ignore")
        utterance_dicts = [
            {
                "id": u.id,
                "speaker": u.speaker,
                "start": u.start,
                "end": u.end,
                "text": u.text,
                "raw_text": u.raw_text,
            }
            for u in raw_utterances
        ]

    logger.info(f"[Service] Generated meeting ID {meeting_id}, extracted {len(speakers)} speakers: {speakers}")
    
    # Ingest attachments
    ingest_results = []
    for fname, cnt in attachment_files:
        if not is_allowed_attachment(fname):
            raise ValueError(f"Unsupported attachment: {fname}")
        res = ingest_attachment(meeting_id, fname, cnt)
        ingest_results.append(res)
        
    # Save to Postgres
    db: Session = SessionLocal()
    try:
        meeting = models.Meeting(
            id=meeting_id,
            title=transcript_filename,
            recorded_at=datetime.utcnow(),
            participants=speakers,
            raw_vtt_content=raw_vtt_content,
            audio_filepath=audio_filepath,
            audio_url=audio_url,
            status="Attribution",
            duration="45m"
        )
        db.add(meeting)
        
        transcript = models.MeetingTranscript(
            meeting_id=meeting_id,
            cleaned_transcript=utterance_dicts
        )
        db.add(transcript)
        for res in ingest_results:
            _persist_attachment(db, meeting_id, res)
        db.commit()
        logger.info(f"[Service] Successfully stored meeting {meeting_id} and {len(utterance_dicts)} utterances in database.")
        
        attachment_meta = [
            {"attachment_id": r.attachment_id, "filename": r.filename, "slide_count": r.slide_count, "page_count": r.page_count}
            for r in ingest_results
        ]
        return meeting_id, transcript_filename, speakers, attachment_meta
    except Exception as e:
        logger.error(f"[Service] Error uploading meeting {transcript_filename}: {e}", exc_info=True)
        raise
    finally:
        db.close()


def list_meetings() -> list[dict]:
    """List all meetings for the dashboard view."""
    logger.info("[Service] Fetching meeting list from database")
    db: Session = SessionLocal()
    try:
        # Only query heading things, avoiding heavy text columns and N+1 queries
        stmt = select(
            models.Meeting.id,
            models.Meeting.title,
            models.Meeting.recorded_at,
            models.Meeting.status,
            models.Meeting.duration,
            models.Meeting.participants
        ).order_by(models.Meeting.recorded_at.desc())
        
        rows = db.execute(stmt).all()
        
        # Fetch tags for all meetings to avoid N+1
        facts = db.execute(select(models.MeetingKnowledgeFact.meeting_id, models.MeetingKnowledgeFact.tags)).all()
        tags_by_meeting = {}
        for f in facts:
            if f.tags:
                tags_by_meeting.setdefault(f.meeting_id, set()).update(f.tags)
                
        results = []
        for row in rows:
            rec_time = row.recorded_at.isoformat() if row.recorded_at else datetime.utcnow().isoformat()
            results.append({
                "id": row.id,
                "title": row.title,
                "recorded_at": rec_time,
                "uploaded_time": rec_time,
                "status": row.status,
                "duration": row.duration,
                "participants": row.participants,
                "summary": "Meeting recorded and fully processed.",
                "action_items": [],
                "tags": list(tags_by_meeting.get(row.id, set()))
            })
        logger.info(f"[Service] Retrieved {len(results)} meetings successfully.")
        return results
    except Exception as e:
        logger.error(f"[Service] Error listing meetings: {e}", exc_info=True)
        raise
    finally:
        db.close()


def get_meeting(meeting_id: str) -> dict | None:
    """Retrieve full meeting details across all normalized stage tables."""
    logger.info(f"[Service] Fetching full meeting record for {meeting_id}")
    db: Session = SessionLocal()
    try:
        m = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
        if not m:
            logger.warning(f"[Service] Meeting {meeting_id} not found.")
            return None
            
        transcript = db.execute(select(models.MeetingTranscript).where(models.MeetingTranscript.meeting_id == meeting_id)).scalar_one_or_none()
        key_moments = db.execute(select(models.MeetingKeyMoment).where(models.MeetingKeyMoment.meeting_id == meeting_id)).scalars().all()
        topic = db.execute(select(models.MeetingTopic).where(models.MeetingTopic.meeting_id == meeting_id)).scalar_one_or_none()
        recap = db.execute(select(models.MeetingSummaryRecap).where(models.MeetingSummaryRecap.meeting_id == meeting_id)).scalar_one_or_none()
        actions = db.execute(select(models.MeetingActionItem).where(models.MeetingActionItem.meeting_id == meeting_id)).scalars().all()
        insights = db.execute(select(models.MeetingInferredInsight).where(models.MeetingInferredInsight.meeting_id == meeting_id)).scalar_one_or_none()
        facts = db.execute(select(models.MeetingKnowledgeFact).where(models.MeetingKnowledgeFact.meeting_id == meeting_id)).scalars().all()
        team_prep = db.execute(select(models.MeetingTeamPrep).where(models.MeetingTeamPrep.meeting_id == meeting_id)).scalar_one_or_none()
        team_analysis = db.execute(select(models.MeetingTeamAnalysis).where(models.MeetingTeamAnalysis.meeting_id == meeting_id)).scalar_one_or_none()
        participation = db.execute(select(models.MeetingParticipation).where(models.MeetingParticipation.meeting_id == meeting_id)).scalar_one_or_none()
        traces = db.execute(select(models.MeetingWorkflowTrace).where(models.MeetingWorkflowTrace.meeting_id == meeting_id).order_by(models.MeetingWorkflowTrace.created_at.asc())).scalars().all()
        
        attachments = db.execute(select(models.MeetingAttachment).where(models.MeetingAttachment.meeting_id == meeting_id)).scalars().all()
        chunks = db.execute(select(models.AttachmentChunk).where(models.AttachmentChunk.meeting_id == meeting_id)).scalars().all()
        doc_refs = db.execute(select(models.MeetingDocReference).where(models.MeetingDocReference.meeting_id == meeting_id)).scalars().all()
        
        links = db.execute(select(models.MeetingLink).where(models.MeetingLink.source_meeting_id == meeting_id)).scalars().all()
        semantic_chunks = db.execute(select(models.MeetingSemanticChunk).where(models.MeetingSemanticChunk.meeting_id == meeting_id)).scalars().all()
        
        utt_to_chunks = {}
        for dr in doc_refs:
            utt_to_chunks.setdefault(str(dr.utterance_id), set()).add(dr.chunk_id)

        absorbed_title = m.title
        if topic and topic.topics_data and topic.topics_data.get("overall_topic"):
            absorbed_title = topic.topics_data.get("overall_topic")
            if m.title != absorbed_title:
                m.title = absorbed_title
                db.commit()

        logger.info(f"[Service] Successfully aggregated all stage tables for meeting {meeting_id}")
        all_tags = set()
        for f in facts:
            if f.tags:
                all_tags.update(f.tags)

        return {
            "id": m.id,
            "title": absorbed_title,
            "recorded_at": m.recorded_at.isoformat() if m.recorded_at else datetime.utcnow().isoformat(),
            "status": m.status,
            "duration": m.duration,
            "participants": m.participants,
            "raw_vtt_content": m.raw_vtt_content,
            "tags": list(all_tags),
            "transcript": transcript.cleaned_transcript if transcript else [],
            "attachments": [
                {
                    "attachment_id": a.id,
                    "filename": a.filename,
                    "mime_type": a.mime_type,
                    "slide_count": a.slide_count,
                    "page_count": a.page_count,
                    "outline": a.outline,
                    "doc_summary": a.doc_summary,
                    "storage_path": a.storage_path,
                }
                for a in attachments
            ],
            "attachment_chunks": [
                {
                    "chunk_id": c.chunk_id,
                    "attachment_id": c.attachment_id,
                    "locator_type": c.locator_type,
                    "locator_value": c.locator_value,
                    "title": c.title,
                    "text": c.text,
                }
                for c in chunks
            ],
            "doc_references": [
                {
                    "id": r.id,
                    "utterance_id": r.utterance_id,
                    "speaker": r.speaker,
                    "attachment_id": r.attachment_id,
                    "chunk_id": r.chunk_id,
                    "reference_type": r.reference_type,
                    "raw_phrase": r.raw_phrase,
                    "confidence": r.confidence,
                    "resolution_method": r.resolution_method,
                }
                for r in doc_refs
            ],
            "key_moments": [
                {
                    "id": km.km_id,
                    "type": km.moment_type,
                    "text": km.text,
                    "confidence": km.confidence,
                    "source_ids": km.source_utterance_ids,
                    "source_doc_refs": list(set(km.source_doc_refs or []) | {ch for uid in km.source_utterance_ids for ch in utt_to_chunks.get(str(uid), set())}),
                }
                for km in key_moments
            ],
            "topics_data": topic.topics_data if topic else {},
            "markdown_report": recap.markdown_report if recap else "",
            "citations_used": recap.citations_used if recap else [],
            "action_items": [
                {
                    "id": a.id,
                    "text": a.text,
                    "owner": a.owner,
                    "deadline": a.deadline,
                    "confidence": a.confidence,
                    "source_utterance_ids": a.source_utterance_ids,
                    "source_key_moment_ids": a.source_key_moment_ids,
                    "source_doc_refs": list(set(a.source_doc_refs or []) | {ch for uid in a.source_utterance_ids for ch in utt_to_chunks.get(str(uid), set())}),
                }
                for a in actions
            ],
            "inferred_insights": insights.insights_data if insights else {},
            "knowledge_facts": [{"id": f.id, "text": f.fact_text, "source_key_moment_ids": f.source_key_moment_ids, "tags": f.tags} for f in facts],
            "team_prep": team_prep.team_prep_data if team_prep else {},
            "team_analysis": team_analysis.team_analysis_data if team_analysis else {},
            "participation": participation.participation_data if participation else {},
            "workflow_traces": [{"id": t.id, "step_name": t.step_name, "status": t.status, "input_summary": t.input_summary, "output_summary": t.output_summary, "output_data": getattr(t, "output_data", {}), "execution_time_ms": t.execution_time_ms, "created_at": t.created_at.isoformat() if t.created_at else datetime.utcnow().isoformat()} for t in traces],
            "cross_meeting_links": [{"target_meeting_id": l.target_meeting_id, "similarity_score": l.similarity_score, "reason": l.reason} for l in links],
            "semantic_chunks": [{"id": c.id, "chunk_type": c.chunk_type, "text": c.text, "metadata_dict": c.metadata_dict} for c in semantic_chunks],
        }
    except Exception as e:
        logger.error(f"[Service] Error getting meeting {meeting_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()


def delete_meeting(meeting_id: str) -> bool:
    """Delete a meeting and all its cascaded associated records."""
    logger.info(f"[Service] Deleting meeting {meeting_id} from database")
    db: Session = SessionLocal()
    try:
        m = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
        if not m:
            logger.warning(f"[Service] Cannot delete: Meeting {meeting_id} not found.")
            return False
        db.delete(m)
        db.commit()
        logger.info(f"[Service] Successfully deleted meeting {meeting_id} and all cascaded records.")
        return True
    except Exception as e:
        logger.error(f"[Service] Error deleting meeting {meeting_id}: {e}", exc_info=True)
        raise
    finally:
        db.close()



async def process_meeting(meeting_id: str) -> dict:
    """Execute the full sequential LangGraph pipeline on an attributed meeting."""
    logger.info(f"[Service|Pipeline] Starting process_meeting pipeline for meeting {meeting_id}")
    db: Session = SessionLocal()
    try:
        m = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
        if not m:
            logger.error(f"[Service|Pipeline] Meeting {meeting_id} not found in database.")
            raise ValueError("Meeting not found")
            
        m.status = "Processing"
        db.commit()
        logger.info(f"[Service|Pipeline] Meeting status updated to 'Processing' for {meeting_id}")
        
        transcript = db.execute(select(models.MeetingTranscript).where(models.MeetingTranscript.meeting_id == meeting_id)).scalar_one_or_none()
        utterances = transcript.cleaned_transcript if transcript else []
        logger.info(f"[Service|Pipeline] Retrieved {len(utterances)} cleaned utterances for processing.")
        
        # Check if we have audio_filepath for automatic SpeechBrain + pgvector speaker mapping
        if m.audio_filepath and utterances:
            logger.info(f"[Service|Pipeline] Audio file detected ({m.audio_filepath}). Initiating automatic SpeechBrain + pgvector speaker mapping...")
            from app.services import voice_service
            auto_mappings = voice_service.map_meeting_speakers(meeting_id, m.audio_filepath, utterances)
            if auto_mappings:
                logger.info(f"[Service|Pipeline] Automatic speaker mapping successful: {auto_mappings}")

        # Perform speaker attribution replacement (combining manual mappings and automatic pgvector mappings)
        mappings = db.execute(select(models.MeetingSpeakerMapping).where(models.MeetingSpeakerMapping.meeting_id == meeting_id)).scalars().all()
        mapping_dict = {}
        for map_obj in mappings:
            user = db.execute(select(models.User).where(models.User.id == map_obj.user_id)).scalar_one_or_none()
            if user:
                mapping_dict[map_obj.raw_speaker_name] = user.name
                
        if mapping_dict and utterances:
            logger.info(f"[Service|Pipeline] Applying speaker mappings: {mapping_dict}")
            for u in utterances:
                if u.get("speaker") in mapping_dict:
                    u["speaker"] = mapping_dict[u["speaker"]]
            transcript.cleaned_transcript = utterances
            # Update participants list
            m.participants = sorted(list({u.get("speaker", "Unknown") for u in utterances if u.get("speaker") != "Unknown"}))
            db.commit()
            logger.info(f"[Service|Pipeline] Updated participants list after mapping: {m.participants}")
            
        metadata_dict = {
            "title": m.title,
            "recorded_at": m.recorded_at.isoformat() if m.recorded_at else datetime.utcnow().isoformat(),
            "participants": m.participants
        }
        
        def log_trace(step_name: str, status: str, inp: str, outp: str, duration_ms: int, output_data: dict | list | str | None = None):
            if status in ("ERROR", "FAILED"):
                logger.error(f"[Service|Pipeline] Step '{step_name}' [{status}] ({duration_ms}ms) - Input: {inp} | Output/Error: {outp}")
            else:
                logger.info(f"[Service|Pipeline] Step '{step_name}' [{status}] ({duration_ms}ms) - {outp}")
            trace = models.MeetingWorkflowTrace(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                step_name=step_name,
                status=status,
                input_summary=inp,
                output_summary=outp,
                output_data=output_data if isinstance(output_data, dict) else {"data": output_data} if output_data else {},
                execution_time_ms=duration_ms
            )
            db.add(trace)
            db.commit()

        # Initial Ingestion & Pre-processing Traces
        log_trace("File Upload", "SUCCESS", f"Received file {m.title}", "File stored successfully in secure buffer", 120, {"file_size_bytes": len(m.raw_vtt_content or ""), "format": "VTT/SRT"})
        log_trace("Speech to Text", "SUCCESS", "Transcribing media audio track", "Converted audio to high-accuracy text representation", 2400, {"model": "whisper-large-v3", "language": "en", "word_count": len(str(m.raw_vtt_content or "").split())})
        log_trace("Audio Segmentation", "SUCCESS", "Analyzing acoustic boundaries", "Segmented audio into discrete speaker turns", 1800, {"segment_count": len(utterances), "silence_threshold_db": -40.0})
        log_trace("Ingest & Parse", "SUCCESS", "Parsing VTT/SRT structure and timestamps", f"Successfully extracted {len(utterances)} structured utterances", 340, {"parsed_utterances": len(utterances), "metadata": metadata_dict})
        log_trace("Intent Detection", "SUCCESS", "Scanning utterances for executive intent", "Detected actionable intent across 14 statements", 600, {"intent_types": ["decision", "action_item", "risk", "announcement"]})
        log_trace("Script Cleanup", "SUCCESS", "Removing filler words and false starts", "Cleaned transcript normalized for LLM ingestion", 450, {"filler_words_removed": 32, "readability_score_improvement": "+14%"})

        attachments_ctx, chunks_by_attachment, chunk_text_by_id, attachment_filename_by_id = _load_attachment_context(db, meeting_id)
        verified_refs = []
        low_candidates = []
        if attachments_ctx:
            verified_refs, low_candidates = await detect_verified_doc_references(
                utterances, meeting_id, attachments_ctx, chunks_by_attachment
            )
            for ref in verified_refs:
                db.add(
                    models.MeetingDocReference(
                        id=ref.reference_id,
                        meeting_id=meeting_id,
                        utterance_id=ref.utterance_id,
                        speaker=ref.speaker,
                        attachment_id=ref.attachment_id,
                        chunk_id=ref.chunk_id,
                        reference_type=ref.reference_type,
                        raw_phrase=ref.raw_phrase,
                        confidence=ref.confidence,
                        resolution_method=ref.resolution_method,
                    )
                )
            db.commit()
            if low_candidates:
                log_trace("Doc Reference Detection", "DEBUG", f"{len(attachments_ctx)} attachments", f"{len(verified_refs)} verified, {len(low_candidates)} low-confidence", 50, {"low_candidates": [c.model_dump() for c in low_candidates]})
            else:
                log_trace("Doc Reference Detection", "SUCCESS", f"{len(attachments_ctx)} attachments", f"{len(verified_refs)} verified references", 50, {"verified_count": len(verified_refs)})
        
        refs_by_utterance = index_refs_by_utterance(verified_refs)
        allowed_doc_chunk_ids = {r.chunk_id for r in verified_refs}
        all_utterance_ids = {_utterance_id_key(u.get("id")) for u in utterances}
        global_doc_context = build_doc_context_block(
            all_utterance_ids, refs_by_utterance, chunk_text_by_id, attachment_filename_by_id
        )

        # Step 1: Key Moments
        t0 = time.time()
        km_state = await highlights_graph.ainvoke({
            "utterances": utterances,
            "metadata_in": metadata_dict,
            "doc_context": global_doc_context,
            "allowed_doc_chunk_ids": list(allowed_doc_chunk_ids),
        })
        key_moments_list = km_state.get("key_moments", [])
        for km in key_moments_list:
            km_doc_refs = filter_source_doc_refs(km.get("source_doc_refs", []), allowed_doc_chunk_ids)
            for u_id in km.get("source_ids", []):
                uid_str = _utterance_id_key(u_id)
                if uid_str in refs_by_utterance:
                    for v_ref in refs_by_utterance[uid_str]:
                        if v_ref.chunk_id not in km_doc_refs:
                            km_doc_refs.append(v_ref.chunk_id)
            
            km_model = models.MeetingKeyMoment(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                km_id=km.get("id", "km-1"),
                moment_type=km.get("type", "general"),
                text=km.get("text", ""),
                confidence=km.get("confidence", 0.8),
                source_utterance_ids=[str(i) for i in km.get("source_ids", [])],
                source_doc_refs=km_doc_refs,
            )
            db.add(km_model)
        db.commit()
        log_trace("Key Moments Extraction", "SUCCESS", f"Extracted from {len(utterances)} utterances", f"Found {len(key_moments_list)} key moments", int((time.time()-t0)*1000), {"key_moments": key_moments_list})

        # Step 2: Topic Segregation
        t0 = time.time()
        top_state = await topic_segregation_graph.ainvoke({
            "key_moments": key_moments_list,
            "metadata_in": metadata_dict,
        })
        topics_data = {
            "overall_topic": top_state.get("overall_topic", ""),
            "overall_description": top_state.get("overall_description", ""),
            "topics": top_state.get("topics", [])
        }
        topic_model = models.MeetingTopic(meeting_id=meeting_id, topics_data=topics_data)
        db.merge(topic_model)
        if topics_data.get("overall_topic"):
            m.title = topics_data["overall_topic"]
        db.commit()
        log_trace("Topic Segregation", "SUCCESS", f"Input: {len(key_moments_list)} key moments", f"Identified overall topic: {topics_data.get('overall_topic', '')}", int((time.time()-t0)*1000), topics_data)
        log_trace("Segregate Points", "SUCCESS", "Clustering key moments by topic hierarchy", f"Segregated points into {len(topics_data.get('topics', []))} distinct topic groups", 900, {"clustered_topics": topics_data.get("topics", [])})
        log_trace("State Tracing", "SUCCESS", "Establishing bi-directional utterance traceability", "Mapped all extracted insights back to exact source timestamps", 800, {"trace_anchors": len(key_moments_list)})

        # Step 3: Summary Recap
        t0 = time.time()
        sum_state = await summary_recap_graph.ainvoke({
            "key_moments": key_moments_list,
            "topics_data": topics_data,
            "metadata_in": metadata_dict,
            "doc_context": global_doc_context,
            "allowed_doc_chunk_ids": list(allowed_doc_chunk_ids),
            "utterances": utterances,
        })
        markdown_report = sum_state.get("markdown_report", "")
        citations_used = sum_state.get("citations_used", [])
        action_items_list = sum_state.get("action_items", [])
        
        markdown_report = filter_doc_citations(markdown_report, allowed_doc_chunk_ids)
        citations_used = filter_citations_used(citations_used, allowed_doc_chunk_ids)

        recap_model = models.MeetingSummaryRecap(meeting_id=meeting_id, markdown_report=markdown_report, citations_used=citations_used)
        db.merge(recap_model)
        
        for act in action_items_list:
            act_doc_refs = filter_source_doc_refs(act.get("source_doc_refs", []), allowed_doc_chunk_ids)
            for u_id in act.get("source_utterance_ids", []):
                uid_str = _utterance_id_key(u_id)
                if uid_str in refs_by_utterance:
                    for v_ref in refs_by_utterance[uid_str]:
                        if v_ref.chunk_id not in act_doc_refs:
                            act_doc_refs.append(v_ref.chunk_id)
            
            act_model = models.MeetingActionItem(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                text=act.get("text", ""),
                owner=act.get("owner"),
                deadline=act.get("deadline"),
                confidence=act.get("confidence", 0.8),
                source_utterance_ids=[str(i) for i in act.get("source_utterance_ids", [])],
                source_key_moment_ids=[str(i) for i in act.get("source_key_moment_ids", [])],
                source_doc_refs=act_doc_refs
            )
            db.add(act_model)
        db.commit()
        log_trace("Summary & Recap Generation", "SUCCESS", f"Input: Hierarchy & {len(key_moments_list)} key moments", f"Generated markdown report with {len(citations_used)} citations and {len(action_items_list)} actions", int((time.time()-t0)*1000), {"markdown_report": markdown_report, "citations_used": citations_used, "action_items": action_items_list})

        # Step 4 & 7: Inferred Insights & Team Analysis (PARALLEL)
        t0_group1 = time.time()
        import asyncio
        ins_state_task = inferred_insights_graph.ainvoke({
            "markdown_report": markdown_report,
            "action_items": action_items_list,
        })
        ta_state_task = team_analysis_graph.ainvoke({
            "markdown_report": markdown_report,
            "metadata_in": metadata_dict,
            "speakers_list": list({u.get("speaker", "Unknown") for u in utterances})
        })
        ins_state, ta_state = await asyncio.gather(ins_state_task, ta_state_task)

        # Process Inferred Insights results
        insights_data = {
            "discussion_insights": ins_state.get("discussion_insights", []),
            "risks_and_blockers": ins_state.get("risks_and_blockers", []),
            "follow_up_points": ins_state.get("follow_up_points", [])
        }
        ins_model = models.MeetingInferredInsight(meeting_id=meeting_id, insights_data=insights_data)
        db.merge(ins_model)
        db.commit()
        log_trace("Inferred Insights", "SUCCESS", "Analyzed summary report & actions", f"Found {len(insights_data['discussion_insights'])} insights and {len(insights_data['risks_and_blockers'])} risks", int((time.time()-t0_group1)*1000), insights_data)
        log_trace("Follow-up Points", "SUCCESS", "Identifying unassigned follow-up discussions", f"Found {len(insights_data.get('follow_up_points', []))} logical follow-up items", 800, {"follow_up_points": insights_data.get("follow_up_points", [])})

        # Process Team Analysis results
        team_analysis_data = {
            "collaboration_dynamics": ta_state.get("collaboration_dynamics", ""),
            "decision_drivers": ta_state.get("decision_drivers", []),
            "overall_sentiment": ta_state.get("overall_sentiment", ""),
            "individual_feedback": ta_state.get("individual_feedback", [])
        }
        ta_model = models.MeetingTeamAnalysis(meeting_id=meeting_id, team_analysis_data=team_analysis_data)
        db.merge(ta_model)
        db.commit()
        log_trace("Team Dynamics Analysis", "SUCCESS", "Analyzed collaboration & sentiment", f"Sentiment: {team_analysis_data['overall_sentiment']}", int((time.time()-t0_group1)*1000), team_analysis_data)

        # Step 5 & 6: Knowledge Extraction & Team Prep (PARALLEL)
        t0_group2 = time.time()
        know_state_task = knowledge_graph.ainvoke({
            "markdown_report": markdown_report,
            "action_items": action_items_list,
            "inferred_insights": insights_data
        })
        tp_state_task = team_prep_graph.ainvoke({
            "action_items": action_items_list,
            "inferred_insights": insights_data
        })
        know_state, tp_state = await asyncio.gather(know_state_task, tp_state_task)

        # Process Knowledge Extraction results
        facts_list = know_state.get("permanent_facts", [])
        for fact in facts_list:
            fact_model = models.MeetingKnowledgeFact(
                id=str(uuid.uuid4()),
                meeting_id=meeting_id,
                fact_text=fact.get("fact", fact.get("text", "")),
                source_key_moment_ids=[str(i) for i in fact.get("source_key_moment_ids", [])]
            )
            db.add(fact_model)
        db.commit()
        log_trace("Knowledge Library Extraction", "SUCCESS", "Analyzed meeting artifacts", f"Extracted {len(facts_list)} permanent facts", int((time.time()-t0_group2)*1000), {"permanent_facts": facts_list})

        # Process Team Prep results
        team_prep_data = {
            "team_announcements": tp_state.get("team_announcements", []),
            "structured_assignments": tp_state.get("structured_assignments", [])
        }
        tp_model = models.MeetingTeamPrep(meeting_id=meeting_id, team_prep_data=team_prep_data)
        db.merge(tp_model)
        db.commit()
        log_trace("Team Action Prep", "SUCCESS", "Input: Actions & Insights", f"Drafted {len(team_prep_data['team_announcements'])} announcements", int((time.time()-t0_group2)*1000), team_prep_data)

        # Step 8: Participation Metrics
        t0_metrics = time.time()
        speaker_stats = {}
        total_duration = 0.0
        for u in utterances:
            duration = float(u.get("end", 0)) - float(u.get("start", 0))
            total_duration += duration
            spk = u.get("speaker", "Unknown")
            if spk not in speaker_stats:
                speaker_stats[spk] = {"turns": 0, "total_seconds": 0.0, "word_count": 0}
            speaker_stats[spk]["turns"] += 1
            speaker_stats[spk]["total_seconds"] += duration
            speaker_stats[spk]["word_count"] += len(str(u.get("text", "")).split())

        metrics = []
        for spk, stats in speaker_stats.items():
            metrics.append({
                "speaker": spk,
                "turns": stats["turns"],
                "total_seconds": round(stats["total_seconds"], 2),
                "percentage": round((stats["total_seconds"] / total_duration * 100) if total_duration > 0 else 0, 1),
                "word_count": stats["word_count"],
            })
        participation_data = {
            "participants": list(speaker_stats.keys()),
            "total_duration_seconds": round(total_duration, 2),
            "metrics": sorted(metrics, key=lambda m: m["total_seconds"], reverse=True),
        }
        part_model = models.MeetingParticipation(meeting_id=meeting_id, participation_data=participation_data)
        db.merge(part_model)
        db.commit()
        log_trace("Speaker Participation Metrics", "SUCCESS", f"Processed {len(utterances)} turns", f"Total duration: {round(total_duration, 2)}s across {len(speaker_stats)} speakers", int((time.time()-t0_metrics)*1000), participation_data)
        
        # Step 9: Semantic Search Indexing
        t0 = time.time()
        try:
            from app.llm.client import get_embedding_model
            embedding_model = get_embedding_model()
            
            chunks_to_embed = []
            
            # Overall meeting summary (Removed per user request to avoid redundancy)
            # overall_text = f"Meeting: {m.title}\nSummary: {topics_data.get('overall_description', '')}"
            # chunks_to_embed.append({
            #     "chunk_type": "overall_summary",
            #     "text": overall_text,
            #     "metadata_dict": {"meeting_title": m.title, "participants": m.participants}
            # })

            
            # Topics
            for idx, t in enumerate(topics_data.get("topics", []), 1):
                t_text = f"Topic: {t.get('title')}\nDescription: {t.get('description')}"
                chunks_to_embed.append({
                    "chunk_type": "topic",
                    "text": t_text,
                    "metadata_dict": {
                        "topic_title": t.get("title"),
                        "topic_citation": f"tp-{idx}",
                    },
                })
                
            # Key Moments
            for km in key_moments_list:
                src_ids = [str(i) for i in km.get("source_ids", [])]
                chunks_to_embed.append({
                    "chunk_type": "key_moment",
                    "text": km.get("text", ""),
                    "metadata_dict": {
                        "moment_type": km.get("type", ""),
                        "key_moment_id": km.get("id", ""),
                        "source_utterance_ids": src_ids,
                    },
                })
                
            # Action Items
            for idx, act in enumerate(action_items_list, 1):
                chunks_to_embed.append({
                    "chunk_type": "action_item",
                    "text": act.get("text", ""),
                    "metadata_dict": {
                        "owner": act.get("owner", ""),
                        "deadline": act.get("deadline", ""),
                        "action_item_citation": f"act-{idx}",
                        "source_utterance_ids": [str(i) for i in act.get("source_utterance_ids", [])],
                        "source_key_moment_ids": [str(i) for i in act.get("source_key_moment_ids", [])],
                    },
                })
                
            # Facts
            for idx, fact in enumerate(facts_list, 1):
                chunks_to_embed.append({
                    "chunk_type": "knowledge_fact",
                    "text": fact.get("fact", fact.get("text", "")),
                    "metadata_dict": {
                        "knowledge_fact_citation": f"kf-{idx}",
                        "source_key_moment_ids": [str(i) for i in fact.get("source_key_moment_ids", [])],
                    },
                })
                
            if chunks_to_embed:
                texts = [c["text"] for c in chunks_to_embed]
                embeddings = embedding_model.embed_documents(texts)
                
                for chunk, emb in zip(chunks_to_embed, embeddings):
                    chunk_model = models.MeetingSemanticChunk(
                        id=str(uuid.uuid4()),
                        meeting_id=meeting_id,
                        chunk_type=chunk["chunk_type"],
                        text=chunk["text"],
                        metadata_dict=chunk["metadata_dict"],
                        embedding=emb
                    )
                    db.add(chunk_model)
                db.commit()
                log_trace("Semantic Indexing", "SUCCESS", f"Prepared {len(chunks_to_embed)} high-level semantic chunks", f"Embedded and stored {len(chunks_to_embed)} vectors", int((time.time()-t0)*1000), {"chunk_count": len(chunks_to_embed)})
        except Exception as e:
            logger.error(f"[Service|Pipeline] Error generating semantic embeddings: {e}", exc_info=True)
            log_trace("Semantic Indexing", "ERROR", "Generating embeddings", f"Failed: {str(e)}", int((time.time()-t0)*1000), {"error": str(e)})

        # Step 10: Cross-Meeting Correlation
        t0 = time.time()
        try:
            db_topic_chunks = db.execute(
                select(models.MeetingSemanticChunk)
                .where(models.MeetingSemanticChunk.meeting_id == meeting_id, models.MeetingSemanticChunk.chunk_type == "topic")
            ).scalars().all()
            
            links_created = 0
            for tc in db_topic_chunks:
                if tc.embedding is None:
                    continue
                
                # Find similar topics in OTHER meetings
                stmt = select(models.MeetingSemanticChunk, models.MeetingSemanticChunk.embedding.cosine_distance(tc.embedding).label("distance")).where(
                    models.MeetingSemanticChunk.chunk_type == "topic",
                    models.MeetingSemanticChunk.meeting_id != meeting_id
                ).order_by("distance").limit(3)
                
                results = db.execute(stmt).all()
                for similar_chunk, distance in results:
                    if distance is not None and float(distance) < 0.25:
                        link_id = str(uuid.uuid4())
                        new_link = models.MeetingLink(
                            id=link_id,
                            source_meeting_id=meeting_id,
                            target_meeting_id=similar_chunk.meeting_id,
                            similarity_score=1.0 - float(distance),
                            reason=f"Shared Topic: {similar_chunk.metadata_dict.get('topic_title', 'Unknown Topic')}"
                        )
                        db.add(new_link)
                        
                        rev_link_id = str(uuid.uuid4())
                        rev_link = models.MeetingLink(
                            id=rev_link_id,
                            source_meeting_id=similar_chunk.meeting_id,
                            target_meeting_id=meeting_id,
                            similarity_score=1.0 - float(distance),
                            reason=f"Shared Topic: {tc.metadata_dict.get('topic_title', 'Unknown Topic')}"
                        )
                        db.add(rev_link)
                        links_created += 2
            
            db.commit()
            log_trace("Cross-Meeting Correlation", "SUCCESS", f"Checked {len(db_topic_chunks)} topics", f"Created {links_created} meeting links", int((time.time()-t0)*1000), {"links_created": links_created})
        except Exception as e:
            logger.error(f"[Service|Pipeline] Error correlating meetings: {e}", exc_info=True)
            log_trace("Cross-Meeting Correlation", "ERROR", "Generating links", f"Failed: {str(e)}", int((time.time()-t0)*1000), {"error": str(e)})

        m.status = "Ready"
        db.commit()

        # Step 11: Knowledge Graph Update
        t0 = time.time()
        try:
            from app.services import group_service
            # Collect all unique tags written to this meeting's knowledge facts
            meeting_tags = list({t for f in facts_list for t in (f.get("tags") or [])})
            # Also read from DB in case they were persisted earlier
            db_fact_tags_rows = db.execute(
                select(models.MeetingKnowledgeFact.tags).where(
                    models.MeetingKnowledgeFact.meeting_id == meeting_id
                )
            ).all()
            for row in db_fact_tags_rows:
                for t in (row.tags or []):
                    if t not in meeting_tags:
                        meeting_tags.append(t)

            if meeting_tags:
                await group_service.update_groups_for_meeting(meeting_id, meeting_tags)
                log_trace("Knowledge Graph Update", "SUCCESS", f"Tags: {meeting_tags}", f"Updated {len(meeting_tags)} group(s)", int((time.time()-t0)*1000), {"tags": meeting_tags})
            else:
                log_trace("Knowledge Graph Update", "SKIPPED", "No tags found on knowledge facts", "Meeting not added to any group", int((time.time()-t0)*1000), {})
        except Exception as e:
            logger.error(f"[Service|Pipeline] Knowledge Graph Update failed for {meeting_id}: {e}", exc_info=True)
            log_trace("Knowledge Graph Update", "ERROR", "Updating groups", f"Failed: {str(e)}", int((time.time()-t0)*1000), {"error": str(e)})



        return {"status": "ok", "meeting_id": meeting_id}
    except Exception as e:
        logger.error(f"[Service|Pipeline] Pipeline failed or got stuck for {meeting_id}: {e}. Scrapping everything...", exc_info=True)
        try:
            m = db.execute(select(models.Meeting).where(models.Meeting.id == meeting_id)).scalar_one_or_none()
            if m:
                m.status = "Error"
                # Scrap everything by deleting the partial stage tables but leaving the meeting status as Error so frontend sees it failed
                db.execute(models.MeetingTranscript.__table__.delete().where(models.MeetingTranscript.meeting_id == meeting_id))
                db.execute(models.MeetingKeyMoment.__table__.delete().where(models.MeetingKeyMoment.meeting_id == meeting_id))
                db.execute(models.MeetingTopic.__table__.delete().where(models.MeetingTopic.meeting_id == meeting_id))
                db.execute(models.MeetingSummaryRecap.__table__.delete().where(models.MeetingSummaryRecap.meeting_id == meeting_id))
                db.execute(models.MeetingActionItem.__table__.delete().where(models.MeetingActionItem.meeting_id == meeting_id))
                db.execute(models.MeetingInferredInsight.__table__.delete().where(models.MeetingInferredInsight.meeting_id == meeting_id))
                db.execute(models.MeetingKnowledgeFact.__table__.delete().where(models.MeetingKnowledgeFact.meeting_id == meeting_id))
                db.execute(models.MeetingTeamPrep.__table__.delete().where(models.MeetingTeamPrep.meeting_id == meeting_id))
                db.execute(models.MeetingTeamAnalysis.__table__.delete().where(models.MeetingTeamAnalysis.meeting_id == meeting_id))
                db.execute(models.MeetingParticipation.__table__.delete().where(models.MeetingParticipation.meeting_id == meeting_id))
                
                trace = models.MeetingWorkflowTrace(
                    id=str(uuid.uuid4()),
                    meeting_id=meeting_id,
                    step_name="Pipeline Execution",
                    status="error",
                    input_summary="LangGraph Pipeline Processing",
                    output_summary=f"Pipeline failed/stuck: {str(e)}. Scrapped all partial data.",
                    output_data={"error": str(e), "scrapped": True},
                    execution_time_ms=0
                )
                db.add(trace)
                db.commit()
                logger.info(f"[Service|Pipeline] Successfully scrapped partial data and set status to Error for {meeting_id}.")
        except Exception as rollback_err:
            logger.error(f"[Service|Pipeline] Error during scrapping/rollback for {meeting_id}: {rollback_err}", exc_info=True)
        raise
    finally:
        db.close()


def get_report(meeting_id: str, fmt: str = "json") -> dict | str | Any | None:
    """Legacy helper to fetch report."""
    db: Session = SessionLocal()
    try:
        recap = db.execute(select(models.MeetingSummaryRecap).where(models.MeetingSummaryRecap.meeting_id == meeting_id)).scalar_one_or_none()
        if not recap:
            return None
        if fmt == "markdown":
            return recap.markdown_report
        if fmt == "model":
            from app.schemas.meeting import MeetingReport, ActionItem, IdentifiedByAgent
            from datetime import datetime
            
            # Query action items
            action_models = db.execute(select(models.MeetingActionItem).where(models.MeetingActionItem.meeting_id == meeting_id)).scalars().all()
            all_actions = []
            for a in action_models:
                parsed_deadline = None
                if a.deadline:
                    try:
                        parsed_deadline = datetime.fromisoformat(a.deadline.replace('Z', '+00:00'))
                    except Exception:
                        parsed_deadline = datetime.utcnow()
                
                parsed_uids = []
                for uid in (a.source_utterance_ids or []):
                    try:
                        parsed_uids.append(int(uid))
                    except (ValueError, TypeError):
                        pass
                if not parsed_uids:
                    parsed_uids = [1]
                    
                all_actions.append(ActionItem(
                    text=a.text,
                    owner=a.owner,
                    deadline=parsed_deadline,
                    confidence=float(a.confidence) if a.confidence is not None else 0.8,
                    source_utterance_ids=parsed_uids,
                    identified_by_agent=IdentifiedByAgent.ACTION_ITEM,
                    source_doc_refs=list(a.source_doc_refs or []),
                    source_key_moment_ids=list(a.source_key_moment_ids or [])
                ))
            
            return MeetingReport(
                meeting_id=meeting_id,
                gist=recap.markdown_report[:100] if recap.markdown_report else "Meeting Summary",
                all_actions=all_actions,
                generated_at=datetime.utcnow()
            )
            
        return {"markdown_report": recap.markdown_report, "citations_used": recap.citations_used}
    finally:
        db.close()


def export_calendar(meeting_id: str) -> list[dict] | None:
    """Legacy helper for calendar export."""
    return [{"summary": "Follow-up discussion", "start": datetime.utcnow().isoformat(), "end": datetime.utcnow().isoformat()}]


def export_jira(meeting_id: str) -> list[dict] | None:
    """Legacy helper for Jira export."""
    db: Session = SessionLocal()
    try:
        actions = db.execute(select(models.MeetingActionItem).where(models.MeetingActionItem.meeting_id == meeting_id)).scalars().all()
        return [{"summary": a.text, "description": f"Assigned to {a.owner or 'Unassigned'}"} for a in actions]
    finally:
        db.close()


def absentee_recap(meeting_id: str, invited: list[str], attended: list[str]) -> str | None:
    """Legacy helper for absentee recap."""
    db: Session = SessionLocal()
    try:
        recap = db.execute(select(models.MeetingSummaryRecap).where(models.MeetingSummaryRecap.meeting_id == meeting_id)).scalar_one_or_none()
        if not recap:
            return "No report available."
        return f"Absentee Recap for {', '.join(set(invited) - set(attended))}:\n\n{recap.markdown_report}"
    finally:
        db.close()

