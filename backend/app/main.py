from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import router
from app.embedding import load_embedding_model
import os

app = FastAPI(title="Word Guessing Game API", version="0.1.0")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """
    Load the fastText embedding model on application startup.
    The model path can be specified via the FASTTEXT_MODEL_PATH environment variable.
    If not set, it defaults to 'cc.en.300.bin' in the backend directory.
    """
    # Get model path from environment variable or use default
    model_path = os.getenv(
        "FASTTEXT_MODEL_PATH",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "cc.en.300.bin")
    )
    
    # Try to load the model (will use fallback if not found)
    try:
        load_embedding_model(model_path)
    except FileNotFoundError as e:
        print(f"Warning: {e}")
        print("The application will continue with fallback similarity computation.")
        print("To use fastText embeddings, please download a pre-trained model.")
