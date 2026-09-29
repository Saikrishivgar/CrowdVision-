import os
import cv2
import numpy as np
import logging
import json
import random
from typing import List, Tuple, Dict, Any

logger = logging.getLogger(__name__)

class PETCounter:
    """
    Point Query Transformer (PET) model wrapper for dense crowd counting and localization.
    Outputs point locations (x, y) for detected people/heads.
    """
    def __init__(self, model_path: str = "yolo11x.pt"):
        self.model_path = model_path
        self.device = self._get_device()
        self.model = None
        self._load_model()

    def _get_device(self) -> str:
        try:
            import torch
            if torch.cuda.is_available(): return "cuda"
            if torch.backends.mps.is_available(): return "mps"
        except ImportError:
            pass
        return "cpu"

    def _load_model(self):
        # In a production environment, you would load the custom PET checkpoint here.
        # e.g., self.model = torch.load(self.model_path, map_location=self.device)
        if os.path.exists(self.model_path):
            try:
                from ultralytics import YOLO
                self.model = YOLO(self.model_path)
                logger.info(f"Loaded YOLO person detector from {self.model_path}")
            except Exception as e:
                logger.error(f"Error loading person detector: {e}")
                self.model = None
        else:
            logger.warning("Person detector weights not found; returning zero detections.")
            self.model = None

    def localize(self, image_path: str) -> Tuple[List[Tuple[int, int]], float]:
        """
        Localize head points (x, y) from the input image.
        Returns:
            points: List of (x, y) coordinates of detected heads
            confidence: Analysis confidence score (0.0 to 1.0)
        """
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            logger.error(f"Failed to load image: {image_path}")
            return [], 0.0

        height, width, _ = img.shape
        
        if self.model is not None:
            try:
                results = self.model.predict(source=img, conf=0.15, imgsz=1280, classes=[0], verbose=False)
                points, confidences = [], []
                for result in results:
                    if result.boxes is None:
                        continue
                    for box, conf in zip(result.boxes.xyxy.cpu().numpy(), result.boxes.conf.cpu().numpy()):
                        x1, y1, x2, y2 = box
                        points.append((int((x1 + x2) / 2), int((y1 + y2) / 2)))
                        confidences.append(float(conf))
                confidence = float(sum(confidences) / len(confidences)) if confidences else 0.0
                logger.info(f"YOLO localized {len(points)} people. Confidence: {confidence:.2f}")
                return points, confidence
            except Exception as e:
                logger.error(f"Person detector inference failed: {e}")
                return [], 0.0

        logger.info("No person detector available; returning zero detections.")
        return [], 0.0
