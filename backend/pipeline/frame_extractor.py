import cv2
import os
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class FrameExtractor:
    def __init__(self, settings: dict):
        self.fps = settings.get("extraction_fps", 2)
        self.output_dir = settings.get("frame_output_dir", "/tmp/frames")
        os.makedirs(self.output_dir, exist_ok=True)

    def get_metadata(self, video_path: str) -> Dict[str, Any]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video {video_path}")
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
        width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
        height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
        duration = frame_count / fps if fps > 0 else 0
        cap.release()
        return {"fps": fps, "duration": duration, "width": width, "height": height, "frame_count": frame_count}

    def extract(self, video_path: str) -> List[Dict[str, Any]]:
        logger.info(f"Extracting frames from {video_path} at {self.fps} FPS")
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Could not open video {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(video_fps / self.fps) if video_fps > 0 else 1
        
        frames = []
        frame_idx = 0
        extracted_count = 0
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            if frame_idx % frame_interval == 0:
                timestamp = frame_idx / video_fps
                out_path = os.path.join(self.output_dir, f"frame_{extracted_count:05d}.jpg")
                cv2.imwrite(out_path, frame)
                frames.append({
                    "image": frame,
                    "image_path": out_path,
                    "timestamp": timestamp,
                    "frame_idx": frame_idx
                })
                extracted_count += 1
            frame_idx += 1
            
        cap.release()
        logger.info(f"Extracted {extracted_count} frames.")
        return frames

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    print("FrameExtractor module ready.")
