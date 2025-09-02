#!/usr/bin/env python3
"""Test the email parser to see if it extracts body content"""

import eml_parser

# Read a sample email
with open('sampleEmails/email_001.eml', 'rb') as f:
    raw_email = f.read()

# Parse it
ep = eml_parser.EmlParser()
parsed = ep.decode_email_bytes(raw_email)

print("Header info:")
print(f"  From: {parsed.get('header', {}).get('from', 'Not found')}")
print(f"  Subject: {parsed.get('header', {}).get('subject', 'Not found')}")

print("\nBody structure:")
body = parsed.get('body', [])
print(f"  Number of body parts: {len(body)}")

if body:
    for i, part in enumerate(body):
        print(f"\n  Part {i}:")
        print(f"    Keys: {part.keys() if isinstance(part, dict) else 'Not a dict'}")
        if 'content' in part:
            content = part['content']
            print(f"    Content length: {len(content)} chars")
            print(f"    First 200 chars: {content[:200]}...")
        else:
            print("    No 'content' key found")
else:
    print("  No body parts found!")

print("\n\nFull parsed structure keys:")
print(parsed.keys())