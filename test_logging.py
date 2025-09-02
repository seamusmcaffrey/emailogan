#!/usr/bin/env python3
"""Test script to verify logging is working"""

import logging
import sys

# Setup logging to match app.py
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('emailogan.log')
    ]
)

logger = logging.getLogger(__name__)

def test_logging():
    logger.debug("This is a DEBUG message")
    logger.info("This is an INFO message")
    logger.warning("This is a WARNING message")
    logger.error("This is an ERROR message")
    
    print("\n✅ Logging test complete!")
    print("Check 'emailogan.log' file for the log entries")
    print("\nTo view logs in real-time while running the app:")
    print("  tail -f emailogan.log")
    print("\nTo clear the log file:")
    print("  > emailogan.log")

if __name__ == "__main__":
    test_logging()