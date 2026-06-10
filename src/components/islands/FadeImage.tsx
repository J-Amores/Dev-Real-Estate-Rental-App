// Smallest Preact island — port of components/fade-image.tsx.
// IntersectionObserver + load-state fade (opacity/scale 1.02→1, 700ms).
// Replaces the next/image `fill` usage with an absolutely-positioned <img>.
import { useEffect, useRef, useState } from "preact/hooks";

interface FadeImageProps {
  src: string;
  alt: string;
  class?: string;
  fadeDelay?: number;
}

export function FadeImage({ src, alt, class: className, fadeDelay = 0 }: FadeImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // The image may already be complete (cache) before hydration runs.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, fadeDelay);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [fadeDelay]);

  return (
    <div ref={ref} class="relative h-full w-full">
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        class={`absolute inset-0 h-full w-full ${className || ""} transition-all duration-700 ease-out ${
          isVisible && isLoaded ? "opacity-100 scale-100" : "opacity-0 scale-[1.02]"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  );
}
