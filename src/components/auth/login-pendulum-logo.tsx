"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Pencil,
  type LucideIcon,
} from "lucide-react";

import { useTheme } from "@/components/theme-provider";

type Point = {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
};

type PendulumConfig = {
  id: string;
  anchorXRatio: number;
  anchorYRatio: number;
  segmentCount: number;
  segmentLength: number;
  startDirection: { x: number; y: number };
  size: number;
  icon: LucideIcon;
};

type Pendulum = {
  config: PendulumConfig;
  points: Point[];
};

const PENDULUM_ICONS: LucideIcon[] = [
  BookOpen,
  Pencil,
  GraduationCap,
  CalendarDays,
];

const GRAVITY = 0.32;
const DAMPING = 0.993;
const CONSTRAINT_ITERATIONS = 16;
const MAX_SPEED = 55;
const ICON_SIZE = 44;
const ANCHOR_Y_RATIO = 0.05;
const ANCHOR_X_POSITIONS = [0.1, 0.32, 0.68, 0.9];

const STRING_COLORS = {
  light: { line: "rgba(55, 53, 47, 0.34)", knot: "rgba(55, 53, 47, 0.5)" },
  dark: { line: "rgba(230, 230, 229, 0.3)", knot: "rgba(230, 230, 229, 0.46)" },
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function randomStartDirection() {
  const angle = randomBetween(-Math.PI * 0.72, -Math.PI * 0.28);
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function generatePendulumConfigs(): PendulumConfig[] {
  return ANCHOR_X_POSITIONS.map((anchorXRatio, index) => ({
    id: `pendulum-${index}`,
    anchorXRatio,
    anchorYRatio: ANCHOR_Y_RATIO,
    segmentCount: randomInt(8, 28),
    segmentLength: 11,
    startDirection: randomStartDirection(),
    size: ICON_SIZE,
    icon: PENDULUM_ICONS[index] ?? BookOpen,
  }));
}

function createRope(config: PendulumConfig, anchorX: number, anchorY: number): Point[] {
  const points: Point[] = [];
  const { segmentCount, segmentLength, startDirection } = config;

  for (let index = 0; index <= segmentCount; index += 1) {
    const distance = index * segmentLength;
    const x = anchorX + startDirection.x * distance;
    const y = anchorY + startDirection.y * distance;

    points.push({ x, y, oldX: x, oldY: y, pinned: index === 0 });
  }

  return points;
}

function createPendulums(configs: PendulumConfig[], width: number, height: number): Pendulum[] {
  return configs.map((config) => {
    const anchor = getAnchor(config, width, height);
    return {
      config,
      points: createRope(config, anchor.x, anchor.y),
    };
  });
}

function integrate(points: Point[]) {
  for (const point of points) {
    if (point.pinned) continue;

    let velocityX = (point.x - point.oldX) * DAMPING;
    let velocityY = (point.y - point.oldY) * DAMPING;

    const speed = Math.hypot(velocityX, velocityY);
    if (speed > MAX_SPEED) {
      velocityX = (velocityX / speed) * MAX_SPEED;
      velocityY = (velocityY / speed) * MAX_SPEED;
    }

    point.oldX = point.x;
    point.oldY = point.y;
    point.x += velocityX;
    point.y += velocityY + GRAVITY;
  }
}

function constrain(points: Point[], segmentLength: number) {
  for (let iteration = 0; iteration < CONSTRAINT_ITERATIONS; iteration += 1) {
    for (let index = 0; index < points.length - 1; index += 1) {
      const first = points[index];
      const second = points[index + 1];

      const deltaX = second.x - first.x;
      const deltaY = second.y - first.y;
      const distance = Math.hypot(deltaX, deltaY);
      if (distance <= segmentLength || distance === 0) continue;

      const difference = (distance - segmentLength) / distance;
      const offsetX = deltaX * difference;
      const offsetY = deltaY * difference;

      if (first.pinned) {
        second.x -= offsetX;
        second.y -= offsetY;
      } else if (second.pinned) {
        first.x += offsetX;
        first.y += offsetY;
      } else {
        first.x += offsetX * 0.5;
        first.y += offsetY * 0.5;
        second.x -= offsetX * 0.5;
        second.y -= offsetY * 0.5;
      }
    }
  }
}

function drawStrings(
  context: CanvasRenderingContext2D,
  pendulums: Pendulum[],
  width: number,
  height: number,
  colors: { line: string; knot: string }
) {
  context.clearRect(0, 0, width, height);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 1.5;
  context.strokeStyle = colors.line;
  context.fillStyle = colors.knot;

  for (const pendulum of pendulums) {
    const { points } = pendulum;

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      context.lineTo(points[index].x, points[index].y);
    }
    context.stroke();

    context.beginPath();
    context.arc(points[0].x, points[0].y, 2.5, 0, Math.PI * 2);
    context.fill();
  }
}

function getIconTransform(points: Point[], iconSize: number) {
  const last = points[points.length - 1];
  const previous = points[points.length - 2];

  const deltaX = last.x - previous.x;
  const deltaY = last.y - previous.y;
  const length = Math.hypot(deltaX, deltaY) || 1;
  const dirX = deltaX / length;
  const dirY = deltaY / length;

  return {
    x: last.x + dirX * (iconSize * 0.46),
    y: last.y + dirY * (iconSize * 0.46),
    angle: Math.atan2(-dirX, dirY),
  };
}

function getAnchor(config: PendulumConfig, width: number, height: number) {
  return {
    x: width * config.anchorXRatio,
    y: height * config.anchorYRatio,
  };
}


export function LoginPendulumLogo() {
  const { resolvedTheme } = useTheme();
  const [pendulumConfigs, setPendulumConfigs] = useState<PendulumConfig[] | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pendulumsRef = useRef<Pendulum[]>([]);
  const frameRef = useRef<number | null>(null);
  const draggingIndexRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const colorsRef = useRef(STRING_COLORS.light);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isReady, setIsReady] = useState(false);

  colorsRef.current =
    resolvedTheme === "dark" ? STRING_COLORS.dark : STRING_COLORS.light;

  useEffect(() => {
    setPendulumConfigs(generatePendulumConfigs());
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReduceMotion(media.matches);
    updateMotion();
    media.addEventListener("change", updateMotion);
    return () => media.removeEventListener("change", updateMotion);
  }, []);

  useEffect(() => {
    if (!pendulumConfigs || reduceMotion) {
      if (pendulumConfigs && reduceMotion) setIsReady(true);
      return;
    }

    pendulumsRef.current = [];

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      width = rect.width;
      height = rect.height;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (pendulumsRef.current.length === 0) {
        pendulumsRef.current = createPendulums(pendulumConfigs, width, height);
        return;
      }

      for (const pendulum of pendulumsRef.current) {
        const anchor = getAnchor(pendulum.config, width, height);
        const shiftX = anchor.x - pendulum.points[0].x;
        const shiftY = anchor.y - pendulum.points[0].y;

        for (const point of pendulum.points) {
          point.x += shiftX;
          point.y += shiftY;
          point.oldX += shiftX;
          point.oldY += shiftY;
        }
      }
    };

    const tick = () => {
      const pendulums = pendulumsRef.current;

      for (let index = 0; index < pendulums.length; index += 1) {
        const pendulum = pendulums[index];
        const anchor = getAnchor(pendulum.config, width, height);

        pendulum.points[0].x = anchor.x;
        pendulum.points[0].y = anchor.y;

        if (draggingIndexRef.current !== index) {
          integrate(pendulum.points);
        }

        constrain(pendulum.points, pendulum.config.segmentLength);

        const icon = logoRefs.current[index];
        if (icon) {
          const { x, y, angle } = getIconTransform(
            pendulum.points,
            pendulum.config.size
          );
          icon.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}rad)`;
        }
      }

      drawStrings(context, pendulums, width, height, colorsRef.current);
      frameRef.current = window.requestAnimationFrame(tick);
    };

    resize();
    setIsReady(true);
    frameRef.current = window.requestAnimationFrame(tick);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [pendulumConfigs, reduceMotion]);

  const dragPendulumTo = (
    index: number,
    clientX: number,
    clientY: number
  ) => {
    const container = containerRef.current;
    const pendulum = pendulumsRef.current[index];
    if (!container || !pendulum) return;

    const rect = container.getBoundingClientRect();
    const last = pendulum.points[pendulum.points.length - 1];

    last.oldX = last.x;
    last.oldY = last.y;
    last.x = clientX - rect.left;
    last.y = clientY - rect.top;
  };

  const handlePointerDown =
    (index: number) => (event: React.PointerEvent<HTMLDivElement>) => {
      if (reduceMotion) return;

      draggingIndexRef.current = index;
      pointerIdRef.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      dragPendulumTo(index, event.clientX, event.clientY);
    };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const index = draggingIndexRef.current;
    if (index === null || pointerIdRef.current !== event.pointerId) return;
    dragPendulumTo(index, event.clientX, event.clientY);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerIdRef.current !== event.pointerId) return;

    draggingIndexRef.current = null;
    pointerIdRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  if (!pendulumConfigs) {
    return null;
  }

  if (reduceMotion) {
    return (
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        {pendulumConfigs.map((config) => {
          const Icon = config.icon;

          return (
          <div
            key={config.id}
            className="absolute -translate-x-1/2"
            style={{
              left: `${config.anchorXRatio * 100}%`,
              top: `${config.anchorYRatio * 100}%`,
            }}
          >
            <div
              className="mx-auto w-px bg-border"
              style={{ height: config.segmentCount * config.segmentLength }}
            />
            <Icon
              size={ICON_SIZE}
              strokeWidth={2}
              className="text-foreground drop-shadow-sm"
              aria-hidden
            />
          </div>
          );
        })}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {pendulumConfigs.map((config, index) => {
        const Icon = config.icon;

        return (
        <div
          key={config.id}
          ref={(element) => {
            logoRefs.current[index] = element;
          }}
          className="pointer-events-auto absolute top-0 left-0 touch-none cursor-grab text-foreground transition-opacity duration-300 active:cursor-grabbing"
          style={{
            width: ICON_SIZE,
            height: ICON_SIZE,
            opacity: isReady ? 1 : 0,
          }}
          onPointerDown={handlePointerDown(index)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <Icon size={ICON_SIZE} strokeWidth={2} className="drop-shadow-sm" aria-hidden />
        </div>
        );
      })}
    </div>
  );
}
