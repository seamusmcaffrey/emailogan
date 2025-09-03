"""
Simple email processor using Python's built-in email module
Replacement for eml_parser to avoid cchardet build issues
"""
import email
from email import policy
from email.parser import BytesParser
import streamlit as st
import pandas as pd
from typing import List, Dict, Optional
import json
import hashlib
from datetime import datetime
from collections import Counter
import chardet

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
                
                # Detect encoding
                detected = chardet.detect(raw_email)
                encoding = detected['encoding'] or 'utf-8'
                
                # Parse email using built-in parser
                msg = BytesParser(policy=policy.default).parsebytes(raw_email)
                
                # Extract email data
                email_data = self.extract_email_info_from_msg(msg, uploaded_file.name, encoding)
                
                parsed_data.append(email_data)
                
                # Update progress
                progress = (idx + 1) / len(uploaded_files)
                progress_bar.progress(progress)
                status_text.text(f"Processing: {idx + 1}/{len(uploaded_files)} emails")
                
            except Exception as e:
                st.warning(f"⚠️ Error processing {uploaded_file.name}: {str(e)}")
                # Add minimal data even on error
                parsed_data.append({
                    'subject': f"Error: {uploaded_file.name}",
                    'from': 'unknown',
                    'to': [],
                    'date': datetime.now().isoformat(),
                    'body': f"Error processing email: {str(e)}",
                    'filename': uploaded_file.name,
                    'hash': hashlib.md5(raw_email).hexdigest()
                })
        
        progress_bar.empty()
        status_text.empty()
        
        self.parsed_emails = parsed_data
        return parsed_data
    
    def extract_email_info_from_msg(self, msg, filename: str, encoding: str = 'utf-8') -> Dict:
        """Extract structured information from parsed email message"""
        
        # Extract headers
        subject = str(msg.get('Subject', 'No Subject'))
        from_addr = str(msg.get('From', 'unknown'))
        to_addrs = str(msg.get('To', '')).split(',')
        cc_addrs = str(msg.get('Cc', '')).split(',') if msg.get('Cc') else []
        date_str = str(msg.get('Date', ''))
        
        # Extract body
        body = self.extract_body(msg)
        
        # Create email hash for deduplication
        content_hash = hashlib.md5(
            f"{subject}{from_addr}{body}".encode()
        ).hexdigest()
        
        return {
            'subject': subject,
            'from': from_addr,
            'to': [addr.strip() for addr in to_addrs if addr.strip()],
            'cc': [addr.strip() for addr in cc_addrs if addr.strip()],
            'date': date_str,
            'body': body,
            'filename': filename,
            'hash': content_hash
        }
    
    def extract_body(self, msg) -> str:
        """Extract body from email message"""
        body_parts = []
        
        if msg.is_multipart():
            for part in msg.walk():
                content_type = part.get_content_type()
                content_disposition = str(part.get("Content-Disposition", ""))
                
                # Skip attachments
                if "attachment" in content_disposition:
                    continue
                
                if content_type == "text/plain":
                    try:
                        body_parts.append(part.get_content())
                    except:
                        # Fallback for encoding issues
                        try:
                            payload = part.get_payload(decode=True)
                            if payload:
                                detected = chardet.detect(payload)
                                encoding = detected['encoding'] or 'utf-8'
                                body_parts.append(payload.decode(encoding, errors='ignore'))
                        except:
                            pass
                elif content_type == "text/html" and not body_parts:
                    # Only use HTML if no plain text available
                    try:
                        html_content = part.get_content()
                        # Simple HTML stripping
                        import re
                        text = re.sub(r'<[^>]+>', '', html_content)
                        body_parts.append(text)
                    except:
                        pass
        else:
            # Simple message
            try:
                body_parts.append(msg.get_content())
            except:
                # Fallback
                try:
                    payload = msg.get_payload(decode=True)
                    if payload:
                        detected = chardet.detect(payload)
                        encoding = detected['encoding'] or 'utf-8'
                        body_parts.append(payload.decode(encoding, errors='ignore'))
                except:
                    body_parts.append("Could not extract body")
        
        return '\n'.join(body_parts).strip()
    
    def detect_user_email(self, parsed_emails: List[Dict]) -> Optional[str]:
        """Detect the user's email address from the corpus"""
        from_counter = Counter()
        
        for email_data in parsed_emails:
            from_addr = email_data.get('from', '')
            if from_addr and '@' in from_addr:
                # Extract just the email part if it includes name
                if '<' in from_addr and '>' in from_addr:
                    email_part = from_addr.split('<')[1].split('>')[0]
                else:
                    email_part = from_addr
                from_counter[email_part] += 1
        
        if from_counter:
            # Return the most common sender
            most_common = from_counter.most_common(1)[0]
            if most_common[1] > len(parsed_emails) * 0.3:  # At least 30% of emails
                return most_common[0]
        
        return None
    
    def get_summary_stats(self, parsed_emails: List[Dict]) -> Dict:
        """Generate summary statistics from parsed emails"""
        if not parsed_emails:
            return {}
        
        df = pd.DataFrame(parsed_emails)
        
        # Email statistics
        total_emails = len(parsed_emails)
        unique_senders = df['from'].nunique() if 'from' in df else 0
        
        # Body statistics
        if 'body' in df:
            df['body_length'] = df['body'].str.len()
            avg_body_length = df['body_length'].mean()
            emails_with_body = (df['body_length'] > 0).sum()
        else:
            avg_body_length = 0
            emails_with_body = 0
        
        # Date range
        try:
            if 'date' in df and not df['date'].empty:
                dates = pd.to_datetime(df['date'], errors='coerce')
                valid_dates = dates.dropna()
                if not valid_dates.empty:
                    date_range = f"{valid_dates.min().date()} to {valid_dates.max().date()}"
                else:
                    date_range = "Unknown"
            else:
                date_range = "Unknown"
        except:
            date_range = "Unknown"
        
        return {
            'total_emails': total_emails,
            'unique_senders': unique_senders,
            'emails_with_body': emails_with_body,
            'avg_body_length': int(avg_body_length),
            'date_range': date_range
        }

def create_vector_database(parsed_emails):
    """Main function to create vector database"""
    import streamlit as st
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