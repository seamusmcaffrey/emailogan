# Web-Based Email RAG Portal: Technical Implementation Plan

This comprehensive plan details building a web portal where your friend can upload .eml files, automatically vectorize them, and query the system for personalized email responses. The approach leverages existing tools and services to minimize custom development while maximizing functionality.

## **System Architecture Overview**

### **Technology Stack Selection**

**Frontend Interface**: Streamlit (Python-based, novice-friendly)
**Vector Database**: Pinecone (managed service, no infrastructure management)[1][2]
**RAG Framework**: LlamaIndex (simpler learning curve than LangChain)[3][4]
**Email Parsing**: `eml-parser` library (comprehensive parsing capabilities)[5]
**LLM Integration**: OpenAI GPT-4 (reliable API with good documentation)
**Deployment**: Hugging Face Spaces (free hosting with easy deployment)[6][7]
**File Storage**: Streamlit's built-in file handling (temporary storage)

### **System Components**

1. **File Upload Interface**: Multi-file .eml upload with drag-and-drop
2. **Email Processing Pipeline**: Parse, clean, and structure email data
3. **Vector Storage System**: Automated embedding and Pinecone integration
4. **Query Interface**: Input new emails and receive generated responses
5. **Response Generation**: RAG-powered personalized email responses

***

## **Phase 1: Core Application Development**

### **1.1 Streamlit Application Structure**

```python
# app.py - Main application file
import streamlit as st
import pandas as pd
from pathlib import Path
import os
from datetime import datetime

# Configure page
st.set_page_config(
    page_title="Email RAG Assistant",
    page_icon="✉️",
    layout="wide"
)

# Main application
def main():
    st.title("✉️ Personal Email RAG Assistant")
    st.markdown("Upload your .eml files to create a personalized email response system")
    
    # Sidebar for navigation
    with st.sidebar:
        st.header("Navigation")
        page = st.radio("Select Mode", ["Upload & Process", "Generate Response", "View Knowledge Base"])
    
    if page == "Upload & Process":
        upload_and_process_page()
    elif page == "Generate Response":
        response_generation_page()
    else:
        knowledge_base_page()

if __name__ == "__main__":
    main()
```

### **1.2 Email Upload and Processing Module**

```python
# email_processor.py
import eml_parser
import streamlit as st
import pandas as pd
from typing import List, Dict
import json
import hashlib

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
                # Read file content
                raw_email = uploaded_file.read()
                
                # Parse using eml_parser
                ep = eml_parser.EmlParser()
                parsed_eml = ep.decode_email_bytes(raw_email)
                
                # Extract key information
                email_data = self.extract_email_info(parsed_eml, uploaded_file.name)
                parsed_data.append(email_data)
                
                # Update progress
                progress = (idx + 1) / len(uploaded_files)
                progress_bar.progress(progress)
                status_text.text(f"Processing {uploaded_file.name}...")
                
            except Exception as e:
                st.error(f"Error processing {uploaded_file.name}: {str(e)}")
        
        status_text.text("✅ All files processed successfully!")
        return parsed_data
    
    def extract_email_info(self, parsed_eml: Dict, filename: str) -> Dict:
        """Extract and structure relevant email information"""
        header = parsed_eml.get('header', {})
        body = parsed_eml.get('body', [])
        
        # Get email body text
        email_body = ""
        if body:
            for part in body:
                if 'content' in part:
                    email_body += part['content']
        
        return {
            'filename': filename,
            'from': header.get('from', ''),
            'to': header.get('to', []),
            'subject': header.get('subject', ''),
            'date': header.get('date', ''),
            'body': email_body,
            'message_id': header.get('message-id', [''])[0],
            'processed_at': datetime.now().isoformat()
        }

# Upload interface
def upload_and_process_page():
    st.header("📤 Upload Email Files")
    
    uploaded_files = st.file_uploader(
        "Choose .eml files",
        type=['eml'],
        accept_multiple_files=True,
        help="Select multiple .eml files to build your email knowledge base"
    )
    
    if uploaded_files:
        st.success(f"📁 {len(uploaded_files)} files uploaded")
        
        if st.button("🔄 Process Files", type="primary"):
            processor = EmailProcessor()
            parsed_emails = processor.parse_eml_files(uploaded_files)
            
            # Store in session state for later use
            st.session_state['parsed_emails'] = parsed_emails
            
            # Display summary
            df = pd.DataFrame(parsed_emails)
            st.subheader("📊 Processing Summary")
            st.dataframe(df[['filename', 'from', 'subject', 'date']])
            
            # Next step: vectorization
            if st.button("⚡ Create Vector Database", type="secondary"):
                create_vector_database(parsed_emails)
```

### **1.3 Vector Database Integration**

```python
# vector_manager.py
import pinecone
from llama_index.core import VectorStoreIndex, Document
from llama_index.vector_stores.pinecone import PineconeVectorStore
from llama_index.embeddings.openai import OpenAIEmbedding
import streamlit as st
from typing import List, Dict
import os

class VectorManager:
    def __init__(self):
        self.api_key = st.secrets["PINECONE_API_KEY"]
        self.environment = st.secrets.get("PINECONE_ENVIRONMENT", "us-east-1")
        self.index_name = "email-rag-index"
        self.embedding_model = OpenAIEmbedding()
    
    def initialize_pinecone(self):
        """Initialize Pinecone connection"""
        try:
            pinecone.init(
                api_key=self.api_key,
                environment=self.environment
            )
            return True
        except Exception as e:
            st.error(f"Failed to initialize Pinecone: {str(e)}")
            return False
    
    def create_or_connect_index(self):
        """Create new index or connect to existing one"""
        try:
            if self.index_name not in pinecone.list_indexes():
                pinecone.create_index(
                    name=self.index_name,
                    dimension=1536,  # OpenAI embedding dimension
                    metric='cosine'
                )
                st.success(f"✅ Created new index: {self.index_name}")
            else:
                st.info(f"📌 Connected to existing index: {self.index_name}")
            
            return pinecone.Index(self.index_name)
        except Exception as e:
            st.error(f"Index operation failed: {str(e)}")
            return None
    
    def process_emails_to_documents(self, emails: List[Dict]) -> List[Document]:
        """Convert email data to LlamaIndex Documents"""
        documents = []
        
        for email in emails:
            # Create comprehensive document text
            doc_text = f"""
            From: {email['from']}
            To: {', '.join(email['to']) if isinstance(email['to'], list) else email['to']}
            Subject: {email['subject']}
            Date: {email['date']}
            
            Content:
            {email['body']}
            """
            
            # Create metadata
            metadata = {
                'filename': email['filename'],
                'sender': email['from'],
                'subject': email['subject'],
                'date': email['date'],
                'message_id': email['message_id']
            }
            
            documents.append(Document(text=doc_text, metadata=metadata))
        
        return documents
    
    def create_vector_store(self, emails: List[Dict]):
        """Create vector store from emails"""
        with st.spinner("🔄 Creating vector embeddings..."):
            # Initialize Pinecone
            if not self.initialize_pinecone():
                return None
            
            # Get or create index
            pinecone_index = self.create_or_connect_index()
            if not pinecone_index:
                return None
            
            # Process emails to documents
            documents = self.process_emails_to_documents(emails)
            
            # Create vector store
            vector_store = PineconeVectorStore(
                pinecone_index=pinecone_index,
                embed_model=self.embedding_model
            )
            
            # Create index
            index = VectorStoreIndex.from_documents(
                documents, 
                vector_store=vector_store,
                embed_model=self.embedding_model
            )
            
            st.success(f"✅ Successfully created vector database with {len(emails)} emails")
            return index

def create_vector_database(parsed_emails):
    """Main function to create vector database"""
    if not parsed_emails:
        st.error("No emails to process")
        return
    
    vector_manager = VectorManager()
    index = vector_manager.create_vector_store(parsed_emails)
    
    if index:
        # Store index in session state
        st.session_state['vector_index'] = index
        st.session_state['vector_ready'] = True
        
        # Show success message
        st.balloons()
        st.success("🎉 Your email knowledge base is ready!")
        
        # Statistics
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("📧 Emails Processed", len(parsed_emails))
        with col2:
            unique_senders = len(set([email['from'] for email in parsed_emails]))
            st.metric("👥 Unique Senders", unique_senders)
        with col3:
            st.metric("🗃️ Vector Dimensions", 1536)
```

### **1.4 Response Generation Module**

```python
# response_generator.py
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.llms.openai import OpenAI
import streamlit as st
from typing import Dict, Optional
import json

class ResponseGenerator:
    def __init__(self):
        self.llm = OpenAI(
            model="gpt-4",
            api_key=st.secrets["OPENAI_API_KEY"],
            temperature=0.7
        )
    
    def generate_response(self, 
                         incoming_email: str, 
                         sender_email: str,
                         vector_index,
                         response_style: str = "professional") -> Dict:
        """Generate personalized email response"""
        
        # Create query engine from vector index
        query_engine = vector_index.as_query_engine(
            llm=self.llm,
            similarity_top_k=5
        )
        
        # Construct context-aware prompt
        prompt = self.build_response_prompt(
            incoming_email, 
            sender_email, 
            response_style
        )
        
        try:
            # Query the vector database
            response = query_engine.query(prompt)
            
            return {
                'success': True,
                'response': response.response,
                'sources': [node.metadata for node in response.source_nodes],
                'confidence': 'high'  # Could implement confidence scoring
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'response': None
            }
    
    def build_response_prompt(self, 
                            incoming_email: str, 
                            sender_email: str,
                            response_style: str) -> str:
        """Build contextually appropriate prompt"""
        
        style_instructions = {
            'professional': "Maintain a professional, courteous tone",
            'friendly': "Use a warm, friendly tone while remaining professional", 
            'brief': "Keep the response concise and to the point",
            'detailed': "Provide a comprehensive, detailed response"
        }
        
        return f"""
        Based on the email history and communication patterns, please generate a response to the following email:
        
        From: {sender_email}
        Content: {incoming_email}
        
        Instructions:
        1. {style_instructions.get(response_style, style_instructions['professional'])}
        2. Reference relevant past conversations when appropriate
        3. Maintain consistency with previous communication style
        4. Be helpful and responsive to the specific request or question
        5. Sign the response appropriately based on past email patterns
        
        Generate only the email response content, without subject line.
        """

def response_generation_page():
    """Streamlit page for generating responses"""
    st.header("🤖 Generate Email Response")
    
    # Check if vector database is ready
    if not st.session_state.get('vector_ready', False):
        st.warning("⚠️ Please upload and process emails first!")
        st.stop()
    
    # Input form
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
            
            include_context = st.checkbox(
                "Include Context from Past Emails",
                value=True
            )
        
        generate_button = st.form_submit_button("✨ Generate Response", type="primary")
    
    if generate_button and incoming_email and sender_email:
        with st.spinner("🔄 Analyzing email history and generating response..."):
            generator = ResponseGenerator()
            result = generator.generate_response(
                incoming_email, 
                sender_email, 
                st.session_state['vector_index'],
                response_style
            )
            
            if result['success']:
                st.success("✅ Response generated successfully!")
                
                # Display generated response
                st.subheader("📧 Generated Response")
                response_text = st.text_area(
                    "Edit response if needed:",
                    value=result['response'],
                    height=300
                )
                
                # Show context sources
                if result.get('sources'):
                    with st.expander("📚 Context Sources Used"):
                        for idx, source in enumerate(result['sources']):
                            st.write(f"**Source {idx+1}:** {source.get('filename', 'Unknown')}")
                            st.write(f"From: {source.get('sender', 'Unknown')}")
                            st.write(f"Subject: {source.get('subject', 'No subject')}")
                            st.write("---")
                
                # Copy to clipboard button
                st.code(response_text, language=None)
                
            else:
                st.error(f"❌ Failed to generate response: {result.get('error', 'Unknown error')}")
```

***

## **Phase 2: Deployment and Configuration**

### **2.1 Hugging Face Spaces Deployment**

**Directory Structure:**
```
email-rag-assistant/
├── app.py                 # Main Streamlit app
├── requirements.txt       # Python dependencies
├── .streamlit/
│   └── secrets.toml      # API keys (local only)
├── email_processor.py    # Email parsing module
├── vector_manager.py     # Vector database management
├── response_generator.py # Response generation
└── README.md            # Documentation
```

**requirements.txt:**
```
streamlit==1.28.1
eml-parser==1.17.6
pinecone-client==2.2.4
llama-index==0.9.15
llama-index-vector-stores-pinecone==0.1.6
llama-index-embeddings-openai==0.1.7
llama-index-llms-openai==0.1.13
openai==1.3.5
pandas==2.1.3
python-dateutil==2.8.2
```

**Secrets Configuration (Hugging Face):**
```toml
# In Hugging Face Spaces Settings -> Repository Secrets
OPENAI_API_KEY = "sk-..."
PINECONE_API_KEY = "your-pinecone-key"
PINECONE_ENVIRONMENT = "us-east-1"
```

### **2.2 Deployment Steps**

1. **Create Hugging Face Space**[6]:
   - Go to https://huggingface.co/new-space
   - Choose "Streamlit" as SDK
   - Set to Public (free) or Private (paid)
   - Name: `email-rag-assistant`

2. **Clone and Setup**:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/email-rag-assistant
   cd email-rag-assistant
   
   # Add your code files
   # Configure secrets in HF interface
   
   git add .
   git commit -m "Initial email RAG assistant"
   git push
   ```

3. **Configure Secrets**:
   - In HF Spaces settings, add API keys
   - Ensure proper environment variables

### **2.3 Alternative Deployment Options**

**Option 1: Streamlit Community Cloud**[8]
- **Pros**: Native Streamlit hosting, GitHub integration
- **Cons**: Limited private repos, resource constraints
- **Cost**: Free with limitations

**Option 2: Render.com**[9]
- **Pros**: More resources, custom domains
- **Cons**: Learning curve for deployment
- **Cost**: $7/month for basic plan

**Option 3: Railway or Heroku**
- **Pros**: More flexibility, database options
- **Cons**: More complex setup
- **Cost**: $5-15/month

***

## **Phase 3: Enhanced Features and Security**

### **3.1 Knowledge Base Management**

```python
def knowledge_base_page():
    """Page for viewing and managing the email knowledge base"""
    st.header("🗃️ Email Knowledge Base")
    
    if not st.session_state.get('parsed_emails'):
        st.info("No emails processed yet. Please upload files first.")
        return
    
    emails = st.session_state['parsed_emails']
    df = pd.DataFrame(emails)
    
    # Statistics dashboard
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
    
    # Search and filter
    st.subheader("🔍 Search Emails")
    search_term = st.text_input("Search in emails...")
    
    if search_term:
        mask = df.apply(lambda x: x.astype(str).str.contains(search_term, case=False).any(), axis=1)
        filtered_df = df[mask]
    else:
        filtered_df = df
    
    # Display results
    st.dataframe(
        filtered_df[['filename', 'from', 'subject', 'date']],
        use_container_width=True
    )
    
    # Delete emails option
    if st.button("🗑️ Clear Knowledge Base"):
        if st.checkbox("I understand this will delete all processed emails"):
            st.session_state.pop('parsed_emails', None)
            st.session_state.pop('vector_index', None)
            st.session_state.pop('vector_ready', None)
            st.success("Knowledge base cleared!")
            st.rerun()
```

### **3.2 Security Implementation**

```python
# security.py
import hashlib
import hmac
import streamlit as st
from datetime import datetime, timedelta

class SecurityManager:
    def __init__(self):
        self.session_timeout = 3600  # 1 hour
    
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
        # Remove potentially harmful characters
        dangerous_chars = ['<', '>', '"', "'", '&', '`']
        for char in dangerous_chars:
            text = text.replace(char, '')
        return text.strip()

# Apply security middleware
def security_middleware():
    security = SecurityManager()
    security.validate_session()
    return security
```

### **3.3 Error Handling and Monitoring**

```python
# monitoring.py
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
    # Implementation here
    pass
```

***

## **Phase 4: Cost Optimization and Scaling**

### **4.1 Cost Analysis**

**Monthly Operating Costs (Estimated):**

| Service | Usage | Cost |
|---------|-------|------|
| OpenAI API | ~1M tokens/month | $20-30 |
| Pinecone | Starter plan | $70 |
| Hugging Face Spaces | CPU instance | Free |
| **Total** | | **~$90-100/month** |

**Cost Optimization Strategies:**
1. **Token Management**: Implement smart chunking to reduce API calls[1]
2. **Caching**: Cache frequently used responses
3. **Alternative Models**: Consider using smaller models for simple queries
4. **Batch Processing**: Process multiple queries together

### **4.2 Performance Optimization**

```python
# performance.py
import streamlit as st
from functools import lru_cache
import time

@st.cache_data(ttl=3600)  # Cache for 1 hour
def cached_email_processing(file_hash: str, file_content: bytes):
    """Cache processed email data to avoid reprocessing"""
    # Process email and return structured data
    pass

@st.cache_resource
def load_vector_index():
    """Cache vector index to avoid reloading"""
    # Load and return vector index
    pass

def optimize_embeddings():
    """Optimize embedding generation for better performance"""
    # Use batch processing for multiple embeddings
    # Implement smart chunking strategies
    pass
```

***

## **Implementation Timeline**

### **Week 1: Core Development**
- ✅ Set up Streamlit application structure
- ✅ Implement email parsing functionality  
- ✅ Create file upload interface
- ✅ Basic error handling

### **Week 2: Vector Integration**
- ✅ Pinecone setup and integration
- ✅ LlamaIndex implementation
- ✅ Vector database creation
- ✅ Testing with sample data

### **Week 3: Response Generation**
- ✅ RAG query engine implementation
- ✅ Response generation interface
- ✅ Prompt engineering and optimization
- ✅ Context source tracking

### **Week 4: Deployment & Polish**
- ✅ Hugging Face Spaces deployment
- ✅ Security implementation
- ✅ Performance optimization
- ✅ User interface refinement

***

## **AI-Assisted Development Approach**

### **Recommended AI Tools for This Project**

1. **GitHub Copilot**: For code completion and boilerplate generation[10][11]
2. **ChatGPT/Claude**: For explaining concepts and debugging
3. **Cursor**: For AI-native development environment
4. **Streamlit AI Assistant**: Built-in code suggestions

### **Development Strategy**

**Iterative Development with AI Assistance:**
1. Start with basic file upload functionality
2. Use AI to generate email parsing code
3. Implement vector database step-by-step  
4. Test each component before integration
5. Use AI for debugging and optimization

**Prompt Engineering Examples:**
```
"Generate a Streamlit function that accepts multiple .eml file uploads 
and displays a progress bar while processing each file with eml_parser"

"Create error handling for a Pinecone vector database connection that 
gracefully handles API failures and displays user-friendly messages"

"Write a function that converts email data to LlamaIndex Documents 
with proper metadata for sender, subject, and date"
```

***

## **Testing and Quality Assurance**

### **Test Data Preparation**
1. Create sample .eml files with various formats
2. Test with different email clients (Gmail, Outlook, etc.)
3. Include edge cases (attachments, HTML emails, forwarded emails)

### **Testing Scenarios**
- Upload single vs. multiple files
- Various email formats and encodings
- Large email datasets (100+ emails)
- Different sender patterns and communication styles
- Error conditions (corrupted files, API failures)

### **Success Metrics**
- File processing success rate > 95%
- Response generation time < 30 seconds
- User satisfaction with response quality
- System uptime > 99%

***

## **Conclusion**

This comprehensive plan provides a complete roadmap for building a web-based email RAG system using modern, AI-friendly tools. The approach minimizes custom development by leveraging established services like Pinecone, OpenAI, and Hugging Face Spaces.

**Key Benefits:**
- **Novice-Friendly**: Uses Streamlit and well-documented libraries
- **Cost-Effective**: Leverages free hosting and managed services
- **Scalable**: Can grow with increased usage and features
- **Secure**: Implements proper security practices
- **AI-Assisted**: Designed for AI-powered development workflows

Your friend will have a fully functional email RAG system that can learn from his communication patterns and generate personalized responses, all accessible through a clean web interface that requires no technical expertise to use.

Sources
[1] How to Build a RAG Chatbot Without Coding (AI PM Series) https://www.productcompass.pm/p/how-to-build-a-rag-chatbot
[2] Pinecone vs Qdrant vs Weaviate: Best vector database - Xenoss https://xenoss.io/blog/vector-database-comparison-pinecone-qdrant-weaviate
[3] Llamaindex vs Langchain: What's the difference? - IBM https://www.ibm.com/think/topics/llamaindex-vs-langchain
[4] LlamaIndex vs. LangChain: Which RAG Tool is Right for You? https://blog.n8n.io/llamaindex-vs-langchain/
[5] eml-parser - PyPI https://pypi.org/project/eml-parser/
[6] How to Deploy Your LLM to Hugging Face Spaces - KDnuggets https://www.kdnuggets.com/how-to-deploy-your-llm-to-hugging-face-spaces
[7] Hosting your Models and Datasets on Hugging Face Spaces using ... https://huggingface.co/blog/streamlit-spaces
[8] Deploying simple Streamlit apps - by Eric Matthes - Mostly Python https://www.mostlypython.com/deploying-simple-streamlit-apps/
[9] Deploy Your AI Streamlit App for FREE - YouTube https://www.youtube.com/watch?v=74c3KaAXPvk
[10] 11 Best AI Coding Assistant Tools for 2025: Top Picks for Developers https://blog.devart.com/11-best-ai-coding-assistant-tools-for-2025-top-picks-for-developers.html
[11] Top AI Coding Assistants of 2025 | Tembo https://www.tembo.io/blog/top-ai-coding-assistants
[12] Top Vector Database for RAG: Qdrant vs Weaviate vs Pinecone https://research.aimultiple.com/vector-database-for-rag/
[13] 9 Best No-Code Platforms to Use in 2025 | Webnode Blog https://www.webnode.com/blog/best-no-code-platforms/
[14] 10 Best RAG Tools and Platforms: Full Comparison [2025] https://www.meilisearch.com/blog/rag-tools
[15] Hybrid Search Implementation Without Predefined Sparse Vectors in ... https://forum.weaviate.io/t/hybrid-search-implementation-without-predefined-sparse-vectors-in-weaviate/4035
[16] Hosting streamlit on github pages - Deployment https://discuss.streamlit.io/t/hosting-streamlit-on-github-pages/356
[17] 15 Best Open-Source RAG Frameworks in 2025 - Firecrawl https://www.firecrawl.dev/blog/best-open-source-rag-frameworks
[18] How to use a vector database to find matches between users? https://stackoverflow.com/questions/76990179/how-to-use-a-vector-database-to-find-matches-between-users
[19] Sending emails from streamlit app works locally but not when ... https://discuss.streamlit.io/t/sending-emails-from-streamlit-app-works-locally-but-not-when-deployed/54531
[20] The Ultimate List to Coding, No-Code, and Low-Code Platforms in ... https://www.reddit.com/r/nocode/comments/1j8oemu/the_ultimate_list_to_coding_nocode_and_lowcode/
[21] How to choose a vector database: Pinecone, Weaviate, MongoDB ... https://dev.to/dandv/how-to-choose-a-vector-database-pinecone-weaviate-mongodb-atlas-semadb-a09
[22] Vector databases like Pinecone or Weaviate are all the rage ... - Reddit https://www.reddit.com/r/SoftwareEngineering/comments/107vhoq/vector_databases_like_pinecone_or_weaviate_are/
[23] Upload all contents in a folder - Using Streamlit https://discuss.streamlit.io/t/upload-all-contents-in-a-folder/34173
[24] emlmailreader - PyPI https://pypi.org/project/emlmailreader/
[25] How to upload multiple PDF files WITHOUT using file_uploader()? https://discuss.streamlit.io/t/how-to-upload-multiple-pdf-files-without-using-file-uploader/61339
[26] rapid7/python-eml-parser - GitHub https://github.com/rapid7/python-eml-parser
[27] How to QUICKLY Build a Streamlit Tool for Multi-File Processing in ... https://www.youtube.com/watch?v=1sd7lVQVzZ4
[28] Streamlit Spaces - Hugging Face https://huggingface.co/docs/hub/en/spaces-sdks-streamlit
[29] namecheap/fast_mail_parser: Very fast Python library for .eml files ... https://github.com/namecheap/fast_mail_parser
[30] Using Streamlit to upload multiple files to interact with Langchain https://www.reddit.com/r/Streamlit/comments/13oc9ob/using_streamlit_to_upload_multiple_files_to/
[31] ParseEmailFilesV2 - Cortex XSOAR https://xsoar.pan.dev/docs/reference/scripts/parse-email-files-v2
[32] Multiple Files Upload - Strange Behaviour- - Using Streamlit https://discuss.streamlit.io/t/multiple-files-upload-strange-behaviour/22884
[33] Extracting Text from Gmail eml file using Python - Stack Overflow https://stackoverflow.com/questions/71151400/extracting-text-from-gmail-eml-file-using-python
[34] st.file_uploader - Streamlit Docs https://docs.streamlit.io/develop/api-reference/widgets/st.file_uploader
[35] Multi select uploaded files widget - Community Cloud - Streamlit https://discuss.streamlit.io/t/multi-select-uploaded-files-widget/43376
