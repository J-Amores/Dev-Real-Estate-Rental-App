"use client";

import { useCallback, useEffect, useRef } from "react";
import createGlobe from "cobe";

import type { PolaroidMarker as Marker } from "@/lib/landing-markers";

import { PolaroidMarker as PolaroidLink } from "./polaroid-marker";

type Props = {
  markers: readonly Marker[];
  /** Auto-rotation speed in radians per frame. */
  speed?: number;
};

/**
 * Cobe-driven WebGL globe with CSS-Anchor-Positioned polaroid overlays. Mounted only
 * when motion is allowed. Pauses requestAnimationFrame while the tab is hidden.
 * Pointer-drag pauses auto-rotate; pointer-up commits the drag offset.
 */
export function GlobeClient({ markers, speed = 0.003 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

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
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
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
          size: 0.02,
        })),
        onRender: (state) => {
          if (!isPausedRef.current) phi += speed;
          state.phi = phi + phiOffsetRef.current + dragOffset.current.phi;
          state.theta = 0.2 + thetaOffsetRef.current + dragOffset.current.theta;
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
    <div className="relative aspect-square h-full w-full select-none">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="Interactive globe showing rental locations in six cities"
        onPointerDown={handlePointerDown}
        style={{
          width: "100%",
          height: "100%",
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
          className="hidden sm:block absolute pointer-events-auto"
          style={{
            positionAnchor: `--cobe-${m.id}`,
            bottom: "anchor(top)",
            left: "anchor(center)",
            translate: "-50% 0",
            marginBottom: 8,
          }}
        >
          <PolaroidLink marker={m} withVisibilityProps />
        </div>
      ))}

      <ul className="sm:hidden absolute left-0 right-0 -bottom-12 flex flex-wrap justify-center gap-x-3 gap-y-1 text-caption text-ink-soft">
        {markers.map((m) => (
          <li key={m.id}>
            <a
              href={m.href}
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
