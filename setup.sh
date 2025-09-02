#!/bin/bash

echo "🚀 Email RAG Assistant Setup"
echo "=========================="
echo ""

# Check Python version
echo "📌 Checking Python version..."
python_version=$(python3 --version 2>&1 | grep -oE '[0-9]+\.[0-9]+')
if [ -z "$python_version" ]; then
    echo "❌ Python 3 not found. Please install Python 3.8 or higher."
    exit 1
fi
echo "✅ Python $python_version found"
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Setup secrets file
if [ ! -f .streamlit/secrets.toml ]; then
    echo "🔑 Setting up secrets file..."
    cp .streamlit/secrets.toml.example .streamlit/secrets.toml
    echo "✅ Secrets file created"
    echo ""
    echo "⚠️  IMPORTANT: Please edit .streamlit/secrets.toml and add your API keys:"
    echo "   - OpenAI API key"
    echo "   - Pinecone API key"
    echo ""
else
    echo "✅ Secrets file already exists"
    echo ""
fi

echo "🎉 Setup complete!"
echo ""
echo "To run the application:"
echo "  1. Activate virtual environment: source venv/bin/activate"
echo "  2. Run the app: streamlit run app.py"
echo ""
echo "Don't forget to add your API keys to .streamlit/secrets.toml!"