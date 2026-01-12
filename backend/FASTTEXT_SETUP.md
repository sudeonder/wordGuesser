# FastText Setup Guide

## Overview

FastText is a word embedding library developed by Facebook AI Research that learns word representations using subword information. This allows it to:
- Handle out-of-vocabulary words (words not in training data)
- Work with misspelled words
- Understand word morphology and relationships

## Installation

1. Install the Python package (already added to `requirements.txt`):
```bash
pip install fasttext numpy
```

Or install all requirements:
```bash
pip install -r requirements.txt
```

## Downloading Pre-trained Models

FastText provides pre-trained word vectors for many languages. For English, you have several options:

### Option 1: English Common Crawl (Recommended)
- **File**: `cc.en.300.bin`
- **Size**: ~7GB (compressed: ~2GB)
- **Dimensions**: 300
- **Vocabulary**: Millions of words
- **Best for**: Production use, better coverage

**Download:**
```bash
cd backend
wget https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.en.300.bin.gz
gunzip cc.en.300.bin.gz
```

### Option 2: English Wikipedia (Smaller)
- **File**: `wiki.en.bin`
- **Size**: ~4GB
- **Dimensions**: 300
- **Vocabulary**: Large but smaller than Common Crawl
- **Best for**: Development, testing

**Download:**
```bash
cd backend
wget https://dl.fbaipublicfiles.com/fasttext/vectors-wiki/wiki.en.bin
```

## How It Works in Our Game

1. **Model Loading**: The model loads automatically when you start the backend server
   - Looks for the model file at `backend/cc.en.300.bin` by default
   - You can override this with the `FASTTEXT_MODEL_PATH` environment variable

2. **Word Vector Extraction**: 
   - When you call `model.get_word_vector('word')`, fastText returns a 300-dimensional vector
   - Even if the word wasn't in the training data, fastText uses subword information to create a vector

3. **Similarity Calculation**:
   - We compute cosine similarity between two word vectors
   - Formula: `cos(θ) = (A · B) / (||A|| × ||B||)`
   - Result ranges from -1 to 1 (typically 0 to 1 for word vectors)
   - We normalize to 0-1 range for our game scoring

## Example Usage

```python
import fasttext
import numpy as np

# Load model (done once at startup)
model = fasttext.load_model('cc.en.300.bin')

# Get vectors
apple_vec = model.get_word_vector('apple')
banana_vec = model.get_word_vector('banana')
fruit_vec = model.get_word_vector('fruit')

# Calculate similarities
def cosine_similarity(vec1, vec2):
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

print(cosine_similarity(apple_vec, banana_vec))  # ~0.6-0.7 (both fruits)
print(cosine_similarity(apple_vec, fruit_vec))   # ~0.7-0.8 (apple is a fruit)
print(cosine_similarity(apple_vec, car_vec))     # ~0.2-0.3 (not related)
```

## Configuration

### Environment Variable

You can specify a custom model path:
```bash
export FASTTEXT_MODEL_PATH=/path/to/your/model.bin
uvicorn app.main:app --reload --port 8000
```

Or on Windows:
```cmd
set FASTTEXT_MODEL_PATH=C:\path\to\your\model.bin
uvicorn app.main:app --reload --port 8000
```

## Fallback Behavior

If the fastText model is not found:
- The application will start successfully
- It will use a simple character-based Jaccard similarity as fallback
- You'll see a warning message in the console

## Performance Notes

- **First Load**: Loading the model takes time (10-30 seconds depending on hardware)
- **Memory**: The model uses ~2-4GB RAM when loaded
- **Speed**: Once loaded, similarity calculations are very fast (~milliseconds)

## Troubleshooting

### Model file not found
- Make sure you've downloaded the model file
- Check the file path in the error message
- Verify the file has `.bin` extension (not `.bin.gz`)

### Out of memory errors
- Try using the smaller Wikipedia model instead
- Or reduce the number of words in your `words.txt` file

### Slow performance
- Make sure the model is loaded once at startup (not per request)
- The current implementation loads the model globally and reuses it

## Resources

- FastText Official Site: https://fasttext.cc/
- Pre-trained Models: https://fasttext.cc/docs/en/crawl-vectors.html
- Python Package Documentation: https://pypi.org/project/fasttext/
