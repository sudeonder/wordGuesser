"""
build a word corpus from wordfreq for the word guessing game

this script:
1. takes top ~10000 words by frequency from wordfreq
2. filters by regex, length, stopwords, lowercase
3. validates fastText embedding compatibility
4. outputs ~4000-6000 words to words.txt
"""

import re
import os
import wordfreq
import fasttext
import numpy as np
from typing import List, Set

# Configuration

TOP_N_WORDS = 10000
MIN_WORD_LENGTH = 3
MIN_VECTOR_NORM = 0.01 # why do we need this?
OUTPUT_FILE = "words.txt"
MODEL_PATH = "cc.en.300.bin" 

# common stopwords
STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what',
    'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
    'than', 'too', 'very', 'just', 'now', 'then', 'here', 'there'
}

def load_fasttext_model(model_path: str):
    """ Load the fastText model from the given path. """
    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"FastText model not found at: {model_path}\n"
            f"Please download the model first."
        )
    
    print(f"Loading fastText model from {model_path}...")
    model = fasttext.load_model(model_path)
    print("Model loaded successfully!")
    return model

def get_top_words_by_frequency(n: int = TOP_N_WORDS) -> List[str]:
    """
    Get top N words by frequency from wordfreq
    Returns a list of (word, frequency) tuples sorted by frequency.
    """

    print(f"Fetching top {n} words by frequency from wordfreq...")

    # get word frequencies for English
    # wordfreq.top_n_list('en', n) returns top N words

    top_words = wordfreq.top_n_list('en', n)

    print(f"Retrieved {len(top_words)} words from wordfreq.")
    return top_words

def filter_words(words: List[str]) -> List[str]:
    """
    Filter words based on criteria:
    - [a-z]+ only (lowercase letters only)
    - length >= MIN_WORD_LENGTH
    - not in stopwords
    - already lowercase
    """

    print(f"Filtering words ...")
    
    # regex pattern for lowercase letters only
    pattern = re.compile(r'^[a-z]+$')
    
    filtered = []
    for word in words:
        word_lower = word.lower().strip()

        # check regex pattern
        if not pattern.match(word_lower):
            continue
        
        # check min length
        if len(word_lower) < MIN_WORD_LENGTH:
            continue
        
        # check stopwords
        if word_lower in STOPWORDS:
            continue
        
        filtered.append(word_lower)

    print(f"After filtering: {len(filtered)} words.")
    return filtered

def validate_embedding_compatibility(words: List[str], model: fasttext.FastText._FastText) -> List[str]:
    """
    Validate embedding compatibility of words using the fastText model.
    Returns a list of words that are compatible with the model.
    validate that words have:
    1. fastText vectors
    2. vector norm >= MIN_VECTOR_NORM
    3.(OPTIONAL) nearest neighbors are meaningful
    """

    print(f"Validating embedding compatibility of {len(words)} words...")
    
    valid_words = []
    skipped_no_vector = 0
    skipped_low_norm = 0

    for word in words:
        try:
            # get word vector
            vector = model.get_word_vector(word)

            # check if vector is valid
            vector_norm = np.linalg.norm(vector)

            if vector_norm < MIN_VECTOR_NORM:
                skipped_low_norm += 1
                continue
            
            # TODO: check nearest neighbors are meaningful
            valid_words.append(word)
        
        except Exception as e:
            skipped_no_vector += 1
            continue

    print(f"Valid words: {len(valid_words)}")    
    print(f"Skipped words with no vector: {skipped_no_vector}")    
    print(f"Skipped words with low norm: {skipped_low_norm}")    
    return valid_words


def save_words_to_file(words: List[str], output_file: str):
    """
    Save words to a file.
    """

    print(f"Saving {len(words)} words to {output_file}...")
    with open(output_file, "w") as f:
        for word in words:
            f.write(word + "\n")

    print(f"Words saved to {output_file}.")
            
def main():
    """
    Main function to build the word corpus.
    """

    print("=" * 60)
    print("Building word corpus...")
    print("=" * 60)

    # Step 1: get top words by frequency
    top_words = get_top_words_by_frequency(TOP_N_WORDS)

    # Step 2: filter words
    filtered_words = filter_words(top_words)

    # Step 3: load fastText model
    model = load_fasttext_model(MODEL_PATH)

    # Step 4: validate embedding compatibility
    valid_words = validate_embedding_compatibility(filtered_words, model)

    # Step 5: Save to file
    if len(valid_words) < 1000:
        print(f"WARNING: Only {len(valid_words)} words passed validation.")
        print("Consider adjusting MIN_VECTOR_NORM or increasing TOP_N_WORDS")
    else:
        print(f"SUCCESS: {len(valid_words)} words validated!")
    
    save_words_to_file(valid_words, OUTPUT_FILE)
    
    print("=" * 60)
    print("Corpus building complete!")
    print(f"Final word count: {len(set(valid_words))}")
    print("=" * 60)


if __name__ == "__main__":
    main()



