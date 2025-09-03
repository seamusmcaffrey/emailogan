# Deployment Instructions for Email RAG Assistant

## Setting up Environment Variables in Vercel

### Via Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project or create a new one
3. Go to Settings → Environment Variables
4. Add the following variables:

```
OPENAI_API_KEY=your_openai_api_key_here
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_ENVIRONMENT=your_environment (e.g., "us-east-1")
PINECONE_INDEX_NAME=email-embeddings
JWT_SECRET=generate_secure_random_string_here
NEXTAUTH_SECRET=generate_another_secure_random_string_here
```

### Via Vercel CLI

```bash
# Set secrets
vercel secrets add openai-api-key "your_openai_api_key_here"
vercel secrets add pinecone-api-key "your_pinecone_api_key_here"
vercel secrets add pinecone-environment "your_environment"
vercel secrets add pinecone-index-name "email-embeddings"
vercel secrets add jwt-secret "your_jwt_secret"
vercel secrets add nextauth-secret "your_nextauth_secret"

# Link secrets to environment variables
vercel env add OPENAI_API_KEY
vercel env add PINECONE_API_KEY
vercel env add PINECONE_ENVIRONMENT
vercel env add PINECONE_INDEX_NAME
vercel env add JWT_SECRET
vercel env add NEXTAUTH_SECRET
```

## Deployment Steps

1. **Initial Setup**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   ```

2. **Deploy**
   ```bash
   # Deploy to preview
   vercel
   
   # Deploy to production
   vercel --prod
   ```

3. **Monitor Deployment**
   - Check build logs: `vercel logs`
   - Open dashboard: `vercel inspect`

## Post-Deployment Setup

1. **Create Pinecone Index**
   - Go to [Pinecone Console](https://console.pinecone.io/)
   - Create a new index named "email-embeddings"
   - Dimensions: 1536 (for OpenAI embeddings)
   - Metric: cosine

2. **Update Password Hash**
   - Generate new password hash
   - Update in production code
   - Redeploy

3. **Test the Application**
   - Visit your deployment URL
   - Login with password
   - Upload test email
   - Generate response

## Monitoring

- View logs: `vercel logs --follow`
- Check functions: `vercel functions ls`
- Monitor usage in Vercel Dashboard

## Troubleshooting Deployment

If deployment fails:

1. Check build logs for errors
2. Verify all environment variables are set
3. Ensure Pinecone index exists
4. Check API key validity
5. Review `vercel.json` configuration

## Rollback if Needed

```bash
# List deployments
vercel ls

# Rollback to previous version
vercel rollback [deployment-url]
```