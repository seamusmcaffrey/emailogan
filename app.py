import streamlit as st
import pandas as pd
from pathlib import Path
import os
from datetime import datetime
import zipfile
import tempfile
import io
import logging
import sys

# Setup logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('emailogan.log')
    ]
)
logger = logging.getLogger(__name__)

st.set_page_config(
    page_title="Email RAG Assistant",
    page_icon="✉️",
    layout="wide"
)

def upload_and_process_page():
    from email_processor import EmailProcessor, create_vector_database
    
    st.header("📤 Upload Email Files")
    
    col1, col2 = st.columns([3, 1])
    
    with col1:
        upload_type = st.radio(
            "Upload Type",
            ["Individual .eml files", "ZIP file containing .eml files"],
            horizontal=True
        )
    
    with col2:
        use_embeddings = st.checkbox(
            "Use Embeddings (RAG)",
            value=True,
            help="Use vector embeddings for style learning"
        )
        st.session_state['use_embeddings'] = use_embeddings
    
    if upload_type == "Individual .eml files":
        uploaded_files = st.file_uploader(
            "Choose .eml files",
            type=['eml'],
            accept_multiple_files=True,
            help="Select multiple .eml files to build your email knowledge base"
        )
    else:
        zip_file = st.file_uploader(
            "Choose a ZIP file containing .eml files",
            type=['zip'],
            accept_multiple_files=False,
            help="Upload a ZIP file containing .eml files"
        )
        uploaded_files = None
        
        if zip_file:
            uploaded_files = extract_eml_from_zip(zip_file)
    
    if uploaded_files:
        st.success(f"📁 {len(uploaded_files)} .eml files ready to process")
        logger.info(f"Files ready for processing: {len(uploaded_files)} files")
        
        if st.button("🔄 Process Files", type="primary", key="process_files_btn"):
            logger.info("Process Files button clicked")
            processor = EmailProcessor()
            parsed_emails = processor.parse_eml_files(uploaded_files)
            
            st.session_state['parsed_emails'] = parsed_emails
            logger.info(f"Stored {len(parsed_emails)} parsed emails in session state")
            
            df = pd.DataFrame(parsed_emails)
            
            # Add body length column to check if content was extracted
            df['body_length'] = df['body'].str.len()
            
            st.subheader("📊 Processing Summary")
            
            # Show extraction stats
            emails_with_body = (df['body_length'] > 0).sum()
            emails_without_body = (df['body_length'] == 0).sum()
            
            # Detect user email from corpus
            user_email = processor.detect_user_email(parsed_emails)
            if user_email:
                st.session_state['user_email'] = user_email
                st.info(f"👤 Detected user email: **{user_email}**")
                logger.info(f"Detected user email: {user_email}")
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Total Emails", len(parsed_emails))
            with col2:
                st.metric("With Body Content", emails_with_body)
            with col3:
                st.metric("Missing Body", emails_without_body)
            
            # Show the dataframe with body info
            display_df = df[['filename', 'from', 'subject', 'body_length', 'date']].copy()
            display_df['has_body'] = display_df['body_length'] > 0
            st.dataframe(display_df)
            
            # If we have emails with bodies, show a sample
            if emails_with_body > 0:
                sample_email = df[df['body_length'] > 0].iloc[0]
                with st.expander("📧 Sample Email Body (first 500 chars)"):
                    st.text(sample_email['body'][:500])
            
            # Automatically create vector database if embeddings are enabled
            if st.session_state.get('use_embeddings', True):
                st.info("🚀 Automatically creating vector database for embeddings...")
                logger.info("Auto-creating vector database with embeddings")
                with st.spinner("🔄 Creating embeddings and building vector database..."):
                    try:
                        create_vector_database(parsed_emails)
                        st.success("✅ Vector database created successfully!")
                    except Exception as e:
                        st.error(f"❌ Failed to create vector database: {str(e)}")
                        logger.error(f"Vector database creation failed: {str(e)}", exc_info=True)
                        st.info("You can still use Direct Context mode for style mimicking")
            else:
                st.info("🔧 Embeddings disabled - emails stored for direct retrieval")
                st.session_state['parsed_emails'] = parsed_emails
                st.session_state['vector_ready'] = True
                logger.info("Embeddings disabled - storing emails for direct access")

def response_generation_page():
    from response_generator import ResponseGenerator
    
    st.header("🤖 Generate Email Response")
    logger.info("Response generation page loaded")
    
    # Check if vector database is ready
    if not st.session_state.get('vector_ready', False):
        st.error("❌ Vector database not ready. Please upload and process emails first.")
        logger.warning("Vector database not ready - stopping page")
        st.stop()
    
    st.success("✅ Vector database ready - Toggle 'Include Context' to compare RAG vs Baseline responses")
    
    # Debug info
    with st.expander("🔍 Debug Info"):
        st.write("**System Status:**")
        st.write("- Vector Database:", "✅ Ready" if st.session_state.get('vector_ready') else "❌ Not Ready")
        st.write("- Vector Index:", "✅ Exists" if 'vector_index' in st.session_state else "❌ Missing")
        st.write("- Emails Processed:", len(st.session_state.get('parsed_emails', [])))
        emails_with_body = sum(1 for e in st.session_state.get('parsed_emails', []) if e.get('body'))
        st.write("- Emails with Body Content:", emails_with_body)
    
    # Display detected user email if available
    if st.session_state.get('user_email'):
        st.info(f"👤 **Your email:** {st.session_state['user_email']}")
    
    with st.form("response_form"):
        st.subheader("📝 Input Email Details")
        
        col1, col2 = st.columns([2, 1])
        
        with col1:
            sender_email = st.text_input(
                "Sender Email Address",
                placeholder="sender@example.com"
            )
            
            incoming_email = st.text_area(
                "Incoming Email Content",
                height=200,
                placeholder="Paste the email content you want to respond to..."
            )
        
        with col2:
            response_style = st.selectbox(
                "Response Style",
                ["professional", "friendly", "brief", "detailed"]
            )
            
            message_type = st.selectbox(
                "Message Type",
                ["general", "external_client", "internal_colleague", "discussion", "request", "update"],
                help="Helps tailor the response appropriately"
            )
            
            is_internal = st.checkbox(
                "Internal Email",
                value=False,
                help="Check if sender is from the same organization (same email domain)"
            )
            
            include_context = st.checkbox(
                "Include Context from Past Emails",
                value=True,
                help="✅ ON: Uses RAG embeddings to mimic email style | ❌ OFF: Standard professional response"
            )
        
        generate_button = st.form_submit_button("✨ Generate Response", type="primary")
    
    if generate_button:
        logger.info(f"Generate button clicked - Email: {bool(incoming_email)}, Sender: {bool(sender_email)}")
        if not incoming_email:
            st.error("Please enter the email content to respond to")
            logger.warning("Generate clicked but no email content provided")
        elif not sender_email:
            st.error("Please enter the sender's email address")
            logger.warning("Generate clicked but no sender email provided")
    
    if generate_button and incoming_email and sender_email:
        logger.info(f"Generating response for email from {sender_email}")
        logger.info(f"Include Context checkbox state: {include_context}")
        
        # Choose appropriate spinner message based on mode
        spinner_msg = "🔄 Using RAG to analyze email style and generate response..." if include_context else "🔄 Generating standard response (no style mimicking)..."
        
        with st.spinner(spinner_msg):
            try:
                generator = ResponseGenerator()
                
                if include_context:
                    # Use RAG with embeddings
                    if not st.session_state.get('vector_index'):
                        st.error("❌ Vector index not found in session!")
                        logger.error("Vector index missing from session state")
                        return
                    
                    logger.info("=== USING RAG SYSTEM WITH EMBEDDINGS ===")
                    result = generator.generate_response(
                        incoming_email, 
                        sender_email, 
                        st.session_state['vector_index'],
                        response_style,
                        message_type=message_type,
                        is_internal=is_internal,
                        user_email=st.session_state.get('user_email')
                    )
                else:
                    # Use baseline without embeddings
                    logger.info("=== USING BASELINE (NO EMBEDDINGS) ===")
                    result = generator.generate_baseline_response(
                        incoming_email,
                        sender_email,
                        response_style,
                        message_type=message_type,
                        is_internal=is_internal
                    )
                
                logger.info(f"Response generation result: success={result.get('success')}, mode={result.get('mode', 'unknown')}")
            except Exception as e:
                logger.error(f"Error generating response: {str(e)}", exc_info=True)
                result = {'success': False, 'error': str(e)}
            
            if result.get('success'):
                mode_msg = result.get('mode', 'unknown')
                st.success(f"✅ Response generated successfully! Mode: {mode_msg}")
                logger.info(f"Response generated successfully using mode: {mode_msg}")
                
                st.subheader("📧 Generated Response")
                response_text = st.text_area(
                    "Edit response if needed:",
                    value=result['response'],
                    height=300
                )
                
                if result.get('sources'):
                    with st.expander(f"📚 Context Sources Used ({len(result['sources'])} emails retrieved)"):
                        for idx, source in enumerate(result['sources'], 1):
                            st.write(f"**Email {idx}:** {source.get('filename', 'Unknown')}")
                            st.write(f"From: {source.get('sender', 'Unknown')}")
                            st.write(f"Subject: {source.get('subject', 'No subject')}")
                            if source.get('body_preview'):
                                st.write(f"Preview: {source.get('body_preview')[:100]}...")
                            st.write("---")
                
                st.code(response_text, language=None)
                
            else:
                error_msg = result.get('error', 'Unknown error')
                st.error(f"❌ Failed to generate response: {error_msg}")
                logger.error(f"Failed to generate response: {error_msg}")

def knowledge_base_page():
    st.header("🗃️ Email Knowledge Base")
    
    if not st.session_state.get('parsed_emails'):
        st.info("No emails processed yet. Please upload files first.")
        return
    
    emails = st.session_state['parsed_emails']
    df = pd.DataFrame(emails)
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Emails", len(emails))
    with col2:
        unique_senders = df['from'].nunique()
        st.metric("Unique Senders", unique_senders)
    with col3:
        date_range = pd.to_datetime(df['date'], errors='coerce').dt.date
        date_span = (date_range.max() - date_range.min()).days if len(date_range.dropna()) > 1 else 0
        st.metric("Date Span (days)", date_span)
    with col4:
        avg_length = df['body'].str.len().mean()
        st.metric("Avg Email Length", f"{avg_length:.0f} chars")
    
    st.subheader("🔍 Search Emails")
    search_term = st.text_input("Search in emails...")
    
    if search_term:
        mask = df.apply(lambda x: x.astype(str).str.contains(search_term, case=False).any(), axis=1)
        filtered_df = df[mask]
    else:
        filtered_df = df
    
    st.dataframe(
        filtered_df[['filename', 'from', 'subject', 'date']],
        use_container_width=True
    )
    
    if st.button("🗑️ Clear Knowledge Base"):
        if st.checkbox("I understand this will delete all processed emails"):
            st.session_state.pop('parsed_emails', None)
            st.session_state.pop('vector_index', None)
            st.session_state.pop('vector_ready', None)
            st.success("Knowledge base cleared!")
            st.rerun()

def main():
    st.title("✉️ Personal Email RAG Assistant")
    st.markdown("Upload your .eml files to create a personalized email response system")
    
    # Add logging status in sidebar
    with st.sidebar:
        with st.expander("📊 System Status"):
            st.write("Logging to: emailogan.log")
            if st.button("Clear Log", key="clear_log_btn"):
                try:
                    open('emailogan.log', 'w').close()
                    st.success("Log cleared")
                except Exception as e:
                    st.error(f"Could not clear log: {e}")
    
    with st.sidebar:
        st.header("Navigation")
        page = st.radio("Select Mode", ["Upload & Process", "Generate Response", "View Knowledge Base"])
    
    if page == "Upload & Process":
        upload_and_process_page()
    elif page == "Generate Response":
        response_generation_page()
    else:
        knowledge_base_page()

def extract_eml_from_zip(zip_file):
    """Extract .eml files from uploaded ZIP file"""
    eml_files = []
    logger.info(f"Extracting .eml files from ZIP: {zip_file.name}")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_bytes = zip_file.read()
            
            with zipfile.ZipFile(io.BytesIO(zip_bytes), 'r') as zip_ref:
                for file_info in zip_ref.namelist():
                    if file_info.lower().endswith('.eml') and not file_info.startswith('__MACOSX/'):
                        file_data = zip_ref.read(file_info)
                        
                        class EMLFile:
                            def __init__(self, name, data):
                                self.name = os.path.basename(name)
                                self.data = data
                            
                            def read(self):
                                return self.data
                        
                        eml_files.append(EMLFile(file_info, file_data))
            
            if eml_files:
                st.success(f"📦 Found {len(eml_files)} .eml files in ZIP")
                logger.info(f"Successfully extracted {len(eml_files)} .eml files from ZIP")
            else:
                st.warning("⚠️ No .eml files found in the ZIP archive")
                logger.warning("No .eml files found in ZIP archive")
                
    except Exception as e:
        st.error(f"Error extracting ZIP file: {str(e)}")
        logger.error(f"Error extracting ZIP: {str(e)}", exc_info=True)
        return None
    
    return eml_files if eml_files else None

if __name__ == "__main__":
    main()