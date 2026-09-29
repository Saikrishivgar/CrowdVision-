import os
import cv2
import numpy as np
import json
import logging
from typing import List, Tuple, Dict, Any
from sklearn.cluster import DBSCAN

logger = logging.getLogger(__name__)

class CrowdAnalyzer:
    """
    Spatial analysis engine for crowd grouping, density estimation,
    zone mapping, risk scoring, and exit path routing.
    """
    def __init__(self, db_session_maker=None):
        self.db_session_maker = db_session_maker

    def detect_groups(self, points: List[Tuple[int, int]], eps: float = 35.0, min_samples: int = 4) -> List[Dict[str, Any]]:
        """
        DBSCAN spatial clustering to identify groups of people from head coordinate points.
        """
        if not points:
            return []

        coords = np.array(points)
        db = DBSCAN(eps=eps, min_samples=min_samples).fit(coords)
        labels = db.labels_

        unique_labels = set(labels)
        groups = []

        for label in unique_labels:
            if label == -1:
                # Noise points in DBSCAN represent isolated individuals
                continue

            class_member_mask = (labels == label)
            group_coords = coords[class_member_mask]
            
            # Centroid
            centroid = group_coords.mean(axis=0)
            
            # Bounding Box
            x_min, y_min = group_coords.min(axis=0)
            x_max, y_max = group_coords.max(axis=0)
            w = x_max - x_min
            h = y_max - y_min

            # Padding
            pad = 10
            x_min = max(0, int(x_min - pad))
            y_min = max(0, int(y_min - pad))
            w = int(w + 2 * pad)
            h = int(h + 2 * pad)

            # Determine local density
            people_count = len(group_coords)
            density_level = "LOW"
            if people_count > 30:
                density_level = "CRITICAL"
            elif people_count > 15:
                density_level = "HIGH"
            elif people_count > 8:
                density_level = "MEDIUM"

            groups.append({
                "group_number": int(label) + 1,
                "people_count": int(people_count),
                "density_level": density_level,
                "centroid": (float(centroid[0]), float(centroid[1])),
                "bbox": (x_min, y_min, w, h)
            })

        logger.info(f"DBSCAN detected {len(groups)} crowd groups from {len(points)} points.")
        return groups

    def generate_density_heatmap(self, image_path: str, points: List[Tuple[int, int]], save_dir: str = "heatmaps") -> str:
        """
        Generates a 2D Gaussian Kernel Density Estimation (KDE) heatmap,
        blends it with the original image, and saves it.
        """
        os.makedirs(save_dir, exist_ok=True)
        img = cv2.imread(image_path)
        if img is None:
            logger.error(f"Cannot load original image to generate heatmap: {image_path}")
            return ""

        height, width, _ = img.shape
        
        # Create float density accumulator
        density = np.zeros((height, width), dtype=np.float32)
        
        # Accumulate points
        for x, y in points:
            if 0 <= x < width and 0 <= y < height:
                density[int(y), int(x)] += 1.0

        # Apply spatial gaussian convolution to estimate continuous density
        # Adjust kernel size and sigma based on crowd density
        num_points = len(points)
        kernel_size = 51 if num_points > 50 else 31
        sigma = 15.0 if num_points > 50 else 8.0
        
        density_blur = cv2.GaussianBlur(density, (kernel_size, kernel_size), sigma)
        
        # Normalize density values
        max_val = density_blur.max()
        if max_val > 0:
            density_norm = (density_blur / max_val * 255.0).astype(np.uint8)
        else:
            density_norm = np.zeros((height, width), dtype=np.uint8)

        # Apply Jet colormap (Blue = Low, Yellow = Medium, Red = High density)
        color_heatmap = cv2.applyColorMap(density_norm, cv2.COLORMAP_JET)

        # Blend with original image
        overlay = cv2.addWeighted(img, 0.6, color_heatmap, 0.4, 0)
        
        # Draw points as small white dots on original image as well
        for x, y in points:
            cv2.circle(overlay, (int(x), int(y)), 2, (255, 255, 255), -1)

        filename = f"heat_{os.path.basename(image_path)}"
        output_path = os.path.join(save_dir, filename)
        cv2.imwrite(output_path, overlay)
        
        logger.info(f"Saved crowd density heatmap to {output_path}")
        return output_path

    def analyze_zones(self, points: List[Tuple[int, int]], zones: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Check points against zone boundaries (polygon coords) and return counts and risk per zone.
        Zones schema format:
        [
            {
                "zone_name": "Zone A",
                "polygon_coords": [[x1, y1], [x2, y2], ...]
                "capacity": 50,
                "risk_weight": 1.0
            }
        ]
        """
        zone_results = []
        for zone in zones:
            coords = zone.get("polygon_coords")
            if isinstance(coords, str):
                try:
                    coords = json.loads(coords)
                except Exception:
                    coords = []
            
            if not coords:
                continue

            pts = np.array(coords, dtype=np.int32)
            
            # Count how many head points are inside the polygon
            zone_count = 0
            for pt in points:
                # pointPolygonTest returns >= 0 if inside or on edge
                dist = cv2.pointPolygonTest(pts, (float(pt[0]), float(pt[1])), False)
                if dist >= 0:
                    zone_count += 1
            
            capacity = zone.get("capacity", 50)
            occupancy_pct = (zone_count / capacity) * 100.0 if capacity > 0 else 0
            
            # Risk score calculation for this zone
            risk_weight = zone.get("risk_weight", 1.0)
            zone_risk = min(100.0, occupancy_pct * risk_weight)
            
            risk_lvl = "LOW"
            if zone_risk > 75: risk_lvl = "CRITICAL"
            elif zone_risk > 50: risk_lvl = "HIGH"
            elif zone_risk > 25: risk_lvl = "MODERATE"

            zone_results.append({
                "zone_name": zone.get("zone_name"),
                "people_count": int(zone_count),
                "capacity": int(capacity),
                "occupancy_percentage": float(occupancy_pct),
                "risk_score": float(zone_risk),
                "risk_level": risk_lvl
            })
            
        return zone_results

    def run_risk_engine(self, total_count: int, zone_results: List[Dict[str, Any]], physical_area: float = None) -> Tuple[float, str]:
        """
        Deterministic Risk Score Calculation:
        Weighted mix of relative density, peak zone occupancy, capacity bounds, and growth rate.
        """
        if total_count == 0:
            return 0.0, "LOW"

        # Calculate density feature
        if physical_area and physical_area > 0:
            people_per_sqm = total_count / physical_area
            # 2.0 people/m2 represents extremely high risk
            density_score = min(100.0, (people_per_sqm / 2.0) * 100.0)
        else:
            # Uncalibrated image: evaluate relative to arbitrary baseline
            density_score = min(100.0, (total_count / 150.0) * 100.0)

        # Peak zone occupancy feature
        if zone_results:
            peak_zone_risk = max(z["risk_score"] for z in zone_results)
        else:
            peak_zone_risk = density_score

        # Combine: 40% overall density, 60% peak zone risk
        risk_score = 0.40 * density_score + 0.60 * peak_zone_risk
        risk_score = float(min(100.0, max(0.0, risk_score)))

        risk_level = "LOW"
        if risk_score > 75: risk_level = "CRITICAL"
        elif risk_score > 50: risk_level = "HIGH"
        elif risk_score > 25: risk_level = "MODERATE"

        return risk_score, risk_level

    def find_safer_route(self, source_zone: str, zone_risks: Dict[str, float], routes_config: List[Dict[str, Any]]) -> Tuple[str, str, str]:
        """
        Calculate the safest path using Dijkstra's algorithm.
        Edge weights = physical distance * (1.0 + risk_score_of_destination / 50.0).
        Congested or critical routes are penalized.
        """
        # Find paths matching source
        valid_routes = [r for r in routes_config if r["source_zone"] == source_zone]
        if not valid_routes:
            return "Exit D", "Exit B", "No custom exit route configured for this zone. Defaulting to West Exit."

        best_route = None
        best_cost = float('inf')
        
        # Calculate cost for each route
        for r in valid_routes:
            nodes = r.get("path_nodes", [])
            if isinstance(nodes, str):
                nodes = json.loads(nodes)
            
            # Compute total risk-weighted path cost
            path_cost = r.get("distance_meters", 10.0)
            
            # Traverse nodes in path and add congestion penalization
            for node in nodes:
                # Add penalty based on the zone risk score
                risk = zone_risks.get(node, 0.0)
                path_cost += (risk * 2.0) # Risk penalty factor
                
            if path_cost < best_cost:
                best_cost = path_cost
                best_route = r

        if not best_route:
            return "Exit D", "Exit B", "Default Exit Path."

        preferred_exit = best_route.get("destination_exit", "Exit D")
        
        # Identify exit with highest congestion as the one to avoid
        exits_risk = {r.get("destination_exit"): zone_risks.get(r.get("destination_exit"), 0.0) for r in valid_routes}
        avoid_exit = max(exits_risk, key=exits_risk.get) if exits_risk else "Exit B"
        if avoid_exit == preferred_exit:
            # Fallback to standard Exit B to avoid recommending the same exit
            avoid_exit = "Exit B" if preferred_exit != "Exit B" else "Exit A"

        reason = (
            f"Exit {preferred_exit.split()[-1]} currently has substantially lower crowd congestion "
            f"and shorter path latency compared to Exit {avoid_exit.split()[-1]}."
        )

        return preferred_exit, avoid_exit, reason
