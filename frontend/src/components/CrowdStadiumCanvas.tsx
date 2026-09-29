"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

interface CrowdStadiumCanvasProps {
  mode?: "landing" | "login";
  interactive?: boolean;
  intensity?: number;
}

export default function CrowdStadiumCanvas({
  mode = "landing",
  interactive = true,
  intensity = 1.0,
}: CrowdStadiumCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040814, 0.015);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    
    // Position camera based on mode
    if (mode === "login") {
      camera.position.set(0, 36, 70);
      camera.lookAt(0, -3, 0);
    } else {
      camera.position.set(0, 28, 56);
      camera.lookAt(0, 2, -10);
    }

    const renderer = new THREE.WebGLRenderer({
      powerPreference: "high-performance",
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x040814, 1);
    container.appendChild(renderer.domElement);

    // Create glowing circle texture for particles
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.25, "rgba(240, 250, 255, 0.95)");
      gradient.addColorStop(0.55, "rgba(125, 211, 252, 0.5)");
      gradient.addColorStop(1, "rgba(4, 8, 20, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    // 1. STADIUM PITCH / FIELD WIREFRAME
    const fieldGroup = new THREE.Group();

    // Field outer boundary
    const pitchWidth = 56;
    const pitchLength = 36;
    const fieldGeo = new THREE.PlaneGeometry(pitchWidth, pitchLength, 24, 16);
    const fieldWireMat = new THREE.MeshBasicMaterial({
      color: 0x1d4ed8,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
    });
    const fieldMesh = new THREE.Mesh(fieldGeo, fieldWireMat);
    fieldMesh.rotation.x = -Math.PI / 2;
    fieldMesh.position.y = -6;
    fieldGroup.add(fieldMesh);

    // Field inner markings lines
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.65,
    });

    const createRectLoop = (w: number, h: number, y: number) => {
      const pts = [
        new THREE.Vector3(-w / 2, y, -h / 2),
        new THREE.Vector3(w / 2, y, -h / 2),
        new THREE.Vector3(w / 2, y, h / 2),
        new THREE.Vector3(-w / 2, y, h / 2),
        new THREE.Vector3(-w / 2, y, -h / 2),
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      return new THREE.Line(geo, lineMat);
    };

    fieldGroup.add(createRectLoop(pitchWidth, pitchLength, -5.95));
    // Center line
    const centerPts = [
      new THREE.Vector3(0, -5.95, -pitchLength / 2),
      new THREE.Vector3(0, -5.95, pitchLength / 2),
    ];
    fieldGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(centerPts), lineMat));

    // Center circle
    const circlePts: THREE.Vector3[] = [];
    const radius = 6.5;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      circlePts.push(new THREE.Vector3(Math.cos(theta) * radius, -5.95, Math.sin(theta) * radius));
    }
    fieldGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePts), lineMat));

    scene.add(fieldGroup);

    // 2. STADIUM TIERED STANDS WIREFRAME (Curved amphitheater stadium)
    const stadiumWireGroup = new THREE.Group();
    const ringCount = 34;
    const stadiumMeshMat = new THREE.LineBasicMaterial({
      color: 0x2b569a,
      transparent: true,
      opacity: 0.48,
    });

    for (let r = 0; r < ringCount; r++) {
      const t = r / ringCount;
      const rx = 34 + t * 56; // stadium semi-major axis
      const rz = 24 + t * 44; // stadium semi-minor axis
      // Undulating amphitheater bowl curve with organic rim hills
      const rimUndulation = Math.sin(r * 0.4) * 0.8;
      const y = -5.5 + Math.pow(t, 1.35) * 26 + rimUndulation;

      const ringPts: THREE.Vector3[] = [];
      const segments = 140;
      for (let s = 0; s <= segments; s++) {
        const angle = (s / segments) * Math.PI * 2;
        // subtle topological undulation matching the screenshot
        const topoWave = Math.sin(angle * 3) * Math.cos(angle * 2) * (t * 4.5);
        const px = Math.cos(angle) * rx;
        const pz = Math.sin(angle) * rz;
        ringPts.push(new THREE.Vector3(px, y + topoWave, pz));
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      const ringLine = new THREE.Line(ringGeo, stadiumMeshMat);
      stadiumWireGroup.add(ringLine);
    }

    // Radial rib lines (aisles and vomitories)
    const ribsCount = 64;
    for (let i = 0; i < ribsCount; i++) {
      const angle = (i / ribsCount) * Math.PI * 2;
      const ribPts: THREE.Vector3[] = [];
      for (let r = 0; r <= ringCount; r += 2) {
        const t = r / ringCount;
        const rx = 34 + t * 56;
        const rz = 24 + t * 44;
        const topoWave = Math.sin(angle * 3) * Math.cos(angle * 2) * (t * 4.5);
        const y = -5.5 + Math.pow(t, 1.35) * 26 + topoWave;
        ribPts.push(new THREE.Vector3(Math.cos(angle) * rx, y, Math.sin(angle) * rz));
      }
      const ribGeo = new THREE.BufferGeometry().setFromPoints(ribPts);
      stadiumWireGroup.add(new THREE.Line(ribGeo, stadiumMeshMat));
    }

    // Stadium outer canopy / rim flow lines
    const canopyMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.38,
    });
    for (let c = 0; c < 4; c++) {
      const rx = 90 + c * 4;
      const rz = 68 + c * 4;
      const y = 20 + c * 2.8;
      const canopyPts: THREE.Vector3[] = [];
      for (let s = 0; s <= 140; s++) {
        const angle = (s / 140) * Math.PI * 2;
        const topoWave = Math.sin(angle * 4) * 3;
        canopyPts.push(new THREE.Vector3(Math.cos(angle) * rx, y + topoWave, Math.sin(angle) * rz));
      }
      stadiumWireGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(canopyPts), canopyMat));
    }

    scene.add(stadiumWireGroup);

    // 3. THOUSANDS OF CROWD PARTICLES ("whites moving etc like that in it")
    const particleCount = mode === "login" ? 6500 : 8500;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const initialData: {
      tierT: number;
      angle: number;
      speed: number;
      driftPhase: number;
      noiseScale: number;
      baseY: number;
      rx: number;
      rz: number;
      isFlowing: boolean;
      aisleAngle?: number;
    }[] = [];

    const whiteColor = new THREE.Color(0xffffff);
    const brightWhiteGlow = new THREE.Color(0xf0f9ff);
    const brightCyan = new THREE.Color(0x7dd3fc);
    const royalBlue = new THREE.Color(0x38bdf8);
    const purpleAccent = new THREE.Color(0x818cf8);

    for (let i = 0; i < particleCount; i++) {
      // 82% in stands, 18% flowing through aisles & rings
      const isFlowing = Math.random() < 0.22;
      const tierT = Math.pow(Math.random(), 0.85); // distributed across bowl
      const angle = Math.random() * Math.PI * 2;
      const rx = 34 + tierT * 55 + (Math.random() - 0.5) * 2;
      const rz = 24 + tierT * 43 + (Math.random() - 0.5) * 2;
      const topoWave = Math.sin(angle * 3) * Math.cos(angle * 2) * (tierT * 4.5);
      const baseY = -5.2 + Math.pow(tierT, 1.35) * 25.5 + topoWave + Math.random() * 0.4;

      const px = Math.cos(angle) * rx;
      const py = baseY;
      const pz = Math.sin(angle) * rz;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;

      // Color scheme: mostly luminous white ("whites moving etc"), with light cyan and neon highlights
      const randColor = Math.random();
      let c: THREE.Color;
      if (randColor > 0.3) {
        c = whiteColor;
      } else if (randColor > 0.15) {
        c = brightWhiteGlow;
      } else if (randColor > 0.05) {
        c = brightCyan;
      } else if (randColor > 0.02) {
        c = royalBlue;
      } else {
        c = purpleAccent;
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      initialData.push({
        tierT,
        angle,
        speed: (0.18 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1),
        driftPhase: Math.random() * Math.PI * 2,
        noiseScale: 0.4 + Math.random() * 0.6,
        baseY,
        rx,
        rz,
        isFlowing,
        aisleAngle: Math.floor(Math.random() * ribsCount) * (Math.PI * 2 / ribsCount),
      });
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 1.85 * intensity,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    // 4. AMBIENT GLOW / HORIZON ILLUMINATION
    const ambientLight = new THREE.AmbientLight(0x0f274a, 1.2);
    scene.add(ambientLight);

    const stadiumSpot = new THREE.SpotLight(0x38bdf8, 3, 160, Math.PI / 3, 0.4);
    stadiumSpot.position.set(0, 70, 0);
    stadiumSpot.target.position.set(0, 0, 0);
    scene.add(stadiumSpot);
    scene.add(stadiumSpot.target);

    // Interactive mouse / parallax motion
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = camera.position.x;
    let targetCameraY = camera.position.y;
    let targetCameraZ = camera.position.z;

    const handleMouseMove = (e: MouseEvent) => {
      if (!interactive) return;
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = -(e.clientY / window.innerHeight) * 2 + 1;
      mouseX = normX;
      mouseY = normY;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Handle Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", handleResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    // Login entrance animation progression
    let entranceProgress = mode === "login" ? 0 : 1;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const delta = clock.getDelta();

      // Login camera swoop in
      if (mode === "login" && entranceProgress < 1) {
        entranceProgress += 0.012;
        const ease = 1 - Math.pow(1 - Math.min(entranceProgress, 1), 3);
        camera.position.y = 55 - ease * 25;
        camera.position.z = 95 - ease * 35;
        camera.lookAt(0, -3, 0);
      }

      // Parallax smooth interpolation
      if (mode === "landing") {
        const baseCamX = 0;
        const baseCamY = 28;
        const baseCamZ = 56;
        targetCameraX = baseCamX + mouseX * 12;
        targetCameraY = baseCamY + mouseY * 6;
        targetCameraZ = baseCamZ - mouseY * 4;

        camera.position.x += (targetCameraX - camera.position.x) * 0.035;
        camera.position.y += (targetCameraY - camera.position.y) * 0.035;
        camera.position.z += (targetCameraZ - camera.position.z) * 0.035;
        camera.lookAt(0, -2 + mouseY * 2, -6);
      } else if (entranceProgress >= 1) {
        // Slow cinematic drift for login
        const baseCamX = 0;
        const baseCamY = 30;
        const baseCamZ = 60;
        targetCameraX = baseCamX + mouseX * 8 + Math.sin(elapsedTime * 0.2) * 4;
        targetCameraY = baseCamY + mouseY * 4 + Math.cos(elapsedTime * 0.25) * 2;
        camera.position.x += (targetCameraX - camera.position.x) * 0.03;
        camera.position.y += (targetCameraY - camera.position.y) * 0.03;
        camera.lookAt(0, -4, 0);
      }

      // Update Crowd Particles ("whites moving etc like that in it")
      const posAttr = particleGeometry.getAttribute("position") as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const data = initialData[i];

        if (data.isFlowing) {
          // Flowing along aisle / ring concourse
          data.angle += 0.0018 * data.speed;
          const px = Math.cos(data.angle) * data.rx;
          const pz = Math.sin(data.angle) * data.rz;
          // small vertical wave
          const py = data.baseY + Math.sin(elapsedTime * 2 + data.driftPhase) * 0.35;
          posArray[i * 3] = px;
          posArray[i * 3 + 1] = py;
          posArray[i * 3 + 2] = pz;
        } else {
          // Subtle crowd movement: breathing, shifting, cheering wave
          const wave = Math.sin(elapsedTime * 1.8 + data.angle * 4 + data.tierT * 6) * 0.28;
          const jitterX = Math.sin(elapsedTime * 2.5 + data.driftPhase) * 0.18;
          const jitterZ = Math.cos(elapsedTime * 2.5 + data.driftPhase) * 0.18;

          const px = Math.cos(data.angle) * data.rx + jitterX;
          const pz = Math.sin(data.angle) * data.rz + jitterZ;
          const py = data.baseY + wave;

          posArray[i * 3] = px;
          posArray[i * 3 + 1] = py;
          posArray[i * 3 + 2] = pz;
        }
      }
      posAttr.needsUpdate = true;

      // Gentle pitch stadium rotation
      stadiumWireGroup.rotation.y = Math.sin(elapsedTime * 0.05) * 0.04;
      fieldGroup.rotation.y = Math.sin(elapsedTime * 0.05) * 0.04;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }

      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, [mode, interactive, intensity]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
