# Email RAG Assistant

A web-based email response generation system using RAG (Retrieval-Augmented Generation) technology. Upload your email history (.eml files) to create a personalized AI assistant that generates contextually appropriate responses based on your communication patterns.

## Features

- 📤 **Bulk Email Upload**: Process multiple .eml files at once
- 🔍 **Vector Search**: Semantic search through email history using Pinecone
- 🤖 **AI Response Generation**: GPT-4 powered responses matching your writing style
- 📊 **Knowledge Base Management**: View and search your processed emails
- 🎨 **Response Styles**: Choose between professional, friendly, brief, or detailed tones
- 🔒 **Security**: Session management and input sanitization

## Prerequisites

- Python 3.8+
- OpenAI API key
- Pinecone API key (free tier available)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd emailogan
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up API keys:
   - Copy the secrets template:
   ```bash
   cp .streamlit/secrets.toml.example .streamlit/secrets.toml
   ```
   - Edit `.streamlit/secrets.toml` and add your API keys:
   ```toml
   OPENAI_API_KEY = "sk-..."
   PINECONE_API_KEY = "your-pinecone-key"
   ```

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key

### Pinecone API Key
1. Go to [Pinecone.io](https://www.pinecone.io/)
2. Sign up for a free account
3. Navigate to API Keys in the dashboard
4. Copy your API key

## Running Locally

```bash
streamlit run app.py
```

The application will open in your browser at `http://localhost:8501`

## Usage

### 1. Upload Emails
- Navigate to "Upload & Process" mode
- Select multiple .eml files from your computer
- Click "Process Files" to parse the emails
- Click "Create Vector Database" to generate embeddings

### 2. Generate Responses
- Switch to "Generate Response" mode
- Enter the sender's email address
- Paste the incoming email content
- Select your preferred response style
- Click "Generate Response"
- Edit the generated response if needed

### 3. Manage Knowledge Base
- View all processed emails in "View Knowledge Base" mode
- Search through your email history
- Monitor statistics about your email database
- Clear the knowledge base when needed

## Deployment Options

### Hugging Face Spaces (Free)
1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space)
2. Choose Streamlit as the SDK
3. Push your code to the Space
4. Add secrets in the Space settings

### Streamlit Community Cloud
1. Push code to GitHub
2. Connect to [share.streamlit.io](https://share.streamlit.io)
3. Deploy from your repository
4. Add secrets in the app settings

### Render.com
1. Create a new Web Service
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `streamlit run app.py`
5. Add environment variables for API keys

## Project Structure

```
emailogan/
├── app.py                 # Main Streamlit application
├── email_processor.py     # Email parsing and processing
├── vector_manager.py      # Pinecone vector database management
├── response_generator.py  # AI response generation
├── security.py           # Security utilities
├── monitoring.py         # Error handling and logging
├── requirements.txt      # Python dependencies
├── .streamlit/
│   └── secrets.toml.example  # API keys template
└── README.md            # Documentation
```

## Troubleshooting

### Common Issues

1. **"Failed to initialize Pinecone"**
   - Verify your Pinecone API key is correct
   - Check if you're within Pinecone's free tier limits

2. **"OpenAI API error"**
   - Ensure your OpenAI API key is valid
   - Check if you have credits in your OpenAI account

3. **"No module named..."**
   - Run `pip install -r requirements.txt` again
   - Consider using a virtual environment

4. **Large email files taking too long**
   - Process emails in smaller batches
   - Consider upgrading to paid tiers for better performance

## Security Considerations

- Never commit your `secrets.toml` file
- API keys are stored locally and never transmitted
- Session timeout after 1 hour of inactivity
- Input sanitization for all user inputs

## Cost Estimates

- **OpenAI API**: ~$20-30/month for moderate usage
- **Pinecone**: Free tier (up to 100K vectors) or $70/month for starter
- **Hosting**: Free on Hugging Face Spaces or Streamlit Cloud

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues.

## License

MIT License - See LICENSE file for details

## Support

For issues or questions, please open an issue on GitHub.