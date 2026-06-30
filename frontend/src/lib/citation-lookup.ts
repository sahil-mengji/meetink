import type { MeetingDetail } from "@/lib/api";

export interface SourceSentence {
  id?: string;
  speaker?: string;
  text?: string;
  time?: string | number;
  fallbackTitle?: string;
  fallbackText?: string;
  storagePath?: string;
  locatorValue?: string;
}

export const formatCitationTime = (seconds?: number) => {
  if (seconds === undefined || isNaN(seconds)) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

const UUID_PREFIX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/** Inner tag body (without brackets), e.g. "0", "km-1", "uuid:12", "0:186". */
export const CITATION_TAG_INNER =
  /(?:[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}:[^\]]+|[0-9]+:[0-9]+|(?:doc-|km-|act-|tp-|ii-|kf-|ta-|pa-)?(?:[0-9]+|sum))/i;

export const CITATION_REGEX = new RegExp(`(\\[(?:${CITATION_TAG_INNER.source})\\])`, "gi");

const EXACT_CITATION_TAG = new RegExp(`^${CITATION_TAG_INNER.source}$`, "i");

export function isCitationBracket(part: string): boolean {
  if (!part.startsWith("[") || !part.endsWith("]")) return false;
  return EXACT_CITATION_TAG.test(part.slice(1, -1));
}

export function parseCitationTag(
  tag: string,
  defaultMeetingId?: string,
): { meetingId?: string; entityId: string; timeHintSeconds?: number } {
  const trimmed = tag.trim();
  if (!trimmed.includes(":")) {
    return { meetingId: defaultMeetingId, entityId: trimmed };
  }

  const colonIdx = trimmed.indexOf(":");
  const first = trimmed.slice(0, colonIdx);
  const rest = trimmed.slice(colonIdx + 1);

  if (UUID_PREFIX.test(first)) {
    return { meetingId: first, entityId: rest };
  }

  // utterance:timestamp shorthand e.g. [0:186]
  if (/^\d+$/.test(first) && /^\d+$/.test(rest)) {
    return {
      meetingId: defaultMeetingId,
      entityId: first,
      timeHintSeconds: parseInt(rest, 10),
    };
  }

  if (defaultMeetingId) {
    return { meetingId: defaultMeetingId, entityId: trimmed };
  }

  return { meetingId: first, entityId: rest };
}

const findByPrefixedIndex = <T>(items: T[] | undefined, tag: string, prefix: string): T | undefined => {
  if (!items?.length || !tag.startsWith(prefix)) return undefined;
  const idMatch = items.find((item) => String((item as { id?: string }).id).toLowerCase() === tag.toLowerCase());
  if (idMatch) return idMatch;
  const num = parseInt(tag.replace(/[^\d]/g, ""), 10);
  if (isNaN(num) || num < 1) return undefined;
  return items[num - 1];
};

const resolveKeyMomentIds = (meeting: MeetingDetail, kmIds: unknown[], rawUtteranceIds: unknown[], rawDocChunkIds: string[]) => {
  kmIds.forEach((kmId) => {
    let kmObj = meeting.key_moments?.find((k) => String(k.id).toLowerCase() === String(kmId).toLowerCase());
    if (!kmObj) {
      const kmIdx = parseInt(String(kmId).replace(/[^\d]/g, ""), 10) - 1;
      if (!isNaN(kmIdx)) kmObj = meeting.key_moments?.[kmIdx];
    }
    if (kmObj?.source_ids) rawUtteranceIds.push(...kmObj.source_ids);
    if (kmObj?.source_doc_refs) rawDocChunkIds.push(...kmObj.source_doc_refs);
  });
};

/** Resolve a citation tag (e.g. "0", "km-1", "act-2") to transcript/doc sources. */
export const lookupCitationSources = (tag: string, meeting: MeetingDetail | null): SourceSentence[] => {
  if (!meeting) return [];

  const cleanTag = tag.trim().toLowerCase();
  const rawUtteranceIds: unknown[] = [];
  const rawDocChunkIds: string[] = [];
  let fallbackTitle = "";
  let fallbackText = "";

  if (cleanTag.startsWith("km-")) {
    const km = findByPrefixedIndex(meeting.key_moments, cleanTag, "km-");
    if (km) {
      fallbackTitle = km.type || "Key Moment";
      fallbackText = km.text;
      if (Array.isArray(km.source_ids)) rawUtteranceIds.push(...km.source_ids);
      if (Array.isArray(km.source_doc_refs)) rawDocChunkIds.push(...km.source_doc_refs);
    }
  } else if (cleanTag.startsWith("act-")) {
    const act = findByPrefixedIndex(meeting.action_items, cleanTag, "act-");
    if (act) {
      fallbackTitle = `Action: ${act.owner || "Unassigned"}`;
      fallbackText = act.text;
      if (Array.isArray(act.source_utterance_ids)) rawUtteranceIds.push(...act.source_utterance_ids);
      if (Array.isArray(act.source_doc_refs)) rawDocChunkIds.push(...act.source_doc_refs);
      if (Array.isArray(act.source_key_moment_ids)) {
        resolveKeyMomentIds(meeting, act.source_key_moment_ids, rawUtteranceIds, rawDocChunkIds);
      }
    }
  } else if (cleanTag.startsWith("tp-")) {
    const num = parseInt(cleanTag.replace(/[^\d]/g, ""), 10);
    const idx = Math.max(0, num - 1);
    const tp = meeting.topics_data?.topics?.[idx];
    if (tp) {
      fallbackTitle = tp.name || tp.title || "Topic";
      fallbackText = tp.description || tp.text || "";
      const sIds = tp.source_ids || tp.utterance_ids || tp.source_utterance_ids;
      if (Array.isArray(sIds)) rawUtteranceIds.push(...sIds);
      if (Array.isArray(tp.source_key_moment_ids)) {
        resolveKeyMomentIds(meeting, tp.source_key_moment_ids, rawUtteranceIds, rawDocChunkIds);
      }
    }
  } else if (cleanTag.startsWith("kf-")) {
    const num = parseInt(cleanTag.replace(/[^\d]/g, ""), 10);
    const idx = Math.max(0, num - 1);
    const kf = meeting.knowledge_facts?.[idx];
    if (kf) {
      fallbackTitle = "Knowledge Fact";
      fallbackText = kf.text;
      const sIds = (kf as { source_ids?: string[]; source_utterance_ids?: string[] }).source_ids
        || (kf as { source_utterance_ids?: string[] }).source_utterance_ids;
      if (Array.isArray(sIds)) rawUtteranceIds.push(...sIds);
      if (Array.isArray(kf.source_key_moment_ids)) {
        resolveKeyMomentIds(meeting, kf.source_key_moment_ids, rawUtteranceIds, rawDocChunkIds);
      }
    }
  } else if (cleanTag.startsWith("ii-")) {
    const num = parseInt(cleanTag.replace(/[^\d]/g, ""), 10);
    const idx = Math.max(0, num - 1);
    const ii = meeting.inferred_insights?.discussion_insights?.[idx]
      || meeting.inferred_insights?.risks_and_blockers?.[idx];
    if (ii) {
      fallbackTitle = ii.insight ? "Discussion Insight" : "Risk / Blocker";
      fallbackText = ii.insight || ii.description || ii.risk || ii.text || "";
      const sIds = ii.source_ids || ii.utterance_ids || ii.source_utterance_ids;
      if (Array.isArray(sIds)) rawUtteranceIds.push(...sIds);
      if (Array.isArray(ii.source_key_moment_ids)) {
        resolveKeyMomentIds(meeting, ii.source_key_moment_ids, rawUtteranceIds, rawDocChunkIds);
      }
    }
  } else if (cleanTag.startsWith("ta-")) {
    const num = parseInt(cleanTag.replace(/[^\d]/g, ""), 10);
    const idx = Math.max(0, num - 1);
    const ta = meeting.team_analysis?.decision_drivers?.[idx];
    if (ta) {
      fallbackTitle = "Decision Driver";
      fallbackText = ta.driver || ta.description || ta.text || "";
      const sIds = ta.source_ids || ta.utterance_ids || ta.source_utterance_ids;
      if (Array.isArray(sIds)) rawUtteranceIds.push(...sIds);
      if (Array.isArray(ta.source_key_moment_ids)) {
        resolveKeyMomentIds(meeting, ta.source_key_moment_ids, rawUtteranceIds, rawDocChunkIds);
      }
    }
  } else if (/^\d+$/.test(cleanTag)) {
    // Pure numeric tag = transcript utterance ID (0-based), not a list index
    rawUtteranceIds.push(cleanTag);
  } else if (cleanTag.startsWith("doc-") || cleanTag.length > 8) {
    const chunk = meeting.attachment_chunks?.find(
      (c) => c.chunk_id.toLowerCase() === cleanTag.toLowerCase()
        || c.chunk_id.toLowerCase().includes(cleanTag.replace("doc-", "")),
    );
    if (chunk) {
      rawDocChunkIds.push(chunk.chunk_id);
      const docRefs = meeting.doc_references?.filter((dr) => dr.chunk_id === chunk.chunk_id);
      docRefs?.forEach((dr) => {
        if (dr.utterance_id) rawUtteranceIds.push(dr.utterance_id);
      });
      const attachment = meeting.attachments?.find(
        (a) => a.id === chunk.attachment_id || (a as { attachment_id?: string }).attachment_id === chunk.attachment_id,
      );
      fallbackTitle = attachment?.filename
        ? `${attachment.filename} (${chunk.locator_type} ${chunk.locator_value})`
        : `Document (${chunk.locator_type} ${chunk.locator_value})`;
      fallbackText = chunk.text;
    }
  }

  const results: SourceSentence[] = [];
  const uniqueUtteranceIds = Array.from(new Set(rawUtteranceIds.map(String)));

  uniqueUtteranceIds.forEach((targetId) => {
    const matched = meeting.transcript?.find((u) => String(u.id) === targetId);
    if (matched) {
      results.push({
        id: matched.id,
        speaker: matched.speaker || "Speaker",
        text: matched.text,
        time: formatCitationTime(matched.start),
      });
    }
  });

  Array.from(new Set(rawDocChunkIds)).forEach((chunkId) => {
    const chunk = meeting.attachment_chunks?.find(
      (c) => String(c.chunk_id).toLowerCase() === String(chunkId).toLowerCase(),
    );
    if (chunk) {
      const attachment = meeting.attachments?.find(
        (a) => a.id === chunk.attachment_id || (a as { attachment_id?: string }).attachment_id === chunk.attachment_id,
      );
      results.push({
        fallbackTitle: attachment?.filename
          ? `📄 ${attachment.filename} (${chunk.locator_type} ${chunk.locator_value})`
          : `📄 Document (${chunk.locator_type} ${chunk.locator_value})`,
        fallbackText: chunk.text,
        storagePath: attachment?.storage_path,
        locatorValue: chunk.locator_value,
        time: "Doc Ref",
      });
    }
  });

  if (results.length === 0 && fallbackText) {
    results.push({
      fallbackTitle: fallbackTitle || "Reference Source",
      fallbackText,
      time: "source",
    });
  }

  return results;
};
