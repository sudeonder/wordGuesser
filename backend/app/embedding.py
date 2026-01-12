"""
Word embedding utilities for computing similarity between words using fastText.

This module loads a fastText embedding model and provides functions to compute
cosine similarity between word vectors.
"""

import fasttext
import numpy as np
import os
from typing import Optional

# Global variable to store the loaded model
_model: Optional[fasttext.FastText._FastText] = None


def load_embedding_model(model_path: str) -> fasttext.FastText._FastText:
    """
    Load the fastText embedding model.
    
    This should be called once at application startup to load the model into memory.
    The model will be reused for all similarity calculations.
    
    Args:
        model_path: Path to the fastText model file (.bin file)
        
    Returns:
        The loaded fastText model object
        
    Raises:
        FileNotFoundError: If the model file doesn't exist
        Exception: If there's an error loading the model
    """
    global _model
    
    if _model is not None:
        return _model
    
    # Check if file exists
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"FastText model not found at: {model_path}\n"
            f"Please download a pre-trained model from:\n"
            f"  - English Common Crawl (300-dim): https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.en.300.bin\n"
            f"  - English Wikipedia (smaller): https://dl.fbaipublicfiles.com/fasttext/vectors-wiki/wiki.en.bin"
        )
    
    print(f"Loading fastText model from {model_path}...")
    _model = fasttext.load_model(model_path)
    print("FastText model loaded successfully!")
    
    return _model


def get_model() -> Optional[fasttext.FastText._FastText]:
    """
    Get the currently loaded model.
    
    Returns:
        The loaded model or None if not loaded yet
    """
    return _model


def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """
    Calculate cosine similarity between two vectors.
    
    Args:
        vec1: First vector
        vec2: Second vector
        
    Returns:
        Cosine similarity score between -1 and 1 (typically between 0 and 1 for word vectors)
    """
    dot_product = np.dot(vec1, vec2)
    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    
    # Handle zero vectors
    if norm1 == 0 or norm2 == 0:
        return 0.0
    
    similarity = dot_product / (norm1 * norm2)
    
    # Ensure the result is between -1 and 1 (should already be, but just in case)
    return max(-1.0, min(1.0, similarity))


def compute_similarity(word1: str, word2: str) -> float:
    """
    Compute cosine similarity between two words using fastText embeddings.
    
    If the fastText model is not loaded, falls back to a simple character-based similarity.
    
    Args:
        word1: First word
        word2: Second word
        
    Returns:
        Similarity score between 0 and 1
    """
    word1 = word1.lower().strip()
    word2 = word2.lower().strip()
    
    # Exact match
    if word1 == word2:
        return 1.0
    
    # If model is not loaded, use fallback similarity
    if _model is None:
        return _fallback_similarity(word1, word2)
    
    try:
        # Get word vectors from fastText
        # fastText can handle out-of-vocabulary words by using subword information
        vec1 = _model.get_word_vector(word1)
        vec2 = _model.get_word_vector(word2)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(vec1, vec2)
        
        # Normalize to 0-1 range (word embeddings typically have similarity between 0 and 1)
        # Clamp to ensure it's in [0, 1] range
        normalized_similarity = max(0.0, min(1.0, (similarity + 1) / 2))
        
        return normalized_similarity
        
    except Exception as e:
        # If there's an error, fall back to simple similarity
        print(f"Error computing fastText similarity: {e}")
        return _fallback_similarity(word1, word2)


def _fallback_similarity(word1: str, word2: str) -> float:
    """
    Fallback similarity computation using simple character overlap.
    Used when fastText model is not available.
    """
    if not word1 or not word2:
        return 0.0
    
    set1 = set(word1)
    set2 = set(word2)
    
    if not set1 or not set2:
        return 0.0
    
    intersection = len(set1 & set2)
    union = len(set1 | set2)
    
    # Jaccard similarity
    jaccard = intersection / union if union > 0 else 0.0
    
    return jaccard
