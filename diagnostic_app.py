import streamlit as st
import sys
import os
import platform
import subprocess
import traceback
from datetime import datetime

st.set_page_config(page_title="EmailOgan Diagnostics", page_icon="🔧")

st.title("🔧 EmailOgan Deployment Diagnostics")
st.write(f"Diagnostic run at: {datetime.now().isoformat()}")

# System Information
st.header("📊 System Information")
col1, col2 = st.columns(2)
with col1:
    st.write(f"**Python Version:** {sys.version}")
    st.write(f"**Platform:** {platform.platform()}")
with col2:
    st.write(f"**Architecture:** {platform.architecture()}")
    st.write(f"**Working Directory:** {os.getcwd()}")

# Environment Variables
st.header("🔐 Environment Check")
env_status = []

# Check for critical environment variables
critical_vars = ["OPENAI_API_KEY", "PINECONE_API_KEY"]
for var in critical_vars:
    # Check in environment
    env_value = os.environ.get(var)
    if env_value:
        env_status.append(f"✅ {var} found in environment (length: {len(env_value)})")
    else:
        env_status.append(f"⚠️ {var} not in environment")
    
    # Check in secrets
    try:
        secret_value = st.secrets.get(var)
        if secret_value:
            env_status.append(f"✅ {var} found in secrets (length: {len(secret_value)})")
        else:
            env_status.append(f"❌ {var} not in secrets")
    except Exception as e:
        env_status.append(f"❌ {var} secrets access failed: {str(e)}")

for status in env_status:
    st.write(status)

# File System Check
st.header("📁 File System Check")
current_dir = os.getcwd()
st.write(f"**Current Directory:** `{current_dir}`")

# List all files with sizes
files_info = []
for file in os.listdir(current_dir):
    file_path = os.path.join(current_dir, file)
    if os.path.isfile(file_path):
        size = os.path.getsize(file_path) / 1024  # KB
        files_info.append(f"📄 {file} ({size:.2f} KB)")
    else:
        files_info.append(f"📁 {file}/")

st.write("**Files and Directories:**")
for info in sorted(files_info):
    st.write(info)

# Import Test with detailed error reporting
st.header("📦 Package Import Test")

import_results = []
critical_imports = {
    "streamlit": "Core framework",
    "pandas": "Data manipulation",
    "numpy": "Numerical operations",
    "eml_parser": "Email parsing",
    "openai": "OpenAI API",
    "pinecone": "Vector database",
    "llama_index": "LlamaIndex framework",
    "llama_index.core": "LlamaIndex core",
    "llama_index.vector_stores.pinecone": "Pinecone integration",
    "llama_index.embeddings.openai": "OpenAI embeddings"
}

for module, description in critical_imports.items():
    try:
        if "." in module:
            # Handle submodules
            parts = module.split(".")
            imported = __import__(module, fromlist=[parts[-1]])
        else:
            imported = __import__(module)
        
        # Try to get version if available
        version = "unknown"
        if hasattr(imported, "__version__"):
            version = imported.__version__
        elif hasattr(imported, "version"):
            version = imported.version
        
        import_results.append(("✅", module, description, f"v{version}"))
    except ImportError as e:
        import_results.append(("❌", module, description, str(e)))
    except Exception as e:
        import_results.append(("⚠️", module, description, f"Unexpected error: {str(e)}"))

# Display results in a table
import pandas as pd
df = pd.DataFrame(import_results, columns=["Status", "Module", "Description", "Details"])
st.dataframe(df, use_container_width=True, hide_index=True)

# Memory and Resource Check
st.header("💾 Resource Check")
try:
    import psutil
    memory = psutil.virtual_memory()
    cpu_count = psutil.cpu_count()
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Total Memory", f"{memory.total / (1024**3):.2f} GB")
    with col2:
        st.metric("Available Memory", f"{memory.available / (1024**3):.2f} GB")
    with col3:
        st.metric("Memory Usage", f"{memory.percent}%")
    
    st.write(f"**CPU Cores:** {cpu_count}")
except ImportError:
    st.warning("psutil not available - install with: pip install psutil")
except Exception as e:
    st.error(f"Resource check failed: {str(e)}")

# Requirements.txt validation
st.header("📋 Requirements.txt Validation")
if os.path.exists("requirements.txt"):
    with open("requirements.txt", "r") as f:
        requirements = f.read()
    
    st.text_area("Current requirements.txt:", requirements, height=200)
    
    # Check if each requirement is installed
    st.write("**Installation Status:**")
    for line in requirements.strip().split("\n"):
        if line and not line.startswith("#"):
            package_name = line.split("==")[0].split(">=")[0].split("~=")[0].strip()
            try:
                __import__(package_name.replace("-", "_").lower())
                st.write(f"✅ {line}")
            except ImportError:
                st.write(f"❌ {line} - NOT INSTALLED")
else:
    st.error("requirements.txt not found!")

# Streamlit Cloud specific checks
st.header("☁️ Streamlit Cloud Compatibility")
checks = []

# Check Python version compatibility
python_version = sys.version_info
if python_version.major == 3 and python_version.minor >= 8:
    checks.append("✅ Python version compatible (3.8+)")
else:
    checks.append(f"❌ Python {python_version.major}.{python_version.minor} may not be compatible")

# Check for problematic packages
problematic_packages = ["faiss-cpu", "faiss-gpu", "chromadb"]
for pkg in problematic_packages:
    try:
        __import__(pkg.replace("-", "_"))
        checks.append(f"⚠️ {pkg} found - may cause issues on Streamlit Cloud")
    except ImportError:
        checks.append(f"✅ {pkg} not present")

for check in checks:
    st.write(check)

# Test basic Streamlit functionality
st.header("🧪 Streamlit Functionality Test")
try:
    # Test session state
    if "test_counter" not in st.session_state:
        st.session_state.test_counter = 0
    
    if st.button("Test Session State"):
        st.session_state.test_counter += 1
        st.success(f"Session state working! Counter: {st.session_state.test_counter}")
    
    # Test file uploader
    uploaded = st.file_uploader("Test file upload", type=["txt", "eml"])
    if uploaded:
        st.success(f"File upload working! File: {uploaded.name}")
    
    # Test columns
    col1, col2 = st.columns(2)
    with col1:
        st.write("Column 1 ✅")
    with col2:
        st.write("Column 2 ✅")
    
    st.success("All Streamlit features tested successfully!")
except Exception as e:
    st.error(f"Streamlit functionality test failed: {str(e)}")
    st.text(traceback.format_exc())

# Final status
st.header("📊 Diagnostic Summary")
if all("✅" in str(status) for status in env_status if "OPENAI" in str(status) or "PINECONE" in str(status)):
    st.success("🎉 Environment configuration looks good!")
else:
    st.warning("⚠️ Some environment issues detected - check the logs above")

st.info("💡 **Next Steps:**\n"
        "1. Fix any ❌ items above\n"
        "2. Update requirements.txt with missing packages\n"
        "3. Ensure secrets are properly configured in Streamlit Cloud\n"
        "4. Check memory usage - Streamlit Cloud has limited resources")