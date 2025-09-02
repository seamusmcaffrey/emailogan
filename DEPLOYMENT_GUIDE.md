# EmailOgan Streamlit Cloud Deployment Guide

## 🚀 Quick Start

### Prerequisites
- GitHub account
- Streamlit Cloud account (free at [share.streamlit.io](https://share.streamlit.io))
- OpenAI API key
- Pinecone API key

## 📋 Pre-Deployment Checklist

### 1. Test Locally First
```bash
# Run diagnostic app to check environment
streamlit run diagnostic_app.py

# If diagnostics pass, test main app
streamlit run app.py
```

### 2. Verify Files
Ensure these files exist in your repository:
- ✅ `app.py` - Main application
- ✅ `requirements.txt` - Dependencies
- ✅ `diagnostic_app.py` - Deployment diagnostics
- ✅ All module files (email_processor.py, vector_manager.py, etc.)

### 3. Check Requirements
Your `requirements.txt` should include:
```txt
streamlit==1.32.0
pandas==2.2.0
numpy>=1.24.0
python-dateutil==2.8.2
eml-parser==1.17.0
openai==1.12.0
llama-index==0.10.0
llama-index-core==0.10.0
llama-index-vector-stores-pinecone==0.1.0
llama-index-embeddings-openai==0.1.0
llama-index-llms-openai==0.1.0
pinecone-client>=3.0.0
psutil>=5.9.0
```

## 🔐 Secrets Configuration

### Required Secrets
Add these to Streamlit Cloud secrets (Settings → Secrets):

```toml
OPENAI_API_KEY = "sk-proj-..."
PINECONE_API_KEY = "pcsk_..."
APP_PASSWORD = "your-secure-password"  # Optional
```

⚠️ **NEVER commit API keys to your repository!**

## 📦 Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for Streamlit Cloud deployment"
git push origin main
```

### Step 2: Deploy on Streamlit Cloud
1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Click "New app"
3. Connect your GitHub repository
4. Configure:
   - **Repository**: Your GitHub repo URL
   - **Branch**: main
   - **Main file path**: app.py
5. Click "Advanced settings"
6. Add your secrets in the "Secrets" section
7. Click "Deploy!"

### Step 3: Monitor Deployment
- Watch the deployment logs for errors
- The app will be available at: `https://[your-app-name].streamlit.app`

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Module not found" errors
- **Solution**: Check requirements.txt has all dependencies
- Run diagnostic app first to identify missing modules

#### 2. "Secrets not found" errors
- **Solution**: Ensure secrets are added in Streamlit Cloud settings
- Format: `KEY = "value"` (with quotes for strings)

#### 3. Memory/Resource errors
- **Solution**: Streamlit Cloud has limited resources
- Optimize by:
  - Caching expensive operations with `@st.cache_data`
  - Limiting file upload sizes
  - Using efficient data structures

#### 4. App crashes on startup
- **Solution**: Run diagnostic app first:
  1. Change main file to `diagnostic_app.py`
  2. Deploy and check diagnostics
  3. Fix issues identified
  4. Switch back to `app.py`

#### 5. Import errors for local modules
- **Solution**: Ensure all .py files are in repository root
- Check file names match import statements

## 🛡️ Security Best Practices

1. **Never commit secrets**: Use Streamlit secrets or environment variables
2. **Use password protection**: Configure APP_PASSWORD for sensitive data
3. **Validate inputs**: Sanitize user inputs before processing
4. **Monitor usage**: Check Streamlit Cloud analytics regularly
5. **Regular updates**: Keep dependencies updated for security patches

## 📊 Testing Deployment

### Quick Test Sequence
1. **Diagnostic Test**: Navigate to `/diagnostic_app.py` first
2. **Login Test**: Verify password protection works
3. **Upload Test**: Try uploading a small .eml file
4. **Processing Test**: Generate a response
5. **Export Test**: Download results

### Performance Checks
- Initial load time: Should be < 30 seconds
- File processing: < 1 minute for 100 emails
- Response generation: < 10 seconds per query

## 🔄 Updating Your App

### To update after deployment:
```bash
# Make your changes locally
# Test thoroughly
streamlit run app.py

# Commit and push
git add .
git commit -m "Update: [description]"
git push origin main

# Streamlit Cloud will auto-redeploy
```

## 📈 Monitoring

### Check these regularly:
- **App logs**: Available in Streamlit Cloud dashboard
- **Usage metrics**: Monitor user sessions and resource usage
- **Error reports**: Set up alerts for critical errors
- **API usage**: Track OpenAI and Pinecone API consumption

## 🆘 Support Resources

- **Streamlit Docs**: [docs.streamlit.io](https://docs.streamlit.io)
- **Community Forum**: [discuss.streamlit.io](https://discuss.streamlit.io)
- **GitHub Issues**: Report bugs in your repository
- **Streamlit Cloud Status**: [status.streamlit.io](https://status.streamlit.io)

## ✅ Final Checklist Before Going Live

- [ ] All tests pass locally
- [ ] Diagnostic app shows all green checks
- [ ] Secrets configured in Streamlit Cloud
- [ ] No hardcoded API keys in code
- [ ] Requirements.txt is complete
- [ ] Password protection enabled (if needed)
- [ ] Repository is public (or you have Streamlit Teams)
- [ ] README.md updated with usage instructions

---

**Remember**: Always test with `diagnostic_app.py` first if you encounter deployment issues!