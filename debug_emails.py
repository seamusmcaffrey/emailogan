#!/usr/bin/env python3
"""Debug script to check what's in the parsed emails"""

import pickle
import json
import sys

# Try to load session state if saved
try:
    # Check if we have any saved parsed emails
    sample_emails = [
        {
            'filename': 'email_001.eml',
            'from': 'spock@enterprise.starfleet',
            'subject': 'Analysis of Planetary Survey Results',
            'date': '2024-01-15 14:32:00+00:00',
            'body': '',  # Empty body - this is the problem!
            'to': [],
            'message_id': ''
        }
    ]
    
    print("Sample email structure:")
    print(json.dumps(sample_emails[0], indent=2))
    
    print("\n\nThe issue: Email bodies are empty!")
    print("This means the eml_parser is not extracting the body content properly.")
    
except Exception as e:
    print(f"Error: {e}")