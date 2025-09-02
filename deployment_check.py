#!/usr/bin/env python3
"""
Comprehensive deployment readiness check for EmailOgan Streamlit app
Enhanced version with detailed diagnostics and fixes
"""

import os
import sys
import subprocess
import json
from pathlib import Path
from typing import List, Tuple, Dict

def run_command(cmd: str) -> Tuple[bool, str]:
    """Run a shell command and return success status and output"""
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.returncode == 0, result.stdout + result.stderr
    except Exception as e:
        return False, str(e)

def check_deployment_readiness():
    """Check if the app is ready for deployment"""
    
    print("=" * 60)
    print("EmailOgan Deployment Readiness Check")
    print("=" * 60)
    
    checks_passed = []
    checks_failed = []
    
    # Check 1: Required files exist
    print("\n1. Checking required files...")
    required_files = [
        'app.py',
        'requirements.txt',
        'email_processor.py',
        'vector_manager.py',
        'response_generator.py',
        'security.py',
        'monitoring.py'
    ]
    
    for file in required_files:
        if Path(file).exists():
            checks_passed.append(f"✓ {file} exists")
        else:
            checks_failed.append(f"✗ {file} missing")
    
    # Check 2: Configuration files
    print("\n2. Checking configuration files...")
    config_files = [
        ('.streamlit/config.toml', 'Optional but recommended'),
        ('runtime.txt', 'Optional, specifies Python version'),
        ('render.yaml', 'For Render deployment'),
        ('DEPLOYMENT.md', 'Deployment documentation')
    ]
    
    for file, desc in config_files:
        if Path(file).exists():
            checks_passed.append(f"✓ {file} exists ({desc})")
        else:
            print(f"  ℹ {file} not found ({desc})")
    
    # Check 3: Requirements.txt content
    print("\n3. Checking requirements.txt...")
    with open('requirements.txt', 'r') as f:
        requirements = f.read()
    
    essential_packages = [
        'streamlit',
        'eml-parser',
        'pinecone-client',
        'llama-index',
        'openai',
        'pandas'
    ]
    
    for package in essential_packages:
        if package in requirements:
            checks_passed.append(f"✓ {package} in requirements.txt")
        else:
            checks_failed.append(f"✗ {package} missing from requirements.txt")
    
    # Check 4: No hardcoded API keys
    print("\n4. Checking for hardcoded secrets...")
    suspicious_patterns = [
        ('sk-proj-', 'OpenAI API key'),
        ('pcsk_', 'Pinecone API key'),
        ('OPENAI_API_KEY = "', 'Hardcoded OpenAI key'),
        ('PINECONE_API_KEY = "', 'Hardcoded Pinecone key'),
        ('api_key="', 'Hardcoded API key'),
        ('API_KEY="', 'Hardcoded API key')
    ]
    
    python_files = list(Path('.').glob('*.py'))
    found_secrets = False
    
    for py_file in python_files:
        if py_file.name == 'deployment_check.py':  # Skip this file
            continue
        with open(py_file, 'r') as f:
            content = f.read()
            for pattern, desc in suspicious_patterns:
                if pattern in content:
                    # Check if it's properly using secrets
                    line_with_pattern = [line for line in content.split('\n') if pattern in line][0] if pattern in content else ''
                    if 'st.secrets' not in line_with_pattern and 'os.environ' not in line_with_pattern:
                        checks_failed.append(f"✗ {desc} found in {py_file.name}")
                        found_secrets = True
    
    if not found_secrets:
        checks_passed.append("✓ No hardcoded secrets detected")
    
    # Check 5: Streamlit secrets usage
    print("\n5. Checking Streamlit secrets usage...")
    app_content = Path('app.py').read_text()
    if 'st.secrets' in app_content or 'os.environ' in app_content:
        checks_passed.append("✓ App uses st.secrets or environment variables")
    else:
        print("  ℹ Make sure to use st.secrets for API keys in production")
    
    # Check 6: Git status
    print("\n6. Checking Git status...")
    if Path('.git').exists():
        checks_passed.append("✓ Git repository initialized")
    else:
        checks_failed.append("✗ Not a Git repository")
    
    # Check 7: Python imports test
    print("\n7. Testing Python imports...")
    import_test_passed = True
    critical_imports = [
        'streamlit',
        'pandas',
        'eml_parser',
        'openai',
        'pinecone',
        'llama_index'
    ]
    
    for module in critical_imports:
        try:
            __import__(module.replace('-', '_'))
            checks_passed.append(f"✓ {module} imports successfully")
        except ImportError as e:
            checks_failed.append(f"✗ Failed to import {module}: {str(e)}")
            import_test_passed = False
    
    # Check 8: Streamlit config
    print("\n8. Checking Streamlit configuration...")
    streamlit_config = Path('.streamlit/config.toml')
    if streamlit_config.exists():
        checks_passed.append("✓ Streamlit config exists")
        with open(streamlit_config, 'r') as f:
            config_content = f.read()
            if 'maxUploadSize' in config_content:
                checks_passed.append("✓ Upload size configured")
    else:
        print("  ℹ Creating recommended .streamlit/config.toml...")
        Path('.streamlit').mkdir(exist_ok=True)
        with open('.streamlit/config.toml', 'w') as f:
            f.write('''[server]
maxUploadSize = 200
headless = true

[browser]
gatherUsageStats = false
''')
        checks_passed.append("✓ Created .streamlit/config.toml")
    
    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    print(f"\n✓ Checks passed: {len(checks_passed)}")
    for check in checks_passed[:5]:  # Show first 5
        print(f"  {check}")
    if len(checks_passed) > 5:
        print(f"  ... and {len(checks_passed) - 5} more")
    
    if checks_failed:
        print(f"\n✗ Checks failed: {len(checks_failed)}")
        for check in checks_failed:
            print(f"  {check}")
    
    # Deployment instructions
    print("\n" + "=" * 60)
    print("DEPLOYMENT INSTRUCTIONS")
    print("=" * 60)
    
    if not checks_failed:
        print("\n✅ Your app is ready for deployment!")
        print("\n📋 Quick Deploy Checklist:")
        print("\n1. TEST LOCALLY:")
        print("   streamlit run diagnostic_app.py")
        print("   streamlit run app.py")
        print("\n2. COMMIT CHANGES:")
        print("   git add .")
        print("   git commit -m 'Ready for Streamlit Cloud deployment'")
        print("   git push origin main")
        print("\n3. DEPLOY ON STREAMLIT CLOUD:")
        print("   a. Go to https://share.streamlit.io")
        print("   b. Connect your GitHub repository")
        print("   c. Set Main file path: app.py")
        print("   d. Add secrets (click Advanced Settings > Secrets):")
        print("      OPENAI_API_KEY = \"your-key-here\"")
        print("      PINECONE_API_KEY = \"your-key-here\"")
        print("      APP_PASSWORD = \"your-password\" (optional)")
        print("   e. Click Deploy!")
        print("\n4. MONITOR DEPLOYMENT:")
        print("   - Check logs for any errors")
        print("   - Test with diagnostic_app.py first if issues occur")
    else:
        print("\n⚠️  Please fix the issues above before deploying.")
        print("\n🔧 Quick Fixes:")
        for i, check in enumerate(checks_failed[:5], 1):
            print(f"  {i}. {check}")
            if "import" in check.lower():
                module = check.split("import")[1].split(":")[0].strip()
                print(f"     Fix: pip install {module}")
            elif "missing" in check.lower() and ".py" in check:
                print(f"     Fix: Ensure file exists or remove from imports")
        print("\n💡 Run 'python deployment_check.py' again after fixes")
    
    print("\n" + "=" * 60)
    
    return len(checks_failed) == 0

if __name__ == "__main__":
    success = check_deployment_readiness()
    sys.exit(0 if success else 1)