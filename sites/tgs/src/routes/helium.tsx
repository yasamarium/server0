import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { 
  Lock, 
  Unlock, 
  ArrowLeft, 
  Sun, 
  Moon, 
  RotateCcw, 
  Play, 
  Pause, 
  Sliders, 
  Layers, 
  Sparkles, 
  Zap, 
  Eye, 
  Maximize2, 
  Minimize2,
  Atom,
  Info,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  Activity,
  Gauge
} from "lucide-react";

export const Route = createFileRoute("/helium")({
  head: () => ({
    meta: [
      { title: "Helium • AS CLOUD" },
      { name: "description", content: "Interactive system module." }
    ]
  }),
  component: HeliumModulePage,
});

const AUTH_KEY = "SUHU";
const SESSION_STORAGE_KEY = "ascloud_helium_auth";

interface Particle3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  type: "proton" | "neutron" | "electron" | "photon" | "cloud";
  spin?: "up" | "down";
  vx?: number;
  vy?: number;
  vz?: number;
  life?: number;
  maxLife?: number;
}

interface OrbitPoint {
  x: number;
  y: number;
  z: number;
  alpha: number;
}

function HeliumModulePage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);

  // Simulation Controls State
  const [simulationMode, setSimulationMode] = useState<"bohr" | "quantum" | "nucleus">("bohr");
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [showTrails, setShowTrails] = useState(true);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showNucleusDetails, setShowNucleusDetails] = useState(true);
  const [showQuantumTelemetry, setShowQuantumTelemetry] = useState(true);
  const [fps, setFps] = useState(60);
  const [energyExcitation, setEnergyExcitation] = useState(1); // 1 = Ground 1s, 2 = Excited 2s/2p

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // 3D View Angles & Inertia
  const rotationRef = useRef({ x: 0.35, y: 0.65, z: 0 });
  const targetRotationRef = useRef({ x: 0.35, y: 0.65, z: 0 });
  const zoomRef = useRef(1);
  const targetZoomRef = useRef(1);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const autoRotateRef = useRef(true);

  // Photon excitation burst particles
  const burstParticlesRef = useRef<Particle3D[]>([]);
  // Electron trails
  const electron1TrailRef = useRef<OrbitPoint[]>([]);
  const electron2TrailRef = useRef<OrbitPoint[]>([]);

  // Check existing session auth
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");

    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (stored === "true") {
        setIsUnlocked(true);
      }
    } catch {}
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleAuthSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!passcode.trim()) return;

    if (passcode.trim().toUpperCase() === AUTH_KEY) {
      setAuthSuccess(true);
      setAuthError(false);
      try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, "true");
      } catch {}
      setTimeout(() => {
        setIsUnlocked(true);
      }, 400);
    } else {
      setAuthError(true);
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 600);
      setPasscode("");
    }
  };

  const handleLockSession = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {}
    setIsUnlocked(false);
    setPasscode("");
    setAuthSuccess(false);
    setAuthError(false);
  };

  // Quantum Photon Pulse Trigger
  const triggerExcitationBurst = useCallback((cx: number, cy: number, cz: number) => {
    const newParticles: Particle3D[] = [];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const speed = 1.5 + Math.random() * 3.5;
      newParticles.push({
        x: cx,
        y: cy,
        z: cz,
        radius: 2 + Math.random() * 2.5,
        color: i % 2 === 0 ? "#38bdf8" : "#ec4899",
        type: "photon",
        vx: speed * Math.sin(phi) * Math.cos(theta),
        vy: speed * Math.sin(phi) * Math.sin(theta),
        vz: speed * Math.cos(phi),
        life: 1,
        maxLife: 45 + Math.floor(Math.random() * 25),
      });
    }
    burstParticlesRef.current = [...burstParticlesRef.current, ...newParticles];
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    if (!isUnlocked) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener("resize", handleResize);

    // Pre-generate Quantum Cloud points for mode "quantum"
    const quantumCloudPoints: { x: number; y: number; z: number; intensity: number }[] = [];
    const numCloudPoints = 1400;
    for (let i = 0; i < numCloudPoints; i++) {
      // Exponential orbital probability distribution for 1s: psi(r) ~ e^(-r/a0)
      const u = Math.random();
      const r = -Math.log(1 - u) * 75 + 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      quantumCloudPoints.push({
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi),
        intensity: 0.15 + Math.random() * 0.45,
      });
    }

    let time = 0;
    let lastFrameTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    // 3D Projection Helper
    function project(x: number, y: number, z: number, rx: number, ry: number, rz: number, scale: number) {
      // Rotate around Y
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;

      // Rotate around X
      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      // Rotate around Z
      const cosZ = Math.cos(rz);
      const sinZ = Math.sin(rz);
      const x3 = x1 * cosZ - y2 * sinZ;
      const y3 = x1 * sinZ + y2 * cosZ;

      // Perspective projection
      const cameraDistance = 750;
      const fov = cameraDistance / (cameraDistance + z2);
      const projX = width / 2 + x3 * fov * scale;
      const projY = height / 2 + y3 * fov * scale;

      return { x: projX, y: projY, z: z2, scale: fov * scale };
    }

    const render = (now: number) => {
      // FPS calculation
      frameCount++;
      if (now - lastFpsUpdate >= 500) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }
      const delta = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      if (!isPaused) {
        time += delta * 2.8 * speedMultiplier;
        if (autoRotateRef.current && !isDraggingRef.current) {
          targetRotationRef.current.y += delta * 0.25;
          targetRotationRef.current.x = 0.35 + Math.sin(time * 0.15) * 0.08;
        }
      }

      // Smooth Rotation & Zoom Interpolation
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.1;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.1;
      rotationRef.current.z += (targetRotationRef.current.z - rotationRef.current.z) * 0.1;
      zoomRef.current += (targetZoomRef.current - zoomRef.current) * 0.1;

      const rx = rotationRef.current.x;
      const ry = rotationRef.current.y;
      const rz = rotationRef.current.z;
      const baseScale = Math.min(width, height) / 720 * zoomRef.current;

      // Clear Canvas with sleek cosmic gradient
      ctx.clearRect(0, 0, width, height);

      // Deep space ambient radial glow
      const ambientGlow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        10,
        width / 2,
        height / 2,
        Math.min(width, height) * 0.6
      );
      ambientGlow.addColorStop(0, "rgba(56, 189, 248, 0.08)");
      ambientGlow.addColorStop(0.5, "rgba(168, 85, 247, 0.03)");
      ambientGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // Background Star dust / Quantum field grid
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let gx = 0; gx < width; gx += gridSize) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }

      // Nucleus Configuration: Helium-4 (2 Protons, 2 Neutrons)
      const nucleusJiggle = isPaused ? 0 : Math.sin(time * 12) * 1.2;
      const nucRadius = simulationMode === "nucleus" ? 38 : 15;
      const nucleusScaleFactor = simulationMode === "nucleus" ? 2.5 : 1;

      // Nucleus Particles in 3D Tetrahedral cluster
      const nucleons = [
        {
          id: "p1",
          type: "proton" as const,
          label: "p+",
          color: "#f43f5e",
          glowColor: "rgba(244, 63, 94, 0.6)",
          x: (-14 + Math.sin(time * 8) * 0.8) * nucleusScaleFactor,
          y: (-10 + Math.cos(time * 7) * 0.8) * nucleusScaleFactor,
          z: (12 + nucleusJiggle) * nucleusScaleFactor,
          radius: nucRadius,
        },
        {
          id: "p2",
          type: "proton" as const,
          label: "p+",
          color: "#ef4444",
          glowColor: "rgba(239, 68, 68, 0.6)",
          x: (14 - Math.cos(time * 9) * 0.8) * nucleusScaleFactor,
          y: (12 - Math.sin(time * 6) * 0.8) * nucleusScaleFactor,
          z: (-12 - nucleusJiggle) * nucleusScaleFactor,
          radius: nucRadius,
        },
        {
          id: "n1",
          type: "neutron" as const,
          label: "n0",
          color: "#94a3b8",
          glowColor: "rgba(148, 163, 184, 0.5)",
          x: (12 + Math.cos(time * 8) * 0.8) * nucleusScaleFactor,
          y: (-14 - Math.sin(time * 7) * 0.8) * nucleusScaleFactor,
          z: (10 - nucleusJiggle) * nucleusScaleFactor,
          radius: nucRadius,
        },
        {
          id: "n2",
          type: "neutron" as const,
          label: "n0",
          color: "#64748b",
          glowColor: "rgba(100, 116, 139, 0.5)",
          x: (-12 - Math.sin(time * 9) * 0.8) * nucleusScaleFactor,
          y: (12 + Math.cos(time * 6) * 0.8) * nucleusScaleFactor,
          z: (-10 + nucleusJiggle) * nucleusScaleFactor,
          radius: nucRadius,
        },
      ];

      // Electron 1 & 2 Orbital Paths in 3D (1s Orbital)
      const baseOrbitRadius = (165 + (energyExcitation - 1) * 65) * (simulationMode === "nucleus" ? 1.8 : 1);
      const eSpeed1 = time * 1.5;
      const eSpeed2 = time * 1.5 + Math.PI; // 180° opposite phase

      // Orbital Inclinations (Orthogonal tilted planes for 2 electrons in 1s)
      const inc1 = Math.PI / 4; // 45 deg
      const inc2 = -Math.PI / 4; // -45 deg

      // Electron 1 (Spin Up)
      const e1RawX = Math.cos(eSpeed1) * baseOrbitRadius;
      const e1RawY = Math.sin(eSpeed1) * baseOrbitRadius * Math.cos(inc1);
      const e1RawZ = Math.sin(eSpeed1) * baseOrbitRadius * Math.sin(inc1);

      // Electron 2 (Spin Down)
      const e2RawX = Math.cos(eSpeed2) * baseOrbitRadius;
      const e2RawY = Math.sin(eSpeed2) * baseOrbitRadius * Math.cos(inc2);
      const e2RawZ = Math.sin(eSpeed2) * baseOrbitRadius * Math.sin(inc2);

      // Update Trail Queues
      if (showTrails && !isPaused) {
        electron1TrailRef.current.push({ x: e1RawX, y: e1RawY, z: e1RawZ, alpha: 1 });
        electron2TrailRef.current.push({ x: e2RawX, y: e2RawY, z: e2RawZ, alpha: 1 });
        if (electron1TrailRef.current.length > 55) electron1TrailRef.current.shift();
        if (electron2TrailRef.current.length > 55) electron2TrailRef.current.shift();
      }

      // Draw Orbit Ellipse Paths
      if (showOrbits && simulationMode === "bohr") {
        const numSegments = 72;
        // Orbit 1 Ring
        ctx.beginPath();
        for (let s = 0; s <= numSegments; s++) {
          const angle = (s / numSegments) * Math.PI * 2;
          const ox = Math.cos(angle) * baseOrbitRadius;
          const oy = Math.sin(angle) * baseOrbitRadius * Math.cos(inc1);
          const oz = Math.sin(angle) * baseOrbitRadius * Math.sin(inc1);
          const p = project(ox, oy, oz, rx, ry, rz, baseScale);
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Orbit 2 Ring
        ctx.beginPath();
        for (let s = 0; s <= numSegments; s++) {
          const angle = (s / numSegments) * Math.PI * 2;
          const ox = Math.cos(angle) * baseOrbitRadius;
          const oy = Math.sin(angle) * baseOrbitRadius * Math.cos(inc2);
          const oz = Math.sin(angle) * baseOrbitRadius * Math.sin(inc2);
          const p = project(ox, oy, oz, rx, ry, rz, baseScale);
          if (s === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = "rgba(168, 85, 247, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Quantum Cloud if in "quantum" mode
      if (simulationMode === "quantum") {
        for (const pt of quantumCloudPoints) {
          const p = project(pt.x, pt.y, pt.z, rx, ry, rz, baseScale);
          const cloudAlpha = pt.intensity * Math.max(0.1, (p.z + 400) / 800);
          ctx.fillStyle = `rgba(56, 189, 248, ${cloudAlpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, 1.8 * p.scale), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Electron Trails
      if (showTrails && simulationMode === "bohr") {
        // Trail 1 (Cyan/Sky)
        const t1 = electron1TrailRef.current;
        for (let i = 1; i < t1.length; i++) {
          const pPrev = project(t1[i - 1].x, t1[i - 1].y, t1[i - 1].z, rx, ry, rz, baseScale);
          const pCurr = project(t1[i].x, t1[i].y, t1[i].z, rx, ry, rz, baseScale);
          const alpha = (i / t1.length) * 0.65;
          ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
          ctx.lineWidth = Math.max(1, (i / t1.length) * 3.5 * pCurr.scale);
          ctx.beginPath();
          ctx.moveTo(pPrev.x, pPrev.y);
          ctx.lineTo(pCurr.x, pCurr.y);
          ctx.stroke();
        }

        // Trail 2 (Purple/Pink)
        const t2 = electron2TrailRef.current;
        for (let i = 1; i < t2.length; i++) {
          const pPrev = project(t2[i - 1].x, t2[i - 1].y, t2[i - 1].z, rx, ry, rz, baseScale);
          const pCurr = project(t2[i].x, t2[i].y, t2[i].z, rx, ry, rz, baseScale);
          const alpha = (i / t2.length) * 0.65;
          ctx.strokeStyle = `rgba(236, 72, 153, ${alpha})`;
          ctx.lineWidth = Math.max(1, (i / t2.length) * 3.5 * pCurr.scale);
          ctx.beginPath();
          ctx.moveTo(pPrev.x, pPrev.y);
          ctx.lineTo(pCurr.x, pCurr.y);
          ctx.stroke();
        }
      }

      // Collect all 3D renderable objects for Z-Sorting
      interface RenderableObj {
        z: number;
        draw: () => void;
      }
      const renderables: RenderableObj[] = [];

      // Strong Nuclear Force Glow at center
      const centerProj = project(0, 0, 0, rx, ry, rz, baseScale);
      renderables.push({
        z: centerProj.z - 50,
        draw: () => {
          const nucGlow = ctx.createRadialGradient(
            centerProj.x,
            centerProj.y,
            2,
            centerProj.x,
            centerProj.y,
            60 * baseScale
          );
          nucGlow.addColorStop(0, "rgba(244, 63, 94, 0.4)");
          nucGlow.addColorStop(0.5, "rgba(239, 68, 68, 0.15)");
          nucGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
          ctx.fillStyle = nucGlow;
          ctx.beginPath();
          ctx.arc(centerProj.x, centerProj.y, 60 * baseScale, 0, Math.PI * 2);
          ctx.fill();
        },
      });

      // Add Nucleons
      nucleons.forEach((n) => {
        const p = project(n.x, n.y, n.z, rx, ry, rz, baseScale);
        renderables.push({
          z: p.z,
          draw: () => {
            const rad = Math.max(3, n.radius * p.scale);
            // 3D Sphere gradient with specular highlight
            const grad = ctx.createRadialGradient(
              p.x - rad * 0.35,
              p.y - rad * 0.35,
              rad * 0.1,
              p.x,
              p.y,
              rad
            );
            if (n.type === "proton") {
              grad.addColorStop(0, "#ff8597");
              grad.addColorStop(0.4, "#f43f5e");
              grad.addColorStop(1, "#881337");
            } else {
              grad.addColorStop(0, "#e2e8f0");
              grad.addColorStop(0.4, "#94a3b8");
              grad.addColorStop(1, "#334155");
            }

            // Outer Aura
            ctx.shadowColor = n.glowColor;
            ctx.shadowBlur = 12 * p.scale;

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Nucleon Symbol Marker
            if (showNucleusDetails && rad > 8) {
              ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
              ctx.font = `bold ${Math.max(8, Math.floor(rad * 0.7))}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(n.type === "proton" ? "+" : "0", p.x, p.y);
            }
          },
        });
      });

      // Add Electrons (if not in nucleus focus mode)
      if (simulationMode !== "nucleus") {
        // Electron 1
        const pe1 = project(e1RawX, e1RawY, e1RawZ, rx, ry, rz, baseScale);
        renderables.push({
          z: pe1.z,
          draw: () => {
            const eRad = Math.max(4, 7.5 * pe1.scale);
            // Glow
            const eGlow = ctx.createRadialGradient(pe1.x, pe1.y, 1, pe1.x, pe1.y, eRad * 3.5);
            eGlow.addColorStop(0, "rgba(56, 189, 248, 1)");
            eGlow.addColorStop(0.4, "rgba(14, 165, 233, 0.6)");
            eGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = eGlow;
            ctx.beginPath();
            ctx.arc(pe1.x, pe1.y, eRad * 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(pe1.x, pe1.y, eRad, 0, Math.PI * 2);
            ctx.fill();

            // Quantum Spin Tag
            ctx.fillStyle = "#38bdf8";
            ctx.font = `bold 10px monospace`;
            ctx.textAlign = "center";
            ctx.fillText("e⁻ (↑)", pe1.x, pe1.y - eRad - 5);
          },
        });

        // Electron 2
        const pe2 = project(e2RawX, e2RawY, e2RawZ, rx, ry, rz, baseScale);
        renderables.push({
          z: pe2.z,
          draw: () => {
            const eRad = Math.max(4, 7.5 * pe2.scale);
            // Glow
            const eGlow = ctx.createRadialGradient(pe2.x, pe2.y, 1, pe2.x, pe2.y, eRad * 3.5);
            eGlow.addColorStop(0, "rgba(236, 72, 153, 1)");
            eGlow.addColorStop(0.4, "rgba(217, 70, 239, 0.6)");
            eGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
            ctx.fillStyle = eGlow;
            ctx.beginPath();
            ctx.arc(pe2.x, pe2.y, eRad * 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(pe2.x, pe2.y, eRad, 0, Math.PI * 2);
            ctx.fill();

            // Quantum Spin Tag
            ctx.fillStyle = "#ec4899";
            ctx.font = `bold 10px monospace`;
            ctx.textAlign = "center";
            ctx.fillText("e⁻ (↓)", pe2.x, pe2.y - eRad - 5);
          },
        });
      }

      // Add Burst Particles (Photons / Quantum emissions)
      const aliveBurstParticles: Particle3D[] = [];
      burstParticlesRef.current.forEach((bp) => {
        bp.x += (bp.vx || 0) * (isPaused ? 0 : 1);
        bp.y += (bp.vy || 0) * (isPaused ? 0 : 1);
        bp.z += (bp.vz || 0) * (isPaused ? 0 : 1);
        bp.life = (bp.life || 1) - 0.02;

        if (bp.life > 0) {
          aliveBurstParticles.push(bp);
          const p = project(bp.x, bp.y, bp.z, rx, ry, rz, baseScale);
          renderables.push({
            z: p.z,
            draw: () => {
              ctx.fillStyle = bp.color;
              ctx.globalAlpha = Math.max(0, bp.life || 1);
              ctx.beginPath();
              ctx.arc(p.x, p.y, Math.max(1, bp.radius * p.scale), 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            },
          });
        }
      });
      burstParticlesRef.current = aliveBurstParticles;

      // Depth Sort (Z-Buffer Painter's algorithm from back to front)
      renderables.sort((a, b) => b.z - a.z);
      renderables.forEach((item) => item.draw());

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isUnlocked, isPaused, speedMultiplier, simulationMode, showTrails, showOrbits, showNucleusDetails, energyExcitation]);

  // Mouse & Touch 3D Rotation Event Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    autoRotateRef.current = false;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    targetRotationRef.current.y += dx * 0.007;
    targetRotationRef.current.x -= dy * 0.007;
    // Clamp X rotation to avoid flipping upside down
    targetRotationRef.current.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, targetRotationRef.current.x));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0012;
    targetZoomRef.current = Math.max(0.4, Math.min(2.8, targetZoomRef.current + zoomDelta));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clickX = e.clientX - rect.left - rect.width / 2;
    const clickY = e.clientY - rect.top - rect.height / 2;
    triggerExcitationBurst(clickX * 0.5, clickY * 0.5, 0);
  };

  // 1. Passcode Authentication Screen
  if (!isUnlocked) {
    return (
      <main className="min-h-screen bg-black text-foreground flex flex-col font-sans relative overflow-hidden select-none">
        {/* Background ambient lighting */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/20 via-black to-purple-950/20 pointer-events-none" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

        {/* Minimal Header */}
        <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto w-full relative z-20">
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>EXIT TO CLOUD</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-sky-400 animate-ping" />
            <span className="text-[11px] font-mono text-zinc-400 font-semibold tracking-wider uppercase">
              NODE SEC-02
            </span>
          </div>
        </header>

        {/* Center Security Passcode Form */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-20">
          <div
            className={`max-w-md w-full p-8 rounded-3xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl shadow-2xl space-y-6 text-center transition-transform ${
              isShaking ? "animate-shake border-red-500/50 bg-red-950/20" : ""
            }`}
          >
            {/* Lock Icon */}
            <div className="relative mx-auto size-20 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-xl shadow-sky-500/10">
              {authSuccess ? (
                <Unlock className="size-9 text-emerald-400 animate-pulse" />
              ) : (
                <Lock className="size-9" />
              )}
              <div className="absolute -inset-1.5 rounded-3xl border border-sky-400/20 animate-ping opacity-30 pointer-events-none" />
            </div>

            {/* Title & Info */}
            <div className="space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase font-mono">
                AUTHENTICATION REQUIRED
              </h1>
              <p className="text-xs text-zinc-400 font-mono">
                Enter security key to access this system module.
              </p>
            </div>

            {/* Passcode Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div className="relative">
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (authError) setAuthError(false);
                  }}
                  placeholder="••••"
                  autoFocus
                  maxLength={16}
                  className="w-full px-5 py-3.5 rounded-2xl bg-black/60 border border-white/15 focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20 text-center text-lg sm:text-xl font-mono tracking-[0.35em] text-white placeholder:text-zinc-600 outline-none transition-all"
                />
                <KeyRound className="size-4 text-zinc-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Error / Feedback state */}
              {authError && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-red-400 font-mono animate-fade-in">
                  <ShieldAlert className="size-3.5" />
                  <span>Access Denied: Invalid Security Key</span>
                </div>
              )}

              {authSuccess && (
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-mono animate-fade-in">
                  <CheckCircle2 className="size-3.5" />
                  <span>Access Granted. Initializing Helium Engine...</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-white text-black hover:bg-zinc-200 font-bold text-sm tracking-wider uppercase transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2"
              >
                <span>VERIFY KEY</span>
              </button>
            </form>

            <div className="pt-2 text-[10px] font-mono text-zinc-500">
              AS CLOUD QUANTUM DYNAMICS ENGINE • ENCRYPTED GATEWAY
            </div>
          </div>
        </div>
      </main>
    );
  }

  // 2. Unlocked Full Helium Orbital Simulation UI
  return (
    <main className="min-h-screen bg-black text-foreground flex flex-col font-sans relative overflow-hidden select-none">
      {/* 3D Canvas Viewport */}
      <div className="absolute inset-0 z-0">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
          onClick={handleCanvasClick}
          className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        />
      </div>

      {/* Top Floating HUD Bar */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full relative z-20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link
            to="/"
            className="size-9 sm:size-10 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/30 transition-all shadow-lg active:scale-95"
            title="Back to Home"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-black/60 border border-white/15 backdrop-blur-xl shadow-lg">
            <div className="size-2.5 rounded-full bg-sky-400 animate-ping" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-black tracking-wider text-white font-mono">
                  HELIUM-4
                </span>
                <span className="px-1.5 py-0.2 rounded bg-sky-500/20 border border-sky-500/30 text-[9px] font-mono font-bold text-sky-300">
                  ²He
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Right Quick Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              targetRotationRef.current = { x: 0.35, y: 0.65, z: 0 };
              targetZoomRef.current = 1;
              autoRotateRef.current = true;
            }}
            className="size-9 rounded-xl bg-black/60 border border-white/15 backdrop-blur-xl flex items-center justify-center text-zinc-300 hover:text-white hover:border-white/30 transition-all shadow-lg active:scale-90"
            title="Reset Camera"
          >
            <RotateCcw className="size-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="size-9 rounded-xl border border-white/15 bg-black/60 backdrop-blur-xl flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-90"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          <button
            onClick={handleLockSession}
            className="px-3 py-1.5 rounded-xl border border-red-500/30 bg-red-950/30 hover:bg-red-900/50 backdrop-blur-xl text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-lg active:scale-95"
            title="Lock Session"
          >
            <Lock className="size-3.5" />
            <span className="hidden sm:inline">LOCK</span>
          </button>
        </div>
      </header>

      {/* Center Quantum Telemetry Drawer (Left side overlay) */}
      {showQuantumTelemetry && (
        <aside className="absolute left-4 top-20 z-20 max-w-xs w-full pointer-events-none hidden md:block">
          <div className="p-4 rounded-3xl border border-white/10 bg-black/65 backdrop-blur-2xl shadow-2xl space-y-3 pointer-events-auto text-xs font-mono text-zinc-300">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Atom className="size-4 text-sky-400 animate-spin" style={{ animationDuration: "12s" }} />
                <span className="font-bold text-white uppercase tracking-wider">Quantum Telemetry</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-semibold">{fps} FPS</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-500 text-[10px]">ATOMIC NUMBER</div>
                <div className="text-white font-bold">Z = 2</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-500 text-[10px]">ATOMIC MASS</div>
                <div className="text-white font-bold">4.0026 u</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-500 text-[10px]">CONFIGURATION</div>
                <div className="text-sky-400 font-bold">1s² (Noble Gas)</div>
              </div>
              <div className="p-2 rounded-xl bg-white/5 border border-white/5">
                <div className="text-zinc-500 text-[10px]">GROUND ENERGY</div>
                <div className="text-purple-400 font-bold">-24.58 eV</div>
              </div>
            </div>

            {/* Nucleus composition summary */}
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-rose-500 inline-block" /> 2 Protons (+2e)
                </span>
                <span className="text-white font-semibold">q = +3.204×10⁻¹⁹ C</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-slate-400 inline-block" /> 2 Neutrons (0)
                </span>
                <span className="text-white font-semibold">Strong Nuclear Force</span>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-full bg-sky-400 inline-block" /> 2 Electrons (-2e)
                </span>
                <span className="text-white font-semibold">Pauli Exclusion (↑ ↓)</span>
              </div>
            </div>

            <div className="pt-1 text-[9.5px] text-zinc-500 leading-tight">
              💡 Drag to rotate in 3D • Scroll/pinch to zoom • Click atom to stimulate photon emission.
            </div>
          </div>
        </aside>
      )}

      {/* Bottom Interactive Control Panel */}
      <footer className="mt-auto p-4 sm:p-6 w-full relative z-20 flex flex-col items-center justify-center gap-3 pointer-events-none">
        <div className="p-2 sm:p-2.5 rounded-3xl border border-white/15 bg-black/75 backdrop-blur-2xl shadow-2xl flex flex-wrap items-center justify-center gap-2 sm:gap-3 pointer-events-auto max-w-2xl w-full">
          {/* Pause / Play */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all active:scale-95"
            title={isPaused ? "Resume Simulation" : "Pause Simulation"}
          >
            {isPaused ? <Play className="size-4 text-emerald-400" /> : <Pause className="size-4" />}
          </button>

          {/* Mode Selector */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setSimulationMode("bohr")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                simulationMode === "bohr"
                  ? "bg-sky-500 text-black shadow-md shadow-sky-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Orbits
            </button>
            <button
              onClick={() => setSimulationMode("quantum")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                simulationMode === "quantum"
                  ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Wave Cloud
            </button>
            <button
              onClick={() => setSimulationMode("nucleus")}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                simulationMode === "nucleus"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Nucleus
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 px-2">
            <span className="text-[11px] hidden sm:inline">SPEED:</span>
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeedMultiplier(s)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  speedMultiplier === s
                    ? "bg-white/20 text-white border border-white/20"
                    : "hover:bg-white/5 text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Energy Level Toggle (1s vs 2s excitation) */}
          <button
            onClick={() => {
              const nextLevel = energyExcitation === 1 ? 2 : 1;
              setEnergyExcitation(nextLevel);
              triggerExcitationBurst(0, 0, 0);
            }}
            className={`px-3 py-1.5 rounded-2xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
              energyExcitation === 2
                ? "border-pink-500/40 bg-pink-500/20 text-pink-300"
                : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
            }`}
            title="Toggle Quantum Excitation State"
          >
            <Zap className="size-3.5 text-amber-400" />
            <span>{energyExcitation === 1 ? "1s Ground" : "2s Excited"}</span>
          </button>

          {/* Photon Burst Trigger Button */}
          <button
            onClick={() => triggerExcitationBurst(0, 0, 0)}
            className="px-3 py-1.5 rounded-2xl border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/25 text-sky-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            title="Emit Quantum Photon"
          >
            <Sparkles className="size-3.5" />
            <span className="hidden sm:inline">EMIT PHOTON</span>
          </button>
        </div>
      </footer>
    </main>
  );
}
