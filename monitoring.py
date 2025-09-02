import streamlit as st
import logging
import traceback
from datetime import datetime

def setup_logging():
    """Configure logging for the application"""
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
        ]
    )
    return logging.getLogger(__name__)

def error_handler(func):
    """Decorator for handling errors gracefully"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            logger = setup_logging()
            logger.error(f"Error in {func.__name__}: {str(e)}")
            logger.error(traceback.format_exc())
            
            st.error(f"An error occurred: {str(e)}")
            
            if st.checkbox("Show technical details"):
                st.code(traceback.format_exc())
            
            return None
    return wrapper

@error_handler
def safe_file_processing(uploaded_files):
    """Safely process uploaded files with error handling"""
    pass