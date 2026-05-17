"use client";

import { useCallback, useEffect, useRef } from "react";
import type * as React from "react";
import createGlobe from "cobe";

import type { PolaroidMarker as Marker } from "@/lib/landing-markers";

import { PolaroidMarker as PolaroidLink } from "./polaroid-marker";

function PolaroidWithMorph({ marker }: { marker: Marker }) {
  const onPointerDownCapture: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const root = e.currentTarget;
    const img = root.querySelector("img");
    if (img) {
      img.style.viewTransitionName = `polaroid-${marker.id}`;
      requestAnimationFrame(() => {
        // Cleared best-effort after the route transition; if the browser does
        // not support View Transitions, the name persists on a now-unmounted
        // node and causes no harm.
        setTimeout(() => {
          if (img.isConnected) img.style.viewTransitionName = "";
        }, 600);
      });
    }
  };
  return (
    <div onPointerDownCapture={onPointerDownCapture}>
      <PolaroidLink
        marker={marker}
        withVisibilityProps
        hrefOverride={`/signin?city=${marker.id}`}
      />
    </div>
  );
}

type Props = {
  markers: readonly Marker[];
  /** Auto-rotation speed in radians per frame. */
  speed?: number;
};

/**
 * Cobe-driven WebGL globe with polaroid overlays positioned each frame from the
 * same lat/lng → screen projection cobe uses internally. CSS Anchor Positioning
 * cannot work here because cobe paints markers as canvas pixels, not DOM nodes.
 * Pauses requestAnimationFrame while the tab is hidden. Pointer-drag pauses
 * auto-rotate; pointer-up commits the drag offset.
 */
export function GlobeClient({ markers, speed = 0.003 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const polaroidRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const setPolaroidRef = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (el) polaroidRefs.current.set(id, el);
      else polaroidRefs.current.delete(id);
    },
    [],
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let phi = 0;

    function init() {
      const cssWidth = canvas.offsetWidth;
      if (cssWidth === 0 || globe) return;

      // cobe's shader normalizes gl_FragCoord (buffer pixels) by the `w` uniform,
      // which it sets from these width/height props. To render the sphere centered
      // and full-size, pass buffer dimensions (CSS × devicePixelRatio), not CSS.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const bufferWidth = cssWidth * dpr;

      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: bufferWidth,
        height: bufferWidth,
        phi: 0,
        theta: 0.2,
        dark: 0,
        diffuse: 1.2,
        mapSamples: 16000,
        mapBrightness: 6,
        baseColor: [0.96, 0.95, 0.93],
        markerColor: [0.13, 0.4, 0.3],
        glowColor: [0.91, 0.95, 0.93],
        markers: markers.map((m) => ({
          location: m.location,
          size: 0.05,
        })),
        onRender: (state) => {
          if (!isPausedRef.current) phi += speed;
          const currentPhi = phi + phiOffsetRef.current + dragOffset.current.phi;
          const currentTheta =
            0.2 + thetaOffsetRef.current + dragOffset.current.theta;
          state.phi = currentPhi;
          state.theta = currentTheta;

          // Match cobe's exact world→screen projection (derived from its
          // fragment shader). Sphere has NDC radius 0.8, so pixel coords use
          // half * 0.8 as the scale factor.
          const half = canvas.offsetWidth / 2;
          const cosT = Math.cos(currentTheta);
          const sinT = Math.sin(currentTheta);

          for (const m of markers) {
            const el = polaroidRefs.current.get(m.id);
            if (!el) continue;
            const lat = (m.location[0] * Math.PI) / 180;
            const lng = (m.location[1] * Math.PI) / 180;
            const cosLat = Math.cos(lat);
            const sinLat = Math.sin(lat);
            const angle = lng + currentPhi;
            const cosA = Math.cos(angle);
            const sinA = Math.sin(angle);

            const lx = cosLat * cosA;
            const ly = cosT * sinLat + sinT * cosLat * sinA;
            const lz = sinT * sinLat - cosT * cosLat * sinA;

            const px = half + lx * 0.8 * half;
            const pyPx = half - ly * 0.8 * half;

            const visibility = Math.max(0, Math.min(1, lz / 0.3));

            el.style.transform = `translate3d(${px}px, ${pyPx}px, 0) translate(-50%, -100%)`;
            el.style.opacity = "1";
            el.style.setProperty(
              `--cobe-visible-${m.id}`,
              String(visibility),
            );
          }
        },
      });

      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        const first = entries[0];
        if (first && first.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (globe) globe.destroy();
    };
  }, [markers, speed]);

  return (
    <div className="relative aspect-square w-full select-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive globe showing rental locations in six cities"
        onPointerDown={handlePointerDown}
        style={{
          display: "block",
          width: "100%",
          aspectRatio: "1 / 1",
          cursor: "grab",
          opacity: 0,
          transition: "opacity 1200ms ease",
          borderRadius: "50%",
          touchAction: "none",
        }}
      />
      {markers.map((m) => (
        <div
          key={m.id}
          ref={setPolaroidRef(m.id)}
          className="hidden sm:flex absolute pointer-events-none flex-col items-center"
          style={{
            top: 0,
            left: 0,
            opacity: 0,
            willChange: "transform, opacity",
          }}
        >
          <div className="pointer-events-auto">
            <PolaroidWithMorph marker={m} />
          </div>
          <span
            aria-hidden="true"
            style={{
              display: "block",
              width: "1px",
              height: "28px",
              marginTop: "2px",
              background: "var(--color-hairline)",
              opacity: `var(--cobe-visible-${m.id}, 0)`,
            }}
          />
        </div>
      ))}

      <ul className="sm:hidden absolute left-0 right-0 -bottom-12 flex flex-wrap justify-center gap-x-3 gap-y-1 text-caption text-ink-soft">
        {markers.map((m) => (
          <li key={m.id}>
            <a
              href={`/signin?city=${m.id}`}
              className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-evergreen focus-visible:outline-offset-2"
            >
              {m.caption}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default GlobeClient;
