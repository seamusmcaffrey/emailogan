#!/usr/bin/env python3
"""Direct test to show the issue"""

# Sample data showing what's likely happening
parsed_emails_sample = [
    {
        'filename': 'email_001.eml',
        'from': 'spock@enterprise.starfleet', 
        'subject': 'Analysis of Planetary Survey Results',
        'body': '',  # THIS IS THE PROBLEM - body is empty!
        'date': '2024-01-15 14:32:00+00:00'
    },
    {
        'filename': 'email_002.eml',
        'from': 'spock@enterprise.starfleet',
        'subject': 'Re: Your Emotional Assessment Request', 
        'body': '',  # Empty again!
        'date': '2024-01-16 09:15:00+00:00'
    }
]

print("The problem is that email bodies are EMPTY after parsing!")
print("This is why the LLM can't mimic Spock's style - it has no content to learn from.")
print("\nIn the logs, we see:")
print("- Content: (empty)")
print("\nThis means the eml_parser isn't extracting the body text properly.")