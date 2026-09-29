import logging
import numpy as np
from typing import List, Dict, Any, Tuple

logger = logging.getLogger(__name__)

class VectorStore:
    def __init__(self, settings: dict):
        self.dimension = settings.get("embedding_dim", 768)
        self._initialize_index()

    def _initialize_index(self):
        try:
            import faiss
            self.index = faiss.IndexFlatIP(self.dimension)
            self.metadata = []
            logger.info("Initialized FAISS IndexFlatIP")
        except ImportError:
            logger.error("faiss not installed. Install with: pip install faiss-cpu")
            self.index = None
            self.metadata = []

    def add_embeddings(self, embeddings: List[np.ndarray], metadata: List[Dict[str, Any]]):
        if self.index is None or not embeddings: return
        
        vectors = np.vstack(embeddings).astype('float32')
        # Normalize for cosine similarity
        import faiss
        faiss.normalize_L2(vectors)
        self.index.add(vectors)
        self.metadata.extend(metadata)
        logger.info(f"Added {len(embeddings)} vectors to index")

    def search(self, query_vector: np.ndarray, k: int = 20) -> List[Tuple[Any, float, Dict[str, Any]]]:
        if self.index is None or self.index.ntotal == 0: return []
        
        vector = query_vector.astype('float32').reshape(1, -1)
        import faiss
        faiss.normalize_L2(vector)
        distances, indices = self.index.search(vector, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1 and idx < len(self.metadata):
                results.append((idx, distances[0][i], self.metadata[idx]))
        return results

    def save_index(self, path: str):
        pass

    def load_index(self, path: str):
        pass

    def get_stats(self) -> dict:
        if self.index is None: return {"total": 0}
        return {"total": self.index.ntotal, "dimension": self.dimension}

    def remove_by_video_id(self, video_id: str):
        pass

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    print("VectorStore module ready.")
