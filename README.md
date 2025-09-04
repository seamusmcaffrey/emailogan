# EmailOgan - AI-Powered Email Response Generation System

A dual-architecture email response generation system using RAG (Retrieval-Augmented Generation) technology. This system learns from your email history to generate contextually appropriate, personalized responses that match your writing style.

## 🚀 Quick Start

### Option 1: Streamlit App (Python)
```bash
pip install -r requirements.txt
streamlit run app.py
```

### Option 2: Next.js App (TypeScript)
```bash
cd emailogan-web
npm install
npm run dev
```

## 🏗️ System Architecture

EmailOgan provides two complete implementations of the same RAG-based email response system:

### 1. **Streamlit Application** (Python)
A rapid deployment web application ideal for personal use and quick prototyping.

### 2. **Next.js Application** (TypeScript/React)
A production-ready full-stack application with advanced features and scalability.

### Core Technology Stack
- **AI Model**: OpenAI GPT-4 / GPT-3.5 Turbo
- **Embeddings**: text-embedding-ada-002 (1536 dimensions)
- **Vector Database**: Pinecone (serverless, AWS us-east-1)
- **Authentication**: JWT (Next.js) / Session-based (Streamlit)

## 📋 Features

### Core Functionality
- 📤 **Bulk Email Upload**: Process multiple .eml files simultaneously
- 🔍 **Semantic Search**: Vector similarity search through email history
- 🤖 **AI Response Generation**: Context-aware responses using RAG
- 📊 **Knowledge Base Management**: View, search, and manage processed emails
- 🎨 **Response Styles**: Multiple tone options (professional, friendly, brief, detailed)
- 🔒 **Security**: Authentication, input validation, and secure session management

### Advanced Features (Next.js)
- 🔐 JWT-based authentication with secure middleware
- 📱 Responsive design with modern UI components
- ⚡ Optimized API routes with TypeScript type safety
- 🎯 Zustand state management
- 🚦 Comprehensive error handling and recovery

## 🔧 Installation & Setup

### Prerequisites
- Python 3.8+ (for Streamlit)
- Node.js 18+ (for Next.js)
- OpenAI API key
- Pinecone API key

### Environment Configuration

#### For Streamlit App
Create `.streamlit/secrets.toml`:
```toml
OPENAI_API_KEY = "sk-..."
PINECONE_API_KEY = "..."
APP_PASSWORD = "..." # Optional password protection
```

#### For Next.js App
Create `.env.local`:
```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...
JWT_SECRET=your-secret-key
```

### Getting API Keys

#### OpenAI API Key
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key

#### Pinecone API Key
1. Visit [Pinecone.io](https://www.pinecone.io/)
2. Sign up for a free account
3. Navigate to API Keys in dashboard
4. Create an index named `email-rag-index` with 1536 dimensions

## 📁 Project Structure

```
emailogan/
├── Python/Streamlit Application
│   ├── app.py                     # Main Streamlit application
│   ├── email_processor.py         # Email parsing and extraction
│   ├── vector_manager.py          # Pinecone vector operations
│   ├── response_generator.py      # AI-powered response generation
│   ├── style_learning.py          # Writing style analysis
│   ├── security.py                # Security utilities
│   ├── monitoring.py              # Logging and error handling
│   ├── requirements.txt           # Python dependencies
│   └── .streamlit/
│       └── secrets.toml.example   # Secrets template
│
├── emailogan-web/                 # Next.js Application
│   ├── app/
│   │   ├── api/                   # API routes
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   ├── emails/           # Email processing
│   │   │   ├── vectors/          # Vector operations
│   │   │   └── generate/         # Response generation
│   │   ├── page.tsx              # Main application page
│   │   └── layout.tsx            # Root layout
│   ├── components/                # React components
│   │   ├── email-upload.tsx     # File upload interface
│   │   ├── response-generator.tsx # Response generation UI
│   │   └── knowledge-base.tsx   # Email management UI
│   ├── lib/                      # Core utilities
│   │   ├── auth.ts              # JWT authentication
│   │   ├── email-parser.ts      # Email parsing logic
│   │   ├── pinecone.ts          # Vector database client
│   │   └── openai.ts            # OpenAI integration
│   ├── store/                    # Zustand state management
│   └── package.json              # Node dependencies
│
├── Testing & Documentation
│   ├── test_app.py               # Python unit tests
│   ├── test_parser.py            # Email parser tests
│   ├── test_style_learning.py    # Style learning tests
│   ├── test-email-generation.js  # JavaScript tests
│   ├── README.md                 # This file
│   └── CLAUDE.md                 # AI assistant guidelines
│
└── Deployment Configurations
    ├── vercel.json               # Vercel deployment
    └── render.yaml               # Render deployment
```

## 🔄 Data Flow & Processing Pipeline

```
1. Email Upload (.eml files)
   ↓
2. Parse & Extract
   - Headers (from, to, subject, date)
   - Body content (plain text/HTML)
   - Metadata extraction
   ↓
3. Generate Embeddings
   - OpenAI text-embedding-ada-002
   - 1536-dimensional vectors
   - Truncate to 8000 chars if needed
   ↓
4. Store in Pinecone
   - Batch processing (100 vectors)
   - Metadata preservation
   - Deduplication check
   ↓
5. Query Similar Emails
   - Semantic similarity search
   - Retrieve top 15 matches
   - Context aggregation
   ↓
6. Generate Response
   - RAG-based generation
   - Style-aware output
   - Multi-style options
```

## 🛠️ Development Commands

### Streamlit Application
```bash
# Install dependencies
pip install -r requirements.txt

# Run development server
streamlit run app.py

# Run tests
python test_app.py
python test_parser.py
python test_style_learning.py
```

### Next.js Application
```bash
cd emailogan-web

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Vercel (Next.js)
1. Connect GitHub repository to Vercel
2. Set environment variables in dashboard
3. Deploy with automatic builds

### Streamlit Community Cloud
1. Push code to GitHub
2. Connect to [share.streamlit.io](https://share.streamlit.io)
3. Configure secrets in app settings

### Render
1. Create new Web Service
2. Connect GitHub repository
3. Configure build and start commands
4. Set environment variables

### Hugging Face Spaces
1. Create new Space with Streamlit SDK
2. Push code to Space
3. Configure secrets in settings

## 📊 API Endpoints (Next.js)

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Email Processing
- `POST /api/emails/process` - Parse and process .eml files
- `GET /api/emails/search` - Search processed emails

### Vector Operations
- `POST /api/vectors/store` - Store email vectors
- `POST /api/vectors/search` - Semantic similarity search
- `DELETE /api/vectors/clear` - Clear vector database

### Response Generation
- `POST /api/generate/response` - Generate AI response
- `POST /api/generate/style-analysis` - Analyze writing style

## ⚡ Performance Optimization

### Batch Processing
- Vectors processed in batches of 100
- Parallel email parsing for bulk uploads
- Chunked file reading for large attachments

### Caching Strategy
- Session-based cache for frequent queries
- Vector similarity results cached for 5 minutes
- Style analysis cached per sender

### Rate Limiting
- OpenAI API: 3 requests per second
- Pinecone: 100 upserts per batch
- Response generation: 60-second timeout

## 🔒 Security Features

### Authentication & Authorization
- JWT tokens with expiration (Next.js)
- Session-based auth with timeout (Streamlit)
- Password hashing (SHA256/bcrypt)

### Input Validation
- Email address validation
- File type verification (.eml only)
- Content length limits (8000 chars for embeddings)
- XSS protection on all inputs

### Data Protection
- Environment variables for sensitive data
- No storage of raw API keys
- Secure cookie handling (httpOnly, sameSite)
- HTTPS enforcement in production

## 🧪 Testing

### Unit Tests
```bash
# Python tests
python test_app.py        # Application logic
python test_parser.py     # Email parsing
python test_style_learning.py  # Style analysis

# JavaScript tests
node test-email-generation.js  # Email generation
```

### Integration Testing
- API endpoint testing with Postman/Insomnia
- Vector database operations verification
- End-to-end user flow testing

## 💰 Cost Estimates

### OpenAI API
- Embeddings: ~$0.0001 per 1K tokens
- GPT-4: ~$0.03 per 1K tokens
- Estimated: $20-30/month moderate usage

### Pinecone
- Free tier: 100K vectors, 1 index
- Starter: $70/month for 5M vectors
- Standard: $335/month for 50M vectors

### Hosting
- Vercel: Free tier available
- Streamlit Cloud: Free tier available
- Render: $7/month for web service

## 🐛 Troubleshooting

### Common Issues

#### "Failed to initialize Pinecone"
- Verify API key is correct
- Ensure index `email-rag-index` exists
- Check dimension count is 1536

#### "OpenAI API error"
- Validate API key
- Check account credits
- Verify rate limits

#### "Email parsing failed"
- Ensure .eml file format
- Check for corrupted files
- Verify character encoding

#### "JWT verification failed"
- Check JWT_SECRET is set
- Verify token expiration
- Clear browser cookies

### Debug Mode
```bash
# Streamlit
streamlit run app.py --logger.level=debug

# Next.js
DEBUG=* npm run dev
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Open an issue on GitHub
- **Discussions**: Join our Discord server
- **Email**: support@emailogan.com

## 🔮 Roadmap

### Version 2.0
- [ ] Multi-language support
- [ ] Advanced style learning with fine-tuning
- [ ] Email template library
- [ ] Batch response generation

### Version 3.0
- [ ] Mobile applications (iOS/Android)
- [ ] Browser extensions
- [ ] Team collaboration features
- [ ] Custom AI model training

## 🙏 Acknowledgments

- OpenAI for GPT models and embeddings
- Pinecone for vector database infrastructure
- Streamlit and Next.js communities
- All contributors and users

---

**EmailOgan** - Transform your email communication with AI
*Built with ❤️ for better email experiences*