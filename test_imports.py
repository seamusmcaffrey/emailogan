#!/usr/bin/env python3
"""
Test that all local modules can be imported without errors
This helps catch import issues before deployment
"""

import sys
import traceback

def test_imports():
    """Test importing all local modules"""
    
    print("Testing local module imports...")
    print("-" * 40)
    
    modules_to_test = [
        'email_processor',
        'vector_manager', 
        'response_generator',
        'security',
        'monitoring'
    ]
    
    all_good = True
    
    for module in modules_to_test:
        try:
            __import__(module)
            print(f"✓ {module} imported successfully")
        except ImportError as e:
            print(f"✗ {module} import failed: {e}")
            all_good = False
        except Exception as e:
            print(f"✗ {module} has errors: {e}")
            traceback.print_exc()
            all_good = False
    
    print("-" * 40)
    
    if all_good:
        print("✅ All modules can be imported!")
        print("\nNote: This doesn't test third-party dependencies.")
        print("Those will be installed during deployment.")
    else:
        print("⚠️  Some modules have import issues.")
        print("This might be due to missing third-party packages.")
        print("These will be installed during deployment via requirements.txt")
    
    return all_good

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)