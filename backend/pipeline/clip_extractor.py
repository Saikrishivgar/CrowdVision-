import logging
import subprocess
import os
from typing import Optional

logger = logging.getLogger(__name__)

class ClipExtractor:
    def __init__(self):
        pass

    def extract_clip(self, video_path: str, start_time: float, end_time: float, output_path: str) -> Optional[str]:
        logger.info(f"Extracting clip from {video_path} ({start_time}s to {end_time}s)")
        
        if not os.path.exists(video_path):
            logger.error(f"Video not found: {video_path}")
            return None
            
        duration = end_time - start_time
        if duration <= 0:
            duration = 10.0 # Default
            
        try:
            cmd = [
                "ffmpeg", "-y",
                "-ss", str(start_time),
                "-i", video_path,
                "-t", str(duration),
                "-c", "copy",
                output_path
            ]
            # In a real app we might transcode or add boxes here
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
            return output_path
        except Exception as e:
            logger.error(f"FFmpeg error: {e}")
            return None

if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    print("ClipExtractor module ready.")
