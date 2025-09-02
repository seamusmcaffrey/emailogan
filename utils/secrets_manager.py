"""
Secrets Manager for handling API keys and sensitive configuration
"""
import os
import streamlit as st
import logging

logger = logging.getLogger(__name__)

class SecretsManager:
    """Centralized secrets management for Streamlit deployment"""
    
    @staticmethod
    def get_secret(key: str, default: str = None) -> str:
        """
        Get a secret value from environment or Streamlit secrets
        
        Args:
            key: The secret key to retrieve
            default: Default value if secret not found
            
        Returns:
            The secret value or default
        """
        # Try environment variable first (for local development)
        value = os.environ.get(key)
        if value:
            logger.debug(f"Found {key} in environment variables")
            return value
        
        # Try Streamlit secrets (for Streamlit Cloud)
        try:
            if hasattr(st, 'secrets'):
                value = st.secrets.get(key)
                if value:
                    logger.debug(f"Found {key} in Streamlit secrets")
                    return value
        except Exception as e:
            logger.warning(f"Error accessing Streamlit secrets for {key}: {str(e)}")
        
        # Return default or raise error
        if default is not None:
            logger.warning(f"Using default value for {key}")
            return default
        
        error_msg = f"Secret '{key}' not found in environment or Streamlit secrets"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    @staticmethod
    def get_openai_key() -> str:
        """Get OpenAI API key with proper error handling"""
        try:
            return SecretsManager.get_secret("OPENAI_API_KEY")
        except ValueError:
            st.error("❌ OpenAI API key not configured. Please add OPENAI_API_KEY to Streamlit secrets.")
            st.stop()
    
    @staticmethod
    def get_pinecone_key() -> str:
        """Get Pinecone API key with proper error handling"""
        try:
            return SecretsManager.get_secret("PINECONE_API_KEY")
        except ValueError:
            st.error("❌ Pinecone API key not configured. Please add PINECONE_API_KEY to Streamlit secrets.")
            st.stop()
    
    @staticmethod
    def validate_secrets() -> bool:
        """
        Validate that all required secrets are available
        
        Returns:
            True if all secrets are valid, False otherwise
        """
        required_secrets = ["OPENAI_API_KEY", "PINECONE_API_KEY"]
        missing_secrets = []
        
        for secret in required_secrets:
            try:
                value = SecretsManager.get_secret(secret)
                if not value or len(value) < 10:
                    missing_secrets.append(secret)
            except ValueError:
                missing_secrets.append(secret)
        
        if missing_secrets:
            logger.error(f"Missing required secrets: {missing_secrets}")
            return False
        
        logger.info("All required secrets validated successfully")
        return True