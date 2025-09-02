from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.llms.openai import OpenAI
import streamlit as st
from typing import Dict, Optional
import json
import logging

logger = logging.getLogger(__name__)

class ResponseGenerator:
    def __init__(self):
        logger.info("Initializing ResponseGenerator")
        api_key = st.secrets.get("OPENAI_API_KEY", "")
        if not api_key:
            logger.error("OPENAI_API_KEY not found in secrets")
            raise ValueError("OPENAI_API_KEY not found in secrets. Please add it to .streamlit/secrets.toml")
        
        self.llm = OpenAI(
            model="gpt-4",
            api_key=api_key,
            temperature=0.3  # Lower temperature for better adherence to RAG style
        )
        logger.info("ResponseGenerator initialized successfully")
    
    def generate_response(self, 
                         incoming_email: str, 
                         sender_email: str,
                         vector_index,
                         response_style: str = "professional",
                         message_type: str = "general",
                         is_internal: bool = False,
                         user_email: Optional[str] = None) -> Dict:
        """Generate personalized email response"""
        logger.info(f"Generating embedding-based response for {sender_email}")
        logger.info(f"Message type: {message_type}, Internal: {is_internal}, User: {user_email}")
        
        # Increase context retrieval for better style learning (more for larger corpus)
        query_engine = vector_index.as_query_engine(
            llm=self.llm,
            similarity_top_k=15,  # Increased from 10 for larger corpus
            response_mode="compact",  # Ensures all context is used
            verbose=True  # For debugging what's retrieved
        )
        
        prompt = self.build_response_prompt(
            incoming_email, 
            sender_email, 
            response_style,
            message_type,
            is_internal,
            user_email
        )
        
        try:
            logger.debug(f"Querying with prompt length: {len(prompt)}")
            response = query_engine.query(prompt)
            logger.info("Response generated successfully via embeddings")
            
            return {
                'success': True,
                'response': response.response,
                'sources': [node.metadata for node in response.source_nodes],
                'confidence': 'high',
                'mode': 'RAG with embeddings'
            }
        except Exception as e:
            logger.error(f"Error in generate_response: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'response': None
            }
    
    def build_response_prompt(self, 
                            incoming_email: str, 
                            sender_email: str,
                            response_style: str,
                            message_type: str = "general",
                            is_internal: bool = False,
                            user_email: Optional[str] = None) -> str:
        """Build contextually appropriate prompt"""
        
        style_instructions = {
            'professional': "Maintain a professional, courteous tone",
            'friendly': "Use a warm, friendly tone while remaining professional", 
            'brief': "Keep the response concise and to the point",
            'detailed': "Provide a comprehensive, detailed response"
        }
        
        message_type_context = {
            'general': "This is a general business email",
            'external_client': "This is from an external client - maintain extra professionalism",
            'internal_colleague': "This is from an internal colleague - can be more casual if appropriate",
            'discussion': "This is part of an ongoing discussion - reference context appropriately",
            'request': "This email contains a request - ensure you address it clearly",
            'update': "This is an update/status email - acknowledge and respond appropriately"
        }
        
        # Build context-aware information
        context_info = []
        if user_email:
            context_info.append(f"You are responding as: {user_email}")
        
        if is_internal:
            sender_domain = sender_email.split('@')[1] if '@' in sender_email else 'unknown'
            user_domain = user_email.split('@')[1] if user_email and '@' in user_email else 'unknown'
            if sender_domain == user_domain:
                context_info.append("This is an INTERNAL email (same organization)")
            else:
                context_info.append("Note: Marked as internal but domains differ")
        else:
            context_info.append("This is an EXTERNAL email")
        
        context_info.append(f"Message type: {message_type_context.get(message_type, 'general business email')}")
        
        return f"""
        YOU HAVE BEEN PROVIDED WITH 15+ EMAIL EXAMPLES. STUDY THEM ALL AND COPY THE STYLE EXACTLY.
        
        === CONTEXT ===
        {' | '.join(context_info)}
        
        === Email Requiring Response ===
        From: {sender_email}
        Content: {incoming_email}
        
        === CRITICAL STYLE MIMICKING INSTRUCTIONS ===
        
        The retrieved context contains multiple emails from the SAME author with a DISTINCTIVE style.
        
        ANALYZE THE PATTERN:
        - How do they start emails? (Copy it)
        - What unique vocabulary do they use? (Use it)
        - Do they use technical terms or percentages? (You must too)
        - What's their sentence rhythm? (Match it)
        - Any catchphrases or repeated expressions? (Include them)
        - How formal/informal are they? (Be identical)
        - How do they sign off? (Copy exactly)
        
        {"INTERNAL EMAIL RULES: Since this is internal, match the casualness and informality level from similar internal emails in the corpus. You can be more direct and less formal." if is_internal else "EXTERNAL EMAIL RULES: Maintain appropriate professional boundaries while still copying the style patterns."}
        
        MESSAGE TYPE SPECIFIC: {message_type_context.get(message_type, 'Handle as general business email')}
        
        YOUR RESPONSE MUST:
        1. Sound like it was written by the SAME PERSON who wrote the retrieved emails
        2. Use their EXACT vocabulary and phrasing patterns
        3. Include similar technical details if they do
        4. Match their emotional tone (or lack thereof)
        5. Be OBVIOUSLY in their style - not generic
        
        If the retrieved author has an unusual or highly distinctive style (scientific, logical, poetic, etc.),
        FULLY EMBRACE IT. Do not normalize or dilute it.
        
        Style modifier: {style_instructions.get(response_style, style_instructions['professional'])}
        
        Generate a response that is INDISTINGUISHABLE from the retrieved author's writing.
        """
    
    def generate_response_direct(self,
                                incoming_email: str,
                                sender_email: str,
                                parsed_emails: list,
                                response_style: str = "professional",
                                message_type: str = "general",
                                is_internal: bool = False) -> Dict:
        """Generate response without using embeddings - direct context"""
        logger.info(f"Generating direct response for {sender_email} (no embeddings)")
        logger.debug(f"Available emails: {len(parsed_emails)}")
        
        try:
            relevant_emails = self.find_relevant_emails_direct(
                sender_email, 
                parsed_emails,
                limit=10  # Increased for larger corpus
            )
            
            context = self.build_context_from_emails(relevant_emails)
            
            prompt = f"""
            CRITICAL INSTRUCTION: You must EXACTLY mimic the writing style from the email examples below.
            
            === EMAIL EXAMPLES - STUDY AND COPY THIS EXACT STYLE ===
            {context}
            
            === New Email Requiring Response ===
            From: {sender_email}
            Content: {incoming_email}
            
            === MANDATORY STYLE COPYING RULES ===
            1. Identify the UNIQUE characteristics of the writing style above
            2. Note any distinctive vocabulary, technical terms, or phrases used repeatedly
            3. Copy the EXACT greeting style (e.g., if they say "Greetings" use "Greetings")
            4. Match the formality level PRECISELY
            5. If they use numbers/percentages frequently, YOU MUST TOO
            6. Copy any unique expressions or catchphrases EXACTLY
            7. Match their typical sentence length and structure
            8. Use the SAME sign-off style
            9. If the style is highly distinctive or unusual, EMBRACE IT FULLY
            10. DO NOT dilute the style or make it more "normal"
            
            The emails above have a SPECIFIC author with a UNIQUE voice. 
            Your response must be indistinguishable from their writing style.
            
            Style preference: {response_style}
            
            Generate a response that could have been written by the SAME PERSON who wrote the example emails.
            """
            
            logger.debug(f"Sending prompt to LLM, length: {len(prompt)}")
            response = self.llm.complete(prompt)
            logger.info("Direct response generated successfully")
            
            return {
                'success': True,
                'response': response.text,
                'sources': relevant_emails[:3] if relevant_emails else [],
                'confidence': 'medium',
                'mode': 'direct'
            }
        except Exception as e:
            logger.error(f"Error in generate_response_direct: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'response': None
            }
    
    def find_relevant_emails_direct(self, sender_email: str, parsed_emails: list, limit: int = 10) -> list:
        """Find relevant emails without using embeddings"""
        logger.debug(f"Finding relevant emails for {sender_email}")
        relevant = []
        
        # First try to find emails from the same sender
        for email in parsed_emails:
            if sender_email.lower() in email.get('from', '').lower():
                relevant.append({
                    'filename': email.get('filename', 'Unknown'),
                    'sender': email.get('from', ''),
                    'subject': email.get('subject', ''),
                    'body_preview': email.get('body', ''),  # Use FULL body for style learning
                    'date': email.get('date', '')
                })
        
        # If no emails from sender found, use all emails for style reference
        if not relevant:
            logger.info(f"No emails from {sender_email} found, using all emails for style reference")
            for email in parsed_emails:
                relevant.append({
                    'filename': email.get('filename', 'Unknown'),
                    'sender': email.get('from', ''),
                    'subject': email.get('subject', ''),
                    'body_preview': email.get('body', ''),  # Use FULL body for style learning
                    'date': email.get('date', '')
                })
        
        relevant = sorted(relevant, key=lambda x: x.get('date', ''), reverse=True)
        
        logger.debug(f"Found {len(relevant)} relevant emails, returning top {limit}")
        return relevant[:limit]
    
    def build_context_from_emails(self, emails: list) -> str:
        """Build context string from email list"""
        if not emails:
            return "No previous email history found with this sender."
        
        context_parts = []
        for idx, email in enumerate(emails, 1):
            body_preview = email.get('body_preview', 'No content')
            # Include more body content for better style learning
            context_parts.append(f"""
Email {idx}:
- From: {email.get('sender', 'Unknown')}
- Subject: {email.get('subject', 'No subject')}
- Date: {email.get('date', 'Unknown date')}
- Content: {body_preview}
---""")
        
        return "\n".join(context_parts)
    
    def generate_baseline_response(self,
                                  incoming_email: str,
                                  sender_email: str,
                                  response_style: str = "professional",
                                  message_type: str = "general",
                                  is_internal: bool = False) -> Dict:
        """Generate a baseline response with NO context or style mimicking"""
        logger.info(f"=== GENERATING BASELINE RESPONSE (NO EMBEDDINGS) ===")
        logger.info(f"This is a control response without any style mimicking from the database")
        logger.info(f"Message type: {message_type}, Internal: {is_internal}")
        
        try:
            style_instructions = {
                'professional': "Write in a professional, courteous tone",
                'friendly': "Write in a warm, friendly tone while remaining professional", 
                'brief': "Keep the response concise and to the point",
                'detailed': "Provide a comprehensive, detailed response"
            }
            
            prompt = f"""
            Generate a standard email response to the following:
            
            From: {sender_email}
            Content: {incoming_email}
            
            Instructions:
            - {style_instructions.get(response_style, style_instructions['professional'])}
            - Do NOT try to mimic any particular style
            - Write in standard business English
            - Be helpful and responsive to the request
            
            Generate only the email response content, without subject line.
            """
            
            logger.debug(f"Baseline prompt length: {len(prompt)}")
            response = self.llm.complete(prompt)
            logger.info("Baseline response generated successfully")
            
            return {
                'success': True,
                'response': response.text,
                'sources': [],
                'confidence': 'baseline',
                'mode': 'BASELINE (No Embeddings/Context)'
            }
        except Exception as e:
            logger.error(f"Error in generate_baseline_response: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e),
                'response': None
            }