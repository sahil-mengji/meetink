import requests
import json
import time

base = "http://localhost:8000/meetings"

vtt = """WEBVTT

00:00:00.000 --> 00:00:05.000
Alice: Hello everyone.

00:00:05.000 --> 00:00:10.000
Bob: Hi Alice, let's start.

00:00:10.000 --> 00:00:15.000
Alice: Okay, I am sharing my screen.
"""
files = {'file': ('short.vtt', vtt, 'text/vtt')}
data = {'title': 'Short Meeting'}
try:
    r1 = requests.post(f"{base}/upload", files=files, data=data)
    if r1.status_code != 200:
        print("Upload failed:", r1.text)
        exit(1)
    mid = r1.json()["meeting_id"]
    print("Uploaded:", mid)

    print("Processing...")
    r2 = requests.post(f"{base}/{mid}/process")
    if r2.status_code != 200:
        print("Process failed:", r2.text)
        exit(1)

    r3 = requests.get(f"{base}/{mid}")
    report = r3.json().get("markdown_report")
    print("Report:", report)
except Exception as e:
    print("Connection failed:", e)
