import eml_parser
import streamlit as st
import pandas as pd
from typing import List, Dict, Optional
import json
import hashlib
from datetime import datetime
from collections import Counter

class EmailProcessor:
    def __init__(self):
        self.parsed_emails = []
    
    def parse_eml_files(self, uploaded_files) -> List[Dict]:
        """Parse multiple .eml files and extract structured data"""
        parsed_data = []
        
        progress_bar = st.progress(0)
        status_text = st.empty()
        
        for idx, uploaded_file in enumerate(uploaded_files):
            try:
                raw_email = uploaded_file.read()
                
                # Store raw email for fallback parsing
                self._last_raw_email = raw_email
                
                ep = eml_parser.EmlParser()
                parsed_eml = ep.decode_email_bytes(raw_email)
                
                email_data = self.extract_email_info(parsed_eml, uploaded_file.name)
                
                # If no body was extracted, try manual parsing
                if not email_data['body']:
                    try:
                        raw_str = raw_email.decode('utf-8', errors='ignore')
                        # Simple approach for plain text emails
                        if '\n\n' in raw_str:
                            potential_body = raw_str.split('\n\n', 1)[1]
                            email_data['body'] = potential_body.strip()
                            st.success(f"✅ Recovered body for {uploaded_file.name} using fallback")
                        elif '\r\n\r\n' in raw_str:
                            potential_body = raw_str.split('\r\n\r\n', 1)[1]
                            email_data['body'] = potential_body.strip()
                            st.success(f"✅ Recovered body for {uploaded_file.name} using fallback")
                    except:
                        pass
                
                parsed_data.append(email_data)
                
                progress = (idx + 1) / len(uploaded_files)
                progress_bar.progress(progress)
                status_text.text(f"Processing {uploaded_file.name}...")
                
            except Exception as e:
                st.error(f"Error processing {uploaded_file.name}: {str(e)}")
        
        status_text.text("✅ All files processed successfully!")
        
        # Clear the stored raw email
        self._last_raw_email = None
        
        return parsed_data
    
    def extract_email_info(self, parsed_eml: Dict, filename: str) -> Dict:
        """Extract and structure relevant email information"""
        header = parsed_eml.get('header', {})
        body = parsed_eml.get('body', [])
        
        email_body = ""
        
        # Try to extract body content - eml_parser structure can vary
        if body:
            for part in body:
                if isinstance(part, dict):
                    # Try different possible keys for content
                    if 'content' in part:
                        email_body += part['content']
                    elif 'raw' in part:
                        email_body += part['raw']
                    # Sometimes the content is in a nested structure
                    elif 'content_header' in part:
                        # This means content might be elsewhere or needs different handling
                        pass
                elif isinstance(part, str):
                    email_body += part
        
        # If still no body, try alternative parsing approaches
        if not email_body:
            # Try to get raw body if available
            if 'raw_body' in parsed_eml:
                email_body = parsed_eml['raw_body']
            # Sometimes the whole email text is stored differently
            elif 'body_text' in parsed_eml:
                email_body = parsed_eml['body_text']
            # As a last resort, try to read the raw email directly
            elif not email_body and hasattr(self, '_last_raw_email'):
                # Parse the raw email manually for simple plain text emails
                try:
                    raw_str = self._last_raw_email.decode('utf-8', errors='ignore')
                    # Find the body after the headers (separated by blank line)
                    if '\n\n' in raw_str:
                        email_body = raw_str.split('\n\n', 1)[1]
                    elif '\r\n\r\n' in raw_str:
                        email_body = raw_str.split('\r\n\r\n', 1)[1]
                except:
                    pass
        
        # Clean up the body text
        email_body = email_body.strip() if email_body else ""
        
        # Debug output (reduced)
        if not email_body:
            st.warning(f"⚠️ No body extracted from {filename} - trying fallback method")
        
        return {
            'filename': filename,
            'from': header.get('from', ''),
            'to': header.get('to', []),
            'subject': header.get('subject', ''),
            'date': header.get('date', ''),
            'body': email_body,
            'message_id': header.get('message-id', [''])[0] if header.get('message-id') else '',
            'processed_at': datetime.now().isoformat()
        }
    
    def detect_user_email(self, parsed_emails: List[Dict]) -> Optional[str]:
        """
        Detect the user's email address from the corpus by analyzing 
        the most common sender in the email collection
        """
        if not parsed_emails:
            return None
        
        # Count frequency of each sender email
        senders = [email.get('from', '') for email in parsed_emails if email.get('from')]
        
        # Parse emails to extract just the email address (remove names)
        email_addresses = []
        for sender in senders:
            # Extract email from formats like "Name <email@domain.com>" or just "email@domain.com"
            if '<' in sender and '>' in sender:
                email = sender.split('<')[1].split('>')[0].strip().lower()
            else:
                email = sender.strip().lower()
            if '@' in email:
                email_addresses.append(email)
        
        if not email_addresses:
            return None
        
        # Find the most common email (likely the user's)
        email_counter = Counter(email_addresses)
        most_common = email_counter.most_common(1)
        
        if most_common:
            user_email = most_common[0][0]
            confidence = most_common[0][1] / len(email_addresses)
            
            # Only return if we have reasonable confidence (>30% of emails)
            if confidence > 0.3:
                return user_email
        
        return None

def create_vector_database(parsed_emails):
    """Main function to create vector database"""
    import logging
    logger = logging.getLogger(__name__)
    
    logger.info(f"Starting vector database creation with {len(parsed_emails)} emails")
    
    if not parsed_emails:
        st.error("No emails to process")
        logger.error("No emails provided to create_vector_database")
        return
    
    try:
        from vector_manager import VectorManager
        vector_manager = VectorManager()
        
        logger.info("VectorManager initialized, creating vector store...")
        index = vector_manager.create_vector_store(parsed_emails)
        
        if index:
            st.session_state['vector_index'] = index
            st.session_state['vector_ready'] = True
            logger.info("Vector database created and stored in session state")
            
            st.balloons()
            st.success("🎉 Your email knowledge base is ready!")
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("📧 Emails Processed", len(parsed_emails))
            with col2:
                unique_senders = len(set([email['from'] for email in parsed_emails]))
                st.metric("👥 Unique Senders", unique_senders)
            with col3:
                st.metric("🗃️ Vector Dimensions", 1536)
            
            return index
        else:
            logger.error("Vector store creation returned None")
            st.error("Failed to create vector database - no index returned")
            return None
            
    except Exception as e:
        logger.error(f"Error creating vector database: {str(e)}", exc_info=True)
        st.error(f"Failed to create vector database: {str(e)}")
        return None