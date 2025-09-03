# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EmailOgan is a dual-architecture email response generation system using RAG (Retrieval-Augmented Generation) technology. The project consists of:
1. **Streamlit App** - Python-based web application for rapid deployment
2. **Next.js Web App** - TypeScript/React production application in `emailogan-web/`

## Development Commands

### Python/Streamlit Application
```bash
# Install dependencies
pip install -r requirements.txt

# Run Streamlit app locally
streamlit run app.py

# Run Python tests (if any)
python test_app.py
python test_parser.py
python test_style_learning.py
```

### Next.js Web Application
```bash
# Navigate to web app directory
cd emailogan-web

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Architecture & Key Components

### Dual Application Structure

The codebase maintains two parallel implementations:

1. **Streamlit App (`/`)**: Single-file application with modular Python components
   - `app.py` - Main application with session management
   - `email_processor.py` - Email parsing and extraction
   - `vector_manager.py` - Pinecone vector database operations
   - `response_generator.py` - AI-powered response generation with RAG

2. **Next.js App (`/emailogan-web/`)**: Full-stack TypeScript application
   - `/app/api/` - API routes for auth, email processing, and vector operations
   - `/components/` - React components for UI
   - `/lib/` - Core utilities (auth.ts, email-parser.ts, pinecone.ts)
   - `/store/` - Zustand state management

### Email Processing Pipeline

The system follows this data flow:
```
.eml Upload → Parse (headers/body) → Generate Embeddings → 
Store in Pinecone → Query Similar Emails → Generate RAG Response
```

Key implementation details:
- Uses `text-embedding-ada-002` for embeddings (1536 dimensions)
- Retrieves 15 similar emails for context
- Batch processes vectors in groups of 100
- Implements fallback parsing for problematic email formats

### API Structure (Next.js)

All API routes follow similar patterns:
- JWT authentication via middleware
- Environment variable validation
- Comprehensive error handling
- TypeScript interfaces for type safety

Key endpoints:
- `/api/auth/*` - Authentication (login, logout, verify)
- `/api/emails/process` - Email parsing and processing
- `/api/vectors/*` - Pinecone operations (store, search)
- `/api/generate/response` - AI response generation

### Vector Database Configuration

Pinecone setup:
- Index: `email-rag-index`
- Dimensions: 1536 (OpenAI ada-002)
- Region: AWS us-east-1 (serverless)
- Metadata: Stores from, to, subject, date, body

### Authentication Patterns

- **Streamlit**: Session-based with SHA256 password hashing
- **Next.js**: JWT tokens with secure verification middleware

## Environment Variables

Required for both applications:
```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
```

Next.js specific:
```bash
JWT_SECRET=...  # For token signing
```

Streamlit specific (in `.streamlit/secrets.toml`):
```toml
OPENAI_API_KEY = "sk-..."
PINECONE_API_KEY = "..."
APP_PASSWORD = "..."  # Optional password protection
```

## Deployment Configurations

### Vercel (Next.js)
- Configuration in `vercel.json`
- Function timeout: 60 seconds
- Environment variables via Vercel dashboard

### Streamlit Cloud
- Main file: `app.py`
- Requirements: `requirements.txt`
- Secrets via dashboard configuration

### Render
- Configuration in `render.yaml`
- Build: `pip install -r requirements.txt`
- Start: `streamlit run app.py`

## Common Development Tasks

### Adding New API Routes (Next.js)
1. Create route file in `/app/api/[path]/route.ts`
2. Implement handler with proper TypeScript types
3. Add authentication middleware if needed
4. Handle errors with try-catch blocks

### Modifying Email Processing
- Python: Edit `email_processor.py` for parsing logic
- Next.js: Edit `/lib/email-parser.ts` for TypeScript implementation
- Both use similar extraction patterns for consistency

### Updating Vector Operations
- Python: Modify `vector_manager.py`
- Next.js: Update `/lib/pinecone.ts`
- Ensure dimension consistency (1536) and batch size (100)

### Testing Email Processing
```bash
# Python testing
python test_parser.py

# JavaScript testing (for debugging)
node test-email-generation.js
```

## Error Handling Patterns

Both applications implement:
- Comprehensive try-catch blocks
- User-friendly error messages
- Detailed console logging for debugging
- Graceful fallbacks for parsing failures

## Performance Considerations

- Email content limited to 8000 characters for embeddings
- Batch processing for vector operations (100 records)
- Function timeouts configured per platform
- 15 similar emails retrieved for context (configurable)

## Security Notes

- Never commit API keys or secrets
- Use environment variables for sensitive data
- Implement input validation and sanitization
- JWT tokens expire after reasonable duration
- Password hashing uses SHA256 (Streamlit) or bcrypt (Next.js)