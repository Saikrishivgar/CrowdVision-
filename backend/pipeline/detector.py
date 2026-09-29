import logging
import numpy as np
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class ObjectDetector:
    def __init__(self, settings: dict):
        self.confidence_threshold = settings.get("confidence_threshold", 0.5)
        self.device = self._get_device()
        self._load_model()
        self.target_classes = ["person", "car", "truck", "bus", "motorcycle", "bicycle", "backpack", "handbag", "suitcase", "knife"]

    def _get_device(self) -> str:
        try:
            import torch
            if torch.cuda.is_available(): return "cuda"
            if torch.backends.mps.is_available(): return "mps"
        except ImportError:
            pass
        return "cpu"

    def _load_model(self):
        try:
            from ultralytics import YOLO
            # Try to load YOLO11 (the recommended production tracking model)
            try:
                self.model = YOLO('yolo11n.pt')
                logger.info(f"Loaded YOLO11 on {self.device}")
            except Exception:
                self.model = YOLO('yolov8n.pt')
                logger.info(f"Loaded YOLOv8 fallback on {self.device}")
            
            if self.model:
                self.model.to(self.device)
        except ImportError:
            logger.error("ultralytics not installed. Install with: pip install ultralytics")
            self.model = None
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None


    def detect(self, image: np.ndarray) -> List[Dict[str, Any]]:
        if self.model is None:
            return []
        results = self.model(image, conf=self.confidence_threshold, verbose=False)[0]
        detections = []
        for box in results.boxes:
            cls_id = int(box.cls[0].item())
            class_name = results.names[cls_id]
            if class_name in self.target_classes:
                # YOLO returns xyxy by default, xywh is available
                detections.append({
                    "class_name": class_name,
                    "confidence": box.conf[0].item(),
                    "bbox": box.xywh[0].cpu().numpy().tolist() # x, y, w, h
                })
        return detections

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    print("ObjectDetector module ready.")
