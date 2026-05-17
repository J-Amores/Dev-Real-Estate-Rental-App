"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

import { AUTH_BG_PAINT, AUTH_BG_ROUTES } from "@/lib/auth-bg-routes";

type Dot = { x: number; y: number; opacity: number };

function generateDots(width: number, height: number): Dot[] {
  const { gap } = AUTH_BG_PAINT;
  const dots: Dot[] = [];
  for (let x = 0; x < width; x += gap) {
    for (let y = 0; y < height; y += gap) {
      if (Math.random() > 0.3) {
        dots.push({
          x,
          y,
          opacity: Math.random() * 0.22 + 0.18,
        });
      }
    }
  }
  return dots;
}

/**
 * Phase 11 spec §5 — ambient dotted-map background for AuthHero.
 * Cream surface (transparent clear; panel bg shows through), evergreen dots,
 * deep-evergreen route lines. Pauses on visibilitychange. Static SVG fallback
 * for prefers-reduced-motion.
 */
export function AuthBgCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [staticDots, setStaticDots] = useState<Dot[] | null>(null);
  const reducedMotion = useReducedMotion() === true;

  // Track parent size via ResizeObserver.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setSize({ w: Math.round(rect.width), h: Math.round(rect.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Reduced-motion path: render static SVG dots only.
  useEffect(() => {
    if (!reducedMotion) return;
    if (!size.w || !size.h) return;
    setStaticDots(generateDots(size.w, size.h));
  }, [reducedMotion, size.w, size.h]);

  // Animation loop (skipped under reduced-motion).
  useEffect(() => {
    if (reducedMotion) return;
    if (!size.w || !size.h) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = size.w;
    canvas.height = size.h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(size.w, size.h);
    let startTime = performance.now();
    let raf = 0;
    let paused = false;
    let elapsed = 0;

    const onVisibility = () => {
      paused = document.hidden;
      if (!paused) startTime = performance.now() - elapsed * 1000;
    };
    document.addEventListener("visibilitychange", onVisibility);

    const drawDots = () => {
      ctx.clearRect(0, 0, size.w, size.h);
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, AUTH_BG_PAINT.dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.dotColor(d.opacity);
        ctx.fill();
      }
    };

    const drawRoutes = (t: number) => {
      for (const route of AUTH_BG_ROUTES) {
        const e = t - route.start.delay;
        if (e <= 0) continue;
        const progress = Math.min(e / AUTH_BG_PAINT.routeDuration, 1);
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;

        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = AUTH_BG_PAINT.routeStroke;
        ctx.lineWidth = AUTH_BG_PAINT.routeWidth;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(route.start.x, route.start.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.routePoint;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.routePoint;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = AUTH_BG_PAINT.routeGlow;
        ctx.fill();

        if (progress === 1) {
          ctx.beginPath();
          ctx.arc(route.end.x, route.end.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = AUTH_BG_PAINT.routePoint;
          ctx.fill();
        }
      }
    };

    const tick = (now: number) => {
      if (!paused) {
        elapsed = (now - startTime) / 1000;
        if (elapsed > AUTH_BG_PAINT.loopLength) {
          startTime = now;
          elapsed = 0;
        }
        drawDots();
        drawRoutes(elapsed);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reducedMotion, size.w, size.h]);

  return (
    <div ref={wrapperRef} aria-hidden className="pointer-events-none absolute inset-0">
      {reducedMotion ? (
        staticDots && size.w > 0 ? (
          <svg width={size.w} height={size.h} className="absolute inset-0">
            {staticDots.map((d, i) => (
              <circle
                key={i}
                cx={d.x}
                cy={d.y}
                r={AUTH_BG_PAINT.dotRadius}
                fill={AUTH_BG_PAINT.dotColor(d.opacity)}
              />
            ))}
          </svg>
        ) : null
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}
