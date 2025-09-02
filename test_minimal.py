"""
Absolute minimal Streamlit app to test deployment
"""
import streamlit as st

st.title("🚀 Streamlit Cloud Test")
st.write("If you can see this, Streamlit is working!")

if st.button("Click me"):
    st.balloons()
    st.success("Button works!")

st.write("Python version:")
import sys
st.code(sys.version)