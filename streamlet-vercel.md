COMPREHENSIVE MIGRATION PLAN: STREAMLIT → VERCEL

  EXECUTIVE SUMMARY

  Converting your Email RAG Assistant from Streamlit to a Next.js application deployable on Vercel. This will resolve Streamlit
  deployment issues while providing better performance, scalability, and user experience.

  ---
  ARCHITECTURE OVERVIEW

  Current State (Streamlit)

  [Streamlit App] → [Python Backend] → [OpenAI/Pinecone APIs]
        ↓
  [Session State Management]

  Target State (Next.js + Vercel)

  [React Frontend] ↔ [API Routes/Vercel Functions] → [OpenAI/Pinecone APIs]
         ↓                      ↓
  [Client State]        [Edge Functions]

  ---
  DETAILED IMPLEMENTATION PLAN

  Phase 1: Project Setup & Core Infrastructure

  1. Next.js Project Initialization
    - Create Next.js 14 app with TypeScript
    - App Router structure for modern React patterns
    - Configure Tailwind CSS for styling
    - Setup ESLint and Prettier
  2. Environment Configuration
    - Move API keys to Vercel environment variables
    - Setup .env.local for development
    - Configure CORS and security headers

  Phase 2: Backend API Development (Vercel Functions)

  3. Authentication API (/api/auth/)
    - JWT-based authentication
    - Session management with httpOnly cookies
    - Password verification endpoint
  4. Email Processing APIs (/api/emails/)
    - /upload - Handle .eml file uploads (multipart/form-data)
    - /parse - Parse email content using Python runtime
    - /process - Generate embeddings via OpenAI
    - /list - Retrieve knowledge base entries
  5. Vector Database APIs (/api/vectors/)
    - /create-index - Initialize Pinecone index
    - /store - Store email embeddings
    - /search - Query similar emails
    - /clear - Reset vector database
  6. Response Generation API (/api/generate/)
    - /response - Generate email responses with GPT-4
    - Support for streaming responses
    - Include source email references

  Phase 3: Frontend Development

  7. Core React Components
  components/
  ├── Layout/
  │   ├── Header.tsx
  │   ├── Navigation.tsx
  │   └── Footer.tsx
  ├── Auth/
  │   └── LoginForm.tsx
  ├── Upload/
  │   ├── FileUploader.tsx
  │   ├── ProgressBar.tsx
  │   └── EmailList.tsx
  ├── Generate/
  │   ├── ResponseForm.tsx
  │   ├── ResponseDisplay.tsx
  │   └── SourceEmails.tsx
  └── KnowledgeBase/
      ├── EmailViewer.tsx
      └── Statistics.tsx
  8. State Management
    - Zustand for global state (user, emails, settings)
    - React Query for API data fetching
    - Local storage for persistence
  9. UI/UX Implementation
    - Responsive design with Tailwind CSS
    - Loading states and skeletons
    - Toast notifications for feedback
    - Modal dialogs for confirmations

  Phase 4: Feature Migration

  10. File Upload System
    - Drag-and-drop interface
    - ZIP file extraction client-side
    - Progress tracking with WebSocket/SSE
    - Chunked upload for large files
  11. Email Processing Pipeline
    - Queue-based processing for scalability
    - Background jobs for embedding generation
    - Real-time progress updates
  12. Response Generation Interface
    - Form with style selector
    - Streaming response display
    - Copy-to-clipboard functionality
    - Email source expandable sections

  Phase 5: Deployment & Optimization

  13. Vercel Configuration
  {
    "functions": {
      "api/emails/process.ts": {
        "maxDuration": 60
      },
      "api/generate/response.ts": {
        "maxDuration": 30
      }
    },
    "env": {
      "OPENAI_API_KEY": "@openai-api-key",
      "PINECONE_API_KEY": "@pinecone-api-key",
      "JWT_SECRET": "@jwt-secret"
    }
  }
  14. Performance Optimizations
    - Image optimization with next/image
    - Code splitting and lazy loading
    - API route caching
    - Edge function deployment for auth

  ---
  TECHNICAL DECISIONS

  Frontend Stack

  - Next.js 14 - Full-stack React framework
  - TypeScript - Type safety
  - Tailwind CSS - Utility-first styling
  - Zustand - Lightweight state management
  - React Query - Server state management
  - React Hook Form - Form handling

  Backend Stack

  - Vercel Functions - Serverless API routes
  - Python Runtime - For email parsing compatibility
  - JWT - Stateless authentication
  - Zod - Request validation

  External Services

  - OpenAI API - Unchanged
  - Pinecone - Unchanged
  - Vercel KV - Optional for session storage

  ---
  FILE STRUCTURE

  emailogan-web/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── upload/page.tsx
  │   ├── generate/page.tsx
  │   └── knowledge/page.tsx
  ├── components/
  ├── lib/
  │   ├── auth.ts
  │   ├── openai.ts
  │   ├── pinecone.ts
  │   └── email-parser.ts
  ├── api/
  │   ├── auth/[...auth].ts
  │   ├── emails/[...emails].ts
  │   └── generate/[...generate].ts
  ├── hooks/
  ├── store/
  ├── styles/
  ├── public/
  ├── .env.local
  ├── vercel.json
  └── package.json

  ---
  MIGRATION STEPS (IN ORDER)

  1. Create Next.js project with TypeScript
  2. Setup authentication system
  3. Build email upload API
  4. Implement vector database integration
  5. Create response generation endpoint
  6. Build React UI components
  7. Implement state management
  8. Add styling and responsive design
  9. Configure Vercel environment
  10. Deploy and test