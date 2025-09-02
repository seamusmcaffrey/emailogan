#!/usr/bin/env python3
"""Test script to verify style learning from emails"""

import logging
import sys

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

# Sample Spock-style email for testing
sample_spock_emails = [
    {
        'filename': 'email_001.eml',
        'from': 'spock@enterprise.starfleet',
        'subject': 'Analysis of Planetary Survey Results',
        'body': """Greetings,

I have completed my analysis of the recent planetary survey data. The findings are most fascinating.

The atmospheric composition shows 78.2% nitrogen, 20.9% oxygen, with trace amounts of argon and carbon dioxide. These readings are within acceptable parameters for human habitation, though I recommend further analysis of potential microbial life forms.

Logic dictates that we proceed with caution. The probability of success increases by 47.3% if we conduct additional scans before commencing the landing sequence.

Live long and prosper,
Commander Spock
Science Officer, USS Enterprise""",
        'date': '2024-01-15 14:32:00+00:00'
    },
    {
        'filename': 'email_002.eml',
        'from': 'spock@enterprise.starfleet',
        'subject': 'Re: Your Emotional Assessment Request',
        'body': """Captain,

Your request for an emotional assessment is illogical. As a Vulcan, I do not experience emotions in the manner you describe.

However, I acknowledge that understanding crew morale is essential for mission success. Statistical analysis indicates crew efficiency has increased by 12.7% since implementing the new duty roster.

I find your concern for the crew's wellbeing... appropriate.

Regards,
Spock""",
        'date': '2024-01-16 09:15:00+00:00'
    }
]

def test_find_relevant_emails():
    """Test the email relevance finding logic"""
    from response_generator import ResponseGenerator
    
    generator = ResponseGenerator()
    
    # Test 1: Finding emails from same sender
    logger.info("Test 1: Finding emails from same sender")
    relevant = generator.find_relevant_emails_direct(
        'spock@enterprise.starfleet',
        sample_spock_emails,
        limit=5
    )
    logger.info(f"Found {len(relevant)} emails from Spock")
    
    # Test 2: Finding emails from different sender (should now return all emails)
    logger.info("\nTest 2: Finding emails from different sender")
    relevant = generator.find_relevant_emails_direct(
        'sean.w.meehan@gmail.com',
        sample_spock_emails,
        limit=5
    )
    logger.info(f"Found {len(relevant)} emails for style reference")
    
    if relevant:
        logger.info("Email preview from context:")
        logger.info(f"From: {relevant[0].get('sender')}")
        logger.info(f"Subject: {relevant[0].get('subject')}")
        logger.info(f"Preview: {relevant[0].get('body_preview')[:100]}...")
    
    # Test 3: Build context
    logger.info("\nTest 3: Building context from emails")
    context = generator.build_context_from_emails(relevant[:2])
    logger.info("Context built successfully")
    logger.info(f"Context length: {len(context)} characters")
    print("\n=== CONTEXT ===")
    print(context)
    print("=== END CONTEXT ===")

if __name__ == "__main__":
    try:
        test_find_relevant_emails()
        print("\n✅ All tests passed!")
    except Exception as e:
        logger.error(f"Test failed: {str(e)}", exc_info=True)
        print("\n❌ Tests failed!")