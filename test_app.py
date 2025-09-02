import streamlit as st

st.set_page_config(page_title="Test App")

st.title("Test App")
st.write("If you see this, Streamlit is working!")

# Test secrets access
try:
    secret = st.secrets.get("TEST_KEY", "default")
    st.write(f"Secrets access working: {secret}")
except Exception as e:
    st.error(f"Error accessing secrets: {e}")