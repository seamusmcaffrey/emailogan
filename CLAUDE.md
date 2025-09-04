# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

# Type checking (if configured)
npm run type-check
```

## Architecture & Key Components

### Dual Application Structure

The codebase maintains two parallel implementations:

1. **Streamlit App (`/`)**: Single-file application with modular Python components
   - `app.py` - Main application with session management
   - `email_processor.py` - Email parsing and extraction
   - `vector_manager.py` - Pinecone vector database operations
   - `response_generator.py` - AI-powered response generation with RAG
   - `style_learning.py` - Writing style analysis and learning
   - `security.py` - Authentication and input validation
   - `monitoring.py` - Logging and error tracking

2. **Next.js App (`/emailogan-web/`)**: Full-stack TypeScript application
   - `/app/api/` - API routes for auth, email processing, and vector operations
   - `/components/` - React components for UI
   - `/lib/` - Core utilities (auth.ts, email-parser.ts, pinecone.ts, openai.ts)
   - `/store/` - Zustand state management
   - `/types/` - TypeScript type definitions

### Email Processing Pipeline

The system follows this data flow:
```
.eml Upload → Parse (headers/body) → Generate Embeddings → 
Store in Pinecone → Query Similar Emails → Generate RAG Response
```

Key implementation details:
- Uses `text-embedding-ada-002` for embeddings (1536 dimensions)
- Retrieves 15 similar emails for context (configurable)
- Batch processes vectors in groups of 100
- Implements fallback parsing for problematic email formats
- Handles both plain text and HTML email bodies
- Preserves email metadata (from, to, subject, date)

### API Structure (Next.js)

All API routes follow similar patterns:
- JWT authentication via middleware
- Environment variable validation
- Comprehensive error handling
- TypeScript interfaces for type safety
- Request/response validation

Key endpoints:
- `/api/auth/login` - User authentication
- `/api/auth/logout` - Session termination
- `/api/auth/verify` - JWT token verification
- `/api/emails/process` - Email parsing and processing
- `/api/emails/search` - Search processed emails
- `/api/vectors/store` - Store email vectors
- `/api/vectors/search` - Semantic similarity search
- `/api/vectors/clear` - Clear vector database
- `/api/generate/response` - AI response generation
- `/api/generate/style-analysis` - Writing style analysis

### Vector Database Configuration

Pinecone setup:
- Index: `email-rag-index`
- Dimensions: 1536 (OpenAI ada-002)
- Metric: cosine similarity
- Region: AWS us-east-1 (serverless)
- Metadata fields:
  - `from`: Sender email address
  - `to`: Recipient email address(es)
  - `subject`: Email subject line
  - `date`: ISO timestamp
  - `body`: Full email content
  - `email_id`: Unique identifier

### Authentication Patterns

#### Streamlit
- Session-based authentication
- SHA256 password hashing
- Session timeout: 1 hour
- Password stored in `.streamlit/secrets.toml`

#### Next.js
- JWT token authentication
- bcrypt password hashing
- Token expiration: 24 hours
- Secure middleware for protected routes
- HttpOnly cookies for token storage

## Environment Variables

Required for both applications:
```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
```

Next.js specific:
```bash
JWT_SECRET=...  # For token signing (min 32 chars)
NODE_ENV=development|production
```

Streamlit specific (in `.streamlit/secrets.toml`):
```toml
OPENAI_API_KEY = "sk-..."
PINECONE_API_KEY = "..."
APP_PASSWORD = "..."  # Optional password protection
```

## Implementation Details

### Email Parsing Strategy

Both implementations use similar parsing logic:
1. Extract MIME headers (From, To, Subject, Date)
2. Parse multipart messages recursively
3. Extract plain text body (preferred) or HTML
4. Clean HTML using BeautifulSoup (Python) or regex (TypeScript)
5. Handle charset encoding (UTF-8, ISO-8859-1, etc.)
6. Truncate to 8000 characters for embedding generation

### Vector Embedding Process

1. **Text Preparation**
   - Combine subject and body for context
   - Remove excessive whitespace
   - Preserve important formatting
   
2. **Embedding Generation**
   - Model: `text-embedding-ada-002`
   - Max tokens: ~8191
   - Output dimensions: 1536
   
3. **Storage Strategy**
   - Batch upserts (100 vectors max)
   - Unique IDs using email hash
   - Full metadata preservation

### Response Generation Algorithm

1. **Context Retrieval**
   - Query vector database with incoming email
   - Retrieve top 15 similar emails
   - Filter by relevance score (>0.7)
   
2. **Prompt Construction**
   ```
   System: AI assistant mimicking writing style
   Context: [Previous similar emails]
   Task: Generate response in specified style
   ```
   
3. **Style Options**
   - Professional: Formal, structured
   - Friendly: Casual, warm tone
   - Brief: Concise, to-the-point
   - Detailed: Comprehensive, thorough

4. **Post-processing**
   - Grammar and spelling check
   - Length adjustment
   - Signature addition

### Error Handling Strategies

#### Python/Streamlit
```python
try:
    # Operation
except Exception as e:
    st.error(f"User-friendly message")
    logging.error(f"Detailed: {str(e)}")
    # Graceful fallback
```

#### TypeScript/Next.js
```typescript
try {
    // Operation
} catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
        { error: 'User-friendly message' },
        { status: 500 }
    );
}
```

## Deployment Configurations

### Vercel (Next.js)
- Configuration in `vercel.json`
- Function timeout: 60 seconds
- Environment variables via Vercel dashboard
- Automatic deployments from main branch
- Preview deployments for PRs

### Streamlit Cloud
- Main file: `app.py`
- Requirements: `requirements.txt`
- Secrets via dashboard configuration
- Python version: 3.8+
- Memory limit: 1GB

### Render
- Configuration in `render.yaml`
- Build: `pip install -r requirements.txt`
- Start: `streamlit run app.py`
- Health check endpoint: `/`
- Auto-deploy: enabled

## Common Development Tasks

### Adding New API Routes (Next.js)
1. Create route file in `/app/api/[path]/route.ts`
2. Implement handler with proper TypeScript types:
   ```typescript
   export async function POST(request: Request) {
       // Validate auth
       // Parse request body
       // Process logic
       // Return response
   }
   ```
3. Add authentication middleware if needed
4. Handle errors with try-catch blocks
5. Update TypeScript types in `/types/`

### Modifying Email Processing
- Python: Edit `email_processor.py` for parsing logic
- Next.js: Edit `/lib/email-parser.ts` for TypeScript implementation
- Both use similar extraction patterns for consistency
- Test with various email formats (.eml samples)

### Updating Vector Operations
- Python: Modify `vector_manager.py`
- Next.js: Update `/lib/pinecone.ts`
- Ensure dimension consistency (1536)
- Maintain batch size limits (100)
- Handle rate limiting gracefully

### Testing Email Processing
```bash
# Python testing
python test_parser.py

# JavaScript testing (for debugging)
node test-email-generation.js

# Test with sample emails
# Use test-emails/ directory for .eml samples
```

## Performance Optimization

### Caching Strategy
- Session-based caching for repeated queries
- Vector search results cached for 5 minutes
- Style analysis cached per sender
- Email metadata cached in memory

### Rate Limiting
- OpenAI: 3 requests/second (tier dependent)
- Pinecone: 100 upserts per batch
- Implement exponential backoff
- Queue system for bulk operations

### Memory Management
- Stream large files during processing
- Clear session state periodically
- Garbage collection for processed emails
- Limit concurrent operations

## Security Best Practices

### Input Validation
- Sanitize all user inputs
- Validate email addresses (regex)
- Check file types (.eml only)
- Limit file sizes (10MB max)
- Escape HTML content

### API Security
- Use environment variables for secrets
- Implement CORS properly
- Rate limit API endpoints
- Validate JWT tokens on each request
- Log security events

### Data Protection
- No storage of raw passwords
- Encrypt sensitive data in transit
- Use HTTPS in production
- Implement CSP headers
- Regular security audits

## Debugging & Monitoring

### Logging Configuration

#### Python/Streamlit
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

#### TypeScript/Next.js
```typescript
console.log('[Component]', 'message', data);
// Use debug package for advanced logging
```

### Common Debug Commands
```bash
# Streamlit debug mode
streamlit run app.py --logger.level=debug

# Next.js debug mode
DEBUG=* npm run dev

# Check Pinecone index
curl -i https://api.pinecone.io/indexes \
  -H "Api-Key: YOUR_API_KEY"

# Test OpenAI connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

## Code Style Guidelines

### Python
- Follow PEP 8
- Use type hints where possible
- Docstrings for all functions
- Consistent error handling

### TypeScript
- Strict mode enabled
- Explicit return types
- Interface over type aliases
- Consistent naming conventions

### Git Workflow
- Branch naming: `feature/`, `fix/`, `docs/`
- Commit messages: Conventional commits
- PR reviews required
- Run tests before merging

## Troubleshooting Guide

### Common Issues & Solutions

1. **Pinecone Connection Failed**
   - Verify API key and environment
   - Check index exists and dimensions match
   - Ensure correct region (us-east-1)

2. **OpenAI Rate Limiting**
   - Implement retry logic with backoff
   - Check API usage dashboard
   - Consider upgrading tier

3. **Email Parsing Errors**
   - Check file encoding (UTF-8 preferred)
   - Validate MIME structure
   - Handle malformed headers gracefully

4. **JWT Verification Failed**
   - Verify JWT_SECRET matches
   - Check token expiration
   - Clear cookies and re-authenticate

5. **Memory Issues**
   - Process emails in smaller batches
   - Clear session state periodically
   - Increase server memory limits

## Testing Strategy

### Unit Tests
- Test individual functions in isolation
- Mock external API calls
- Validate error handling
- Check edge cases

### Integration Tests
- Test complete workflows
- Verify API endpoints
- Check database operations
- Validate authentication flow

### End-to-End Tests
- Upload sample emails
- Generate responses
- Search functionality
- User authentication

## Important Notes

- Never commit API keys or secrets
- Always validate and sanitize inputs
- Implement proper error handling
- Maintain backward compatibility
- Document significant changes
- Follow existing code patterns
- Test thoroughly before deploying
- Monitor production logs regularly

## Quick Reference

### File Locations
- Streamlit config: `.streamlit/config.toml`
- Next.js config: `next.config.js`
- TypeScript config: `tsconfig.json`
- Python requirements: `requirements.txt`
- Node dependencies: `package.json`
- Environment examples: `.env.example`

### Key Functions

#### Python
- `parse_email_content()` - Email parsing
- `create_embeddings()` - Vector generation
- `store_vectors()` - Pinecone storage
- `generate_response()` - AI response

#### TypeScript
- `parseEmail()` - Email parsing
- `generateEmbedding()` - Vector generation
- `upsertVectors()` - Pinecone storage
- `generateResponse()` - AI response

### API Response Formats

Success:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

Error:
```json
{
  "success": false,
  "error": "Error message",
  "details": { ... }
}
```

## Additional Resources

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Pinecone Documentation](https://docs.pinecone.io)
- [Streamlit Documentation](https://docs.streamlit.io)
- [Next.js Documentation](https://nextjs.org/docs)
- [Email MIME Format RFC 5322](https://tools.ietf.org/html/rfc5322)