import { useEffect, useRef, useState } from "react";

export type ShipmentStatus = "on-time" | "delayed" | "at-risk" | "rerouted" | "delivered";
export type AlertLevel = "info" | "ok" | "warn" | "danger";

export interface Checkpoint {
  name: string;
  x: number;
  y: number;
  reached: boolean;
  reachedAt?: string;
}

export interface SimAlert {
  id: string;
  t: string;
  msg: string;
  level: AlertLevel;
}

export interface ShipmentState {
  id: string;
  status: ShipmentStatus;
  progress: number; // 0..1
  speed: number; // knots
  delayHours: number;
  congestion: "LOW" | "MED" | "HIGH";
  riskScore: number; // 0..100
  etaDays: number;
  idleTicks: number;
  checkpoints: Checkpoint[];
  currentCheckpoint: number;
  rerouted: boolean;
}

const INITIAL_CHECKPOINTS: Checkpoint[] = [
  { name: "Singapore Port", x: 78, y: 56, reached: true },
  { name: "South China Sea", x: 65, y: 50, reached: false },
  { name: "Mid-Pacific", x: 50, y: 45, reached: false },
  { name: "North-East Pacific", x: 32, y: 42, reached: false },
  { name: "Destination Port", x: 20, y: 42, reached: false },
];

const SEATTLE_CHECKPOINTS: Checkpoint[] = [
  { name: "Singapore Port", x: 78, y: 56, reached: true },
  { name: "South China Sea", x: 65, y: 50, reached: false },
  { name: "Mid-Pacific", x: 50, y: 38, reached: false },
  { name: "North-East Pacific", x: 32, y: 34, reached: false },
  { name: "Seattle Port", x: 19, y: 32, reached: false },
];

function timeStr(d = new Date()) {
  return d.toTimeString().slice(0, 8);
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export function useShipmentSimulation(rerouted: boolean) {
  const [state, setState] = useState<ShipmentState>({
    id: "SHP-2046",
    status: "on-time",
    progress: 0.15,
    speed: 18.2,
    delayHours: 0,
    congestion: "LOW",
    riskScore: 22,
    etaDays: 18,
    idleTicks: 0,
    checkpoints: INITIAL_CHECKPOINTS.map((c, i) => ({ ...c, reached: i === 0 })),
    currentCheckpoint: 0,
    rerouted: false,
  });
  const [alerts, setAlerts] = useState<SimAlert[]>([]);
  const idRef = useRef(0);

  const pushAlert = (msg: string, level: AlertLevel) => {
    setAlerts((prev) => [
      { id: `a-${++idRef.current}`, t: timeStr(), msg, level },
      ...prev,
    ].slice(0, 12));
  };

  // Switch checkpoint set when rerouted
  useEffect(() => {
    if (rerouted && !state.rerouted) {
      setState((s) => ({
        ...s,
        rerouted: true,
        status: "rerouted",
        checkpoints: SEATTLE_CHECKPOINTS.map((c, i) => ({
          ...c,
          reached: i <= s.currentCheckpoint,
        })),
        delayHours: 48,
        etaDays: 20,
        congestion: "LOW",
        riskScore: 28,
      }));
      pushAlert("Route updated → Seattle Port. ETA recalculated: 20 days.", "ok");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rerouted]);

  // Main simulation tick
  useEffect(() => {
    const tick = setInterval(() => {
      setState((s) => {
        // Random data simulation layer
        const congestionRoll = Math.random();
        const newCongestion: ShipmentState["congestion"] =
          congestionRoll > 0.92 ? "HIGH" : congestionRoll > 0.75 ? "MED" : "LOW";

        const delayProb = Math.random();
        let newDelay = s.delayHours;
        if (delayProb > 0.85 && s.status !== "delivered") {
          newDelay = Math.min(s.delayHours + Math.round(rand(2, 8)), 96);
        }

        // Movement
        const isIdle = Math.random() > 0.97;
        const speedJitter = rand(-1.2, 1.2);
        const newSpeed = isIdle ? 0 : Math.max(8, Math.min(22, s.speed + speedJitter));
        const advance = isIdle ? 0 : 0.012 + Math.random() * 0.008;
        let newProgress = Math.min(1, s.progress + advance);

        // Checkpoint detection
        let newCp = s.currentCheckpoint;
        const checkpoints = [...s.checkpoints];
        const targetIndex = Math.floor(newProgress * (checkpoints.length - 1));
        if (targetIndex > newCp && targetIndex < checkpoints.length) {
          newCp = targetIndex;
          checkpoints[newCp] = { ...checkpoints[newCp], reached: true, reachedAt: timeStr() };
          pushAlert(`Checkpoint reached: ${checkpoints[newCp].name}`, "ok");
        }

        // Risk scoring (AI prediction layer)
        let risk = 15;
        risk += newCongestion === "HIGH" ? 35 : newCongestion === "MED" ? 18 : 5;
        risk += Math.min(newDelay * 0.6, 35);
        risk += isIdle ? 10 : 0;
        risk = Math.min(99, Math.round(risk));

        // Status derivation
        let status: ShipmentStatus = s.status;
        if (newProgress >= 1) status = "delivered";
        else if (s.rerouted) status = "rerouted";
        else if (risk > 65) status = "at-risk";
        else if (newDelay > 12) status = "delayed";
        else status = "on-time";

        // Event-driven alerts
        if (newDelay > s.delayHours && newDelay > 12) {
          pushAlert(`Delay alert: +${newDelay}h projected on ${s.id}`, "warn");
        }
        if (newCongestion === "HIGH" && s.congestion !== "HIGH") {
          pushAlert("High port congestion detected → rerouting suggested", "danger");
        }
        const idleTicks = isIdle ? s.idleTicks + 1 : 0;
        if (idleTicks === 3) {
          pushAlert(`Risk alert: ${s.id} idle for extended period`, "danger");
        }
        if (status === "delivered" && s.status !== "delivered") {
          pushAlert(`Shipment ${s.id} delivered successfully`, "ok");
        }

        // ETA recalculation
        const baseDays = s.rerouted ? 20 : 18;
        const remaining = 1 - newProgress;
        const etaDays = Math.max(0, Math.round((baseDays * remaining + newDelay / 24) * 10) / 10);

        return {
          ...s,
          progress: newProgress,
          speed: newSpeed,
          delayHours: newDelay,
          congestion: newCongestion,
          riskScore: risk,
          etaDays,
          idleTicks,
          checkpoints,
          currentCheckpoint: newCp,
          status,
        };
      });
    }, 2500);
    return () => clearInterval(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, alerts, pushAlert };
}
