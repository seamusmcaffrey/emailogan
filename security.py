import hashlib
import hmac
import streamlit as st
from datetime import datetime, timedelta

class SecurityManager:
    def __init__(self):
        self.session_timeout = 3600
    
    def hash_email_content(self, content: str) -> str:
        """Hash email content for privacy"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def validate_session(self):
        """Check session validity"""
        if 'session_start' not in st.session_state:
            st.session_state['session_start'] = datetime.now()
        
        session_age = datetime.now() - st.session_state['session_start']
        if session_age.seconds > self.session_timeout:
            st.session_state.clear()
            st.error("Session expired. Please refresh the page.")
            st.stop()
    
    def sanitize_input(self, text: str) -> str:
        """Basic input sanitization"""
        dangerous_chars = ['<', '>', '"', "'", '&', '`']
        for char in dangerous_chars:
            text = text.replace(char, '')
        return text.strip()

def security_middleware():
    security = SecurityManager()
    security.validate_session()
    return security