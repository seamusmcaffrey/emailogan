# Vercel Environment Variables Setup

## Required Environment Variables

The application requires the following environment variables to be set in Vercel:

1. **OPENAI_API_KEY** - Your OpenAI API key for GPT-4
2. **PINECONE_API_KEY** - Your Pinecone API key for vector storage
3. **JWT_SECRET** - A secret key for JWT token signing (see below for generation)
4. **APP_PASSWORD** - The password for application access (optional, defaults to system value)

## Important: NO QUOTES!

When adding environment variables in Vercel, enter the values **WITHOUT quotes**.

❌ WRONG:
```
"sk-proj-abc123..."
```

✅ CORRECT:
```
sk-proj-abc123...
```

## How to Add Environment Variables in Vercel

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (emailogan-web)
3. Click on "Settings" tab
4. Navigate to "Environment Variables" in the left sidebar
5. Add each variable:
   - **Key**: The variable name (e.g., `OPENAI_API_KEY`)
   - **Value**: The actual value WITHOUT quotes
   - **Environment**: Select all (Production, Preview, Development)
6. Click "Save" for each variable

## Generating a JWT_SECRET

You can generate a secure JWT_SECRET using one of these methods:

### Option 1: Use Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: Use OpenSSL
```bash
openssl rand -hex 32
```

### Option 3: Use an online generator
Visit: https://generate-secret.vercel.app/32

## Example Values (for reference only)

```
OPENAI_API_KEY=sk-proj-abcdefghijklmnopqrstuvwxyz123456789
PINECONE_API_KEY=12345678-90ab-cdef-1234-567890abcdef
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
APP_PASSWORD=your_secure_password_here
```

## Verifying Your Setup

After adding the environment variables:

1. Go to "Settings" → "Functions" tab in Vercel
2. Check the logs for your API routes
3. The console should show environment check logs

## Redeployment

After adding or updating environment variables:

1. Go to the "Deployments" tab
2. Click on the three dots menu of the latest deployment
3. Select "Redeploy"
4. Choose "Use existing Build Cache" (faster) or "Force new build"

## Troubleshooting

If you're still getting 503 errors after setting environment variables:

1. **Check for typos** in variable names
2. **Ensure no quotes** around values
3. **Verify the values** are complete (no truncation)
4. **Check deployment logs** in Vercel dashboard
5. **Force a new deployment** without cache

## Need Help?

- Check browser console for detailed error messages
- Look at Vercel Function logs for server-side errors
- The error response will now show which specific variables are missing