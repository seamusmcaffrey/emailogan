"""
Minimal diagnostic app to test Streamlit Cloud deployment
This version has minimal dependencies to help identify issues
"""
import streamlit as st
import sys
import os
import platform

st.set_page_config(page_title="EmailOgan Minimal Diagnostics", page_icon="🔧")

st.title("🔧 EmailOgan Minimal Deployment Test")

# Basic system info
st.header("System Information")
st.write(f"**Python Version:** {sys.version}")
st.write(f"**Platform:** {platform.platform()}")
st.write(f"**Working Directory:** {os.getcwd()}")

# Test Streamlit functionality
st.header("Streamlit Basic Test")
if st.button("Test Button"):
    st.success("✅ Streamlit is working!")

# Check for secrets
st.header("Secrets Check")
try:
    # Don't display the actual secret values
    if "OPENAI_API_KEY" in st.secrets:
        st.success("✅ OPENAI_API_KEY found in secrets")
    else:
        st.warning("⚠️ OPENAI_API_KEY not found in secrets")
    
    if "PINECONE_API_KEY" in st.secrets:
        st.success("✅ PINECONE_API_KEY found in secrets")
    else:
        st.warning("⚠️ PINECONE_API_KEY not found in secrets")
except Exception as e:
    st.error(f"❌ Error accessing secrets: {str(e)}")

# List files
st.header("Files in Directory")
files = os.listdir(os.getcwd())
for file in sorted(files)[:20]:  # Limit to first 20 files
    st.write(f"- {file}")

st.success("🎉 Minimal diagnostic complete!")
st.info("If this works but the full diagnostic fails, the issue is with dependencies.")