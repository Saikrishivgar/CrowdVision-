import logging
from typing import Optional, Callable
from .frame_extractor import FrameExtractor
from .detector import ObjectDetector
from .tracker import MultiObjectTracker
from .cropper import PersonCropper
from .embedder import CLIPEmbedder
from .vector_store import VectorStore
from .incident_detector import IncidentDetector

logger = logging.getLogger(__name__)

class VideoPipeline:
    def __init__(self, settings: dict):
        self.settings = settings
        self.frame_extractor = FrameExtractor(settings)
        self.detector = ObjectDetector(settings)
        self.tracker = MultiObjectTracker()
        self.cropper = PersonCropper(settings)
        self.embedder = CLIPEmbedder(settings)
        self.vector_store = VectorStore(settings)
        self.incident_detector = IncidentDetector()

    async def process_video(self, video_path: str, video_id: str, camera_id: str, progress_callback: Optional[Callable] = None):
        logger.info(f"Starting pipeline for video: {video_id} (camera: {camera_id})")
        # Stage 1: Extract frames
        if progress_callback: progress_callback(0.1, "Extracting frames")
        frames = self.frame_extractor.extract(video_path)
        
        # Stage 2: Detect objects
        if progress_callback: progress_callback(0.3, "Detecting objects")
        detections = []
        for f in frames:
            detections.append(self.detector.detect(f['image']))
        
        # Stage 3: Track objects
        if progress_callback: progress_callback(0.5, "Tracking objects")
        tracks = self.tracker.track(detections)
        
        # Stage 4: Crop objects
        if progress_callback: progress_callback(0.6, "Cropping objects")
        crops = self.cropper.crop(frames, tracks)
        
        # Stage 5: Generate embeddings
        if progress_callback: progress_callback(0.7, "Generating embeddings")
        embeddings = self.embedder.embed(crops)
        
        # Stage 6: Index in FAISS
        if progress_callback: progress_callback(0.8, "Indexing in Vector Store")
        self.vector_store.add_embeddings(embeddings, video_id)
        
        # Stage 7: Check for incidents
        if progress_callback: progress_callback(0.9, "Detecting incidents")
        incidents = self.incident_detector.detect(tracks)
        
        if progress_callback: progress_callback(1.0, "Processing complete")
        return {"video_id": video_id, "incidents": incidents}
