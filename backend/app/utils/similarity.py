import numpy as np


def cosine_similarity(embedding_a: np.ndarray, embedding_b: np.ndarray) -> float:
    """Compute cosine similarity between two embedding vectors.

    Returns a float between -1.0 and 1.0 (1.0 = identical).
    """
    dot_product = np.dot(embedding_a, embedding_b)
    norm_a = np.linalg.norm(embedding_a)
    norm_b = np.linalg.norm(embedding_b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return float(dot_product / (norm_a * norm_b))


def embedding_to_bytes(embedding: list[float] | np.ndarray) -> bytes:
    """Convert an embedding list/array to bytes for database storage."""
    return np.array(embedding, dtype=np.float32).tobytes()


def bytes_to_embedding(data: bytes) -> np.ndarray:
    """Reconstruct an embedding numpy array from bytes."""
    return np.frombuffer(data, dtype=np.float32)
