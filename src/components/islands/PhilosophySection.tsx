// Preact island (client:visible) — port of components/sections/philosophy-section.tsx.
// 200vh sticky title rotation (3 texts, rotateX 3D flip) + word-by-word
// blur/opacity reveal of the description, both scroll-driven (rAF-throttled).
import { useCallback, useEffect, useRef, useState } from "preact/hooks";

const titles = [
  "Sustainable Architecture.",
  "Built for Tomorrow.",
  "Eco-Responsible.",
];

const description =
  "A design home that combines contemporary aesthetics and energy performance. Built with eco-friendly materials, it minimizes carbon footprint while offering optimal comfort.";

export function PhilosophySection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [titleOpacity, setTitleOpacity] = useState(0);
  const [descriptionProgress, setDescriptionProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  const updateTransforms = useCallback(() => {
    if (!sectionRef.current) return;

    const rect = sectionRef.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionHeight = sectionRef.current.offsetHeight;

    // Calculate progress based on scroll position
    const scrollableRange = sectionHeight - windowHeight;
    const scrolled = -rect.top;
    const progress = Math.max(0, Math.min(1, scrolled / scrollableRange));

    // Title rotates through 3 texts based on scroll progress
    setTitleOpacity(progress);

    // Description word animation
    if (descriptionRef.current) {
      const descRect = descriptionRef.current.getBoundingClientRect();
      const descTop = descRect.top;
      const descHeight = descRect.height;

      // Start animation when element enters viewport
      const startTrigger = windowHeight * 0.8;
      const endTrigger = windowHeight * 0.2;

      if (descTop < startTrigger && descTop > endTrigger - descHeight) {
        const descProgress = Math.max(
          0,
          Math.min(1, (startTrigger - descTop) / (startTrigger - endTrigger))
        );
        setDescriptionProgress(descProgress);
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(updateTransforms);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateTransforms();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateTransforms]);

  return (
    <section id="products" class="bg-background">
      {/* Scroll-Animated Product Grid */}
      <div ref={sectionRef} class="relative" style={{ height: "200vh" }}>
        <div class="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          <div class="relative w-full max-w-7xl px-4">
            {/* Title - centered with 3D rotation */}
            <div
              class="flex items-center justify-center pointer-events-none"
              style={{ perspective: "1000px" }}
            >
              <div
                class="relative w-full"
                style={{ transformStyle: "preserve-3d", minHeight: "150px" }}
              >
                {titles.map((title, index) => {
                  // Last text stays visible at the end
                  const isLastText = index === titles.length - 1;

                  // Calculate which text should be visible based on scroll progress
                  const segmentSize = 1 / titles.length;
                  const startProgress = index * segmentSize;
                  const endProgress = (index + 1) * segmentSize;

                  let rotateX = 0;
                  let opacity = 0;

                  if (titleOpacity >= startProgress && titleOpacity < endProgress) {
                    // Active text - rotating in
                    const localProgress = (titleOpacity - startProgress) / segmentSize;
                    rotateX = (1 - localProgress) * 90;
                    opacity = localProgress;
                  } else if (titleOpacity >= endProgress) {
                    // Text that has passed - last text stays visible
                    if (isLastText) {
                      rotateX = 0;
                      opacity = 1;
                    } else {
                      rotateX = -90;
                      opacity = 0;
                    }
                  } else {
                    // Text that hasn't appeared yet
                    rotateX = 90;
                    opacity = 0;
                  }

                  return (
                    <h2
                      key={index}
                      class="absolute inset-0 flex items-center justify-center text-[8vw] sm:text-[7vw] font-medium leading-tight tracking-tighter text-foreground md:text-[6vw] lg:text-[5vw] text-center px-4"
                      style={{
                        transform: `rotateX(${rotateX}deg) translateZ(0)`,
                        opacity,
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        willChange: "transform, opacity",
                        WebkitFontSmoothing: "antialiased",
                      }}
                    >
                      {title}
                    </h2>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div
        ref={descriptionRef}
        class="px-6 pt-8 pb-20 md:px-12 md:pt-12 md:pb-28 lg:px-20 lg:pt-16 lg:pb-36"
      >
        <div class="text-center">
          <p class="mt-8 leading-relaxed text-muted-foreground text-3xl text-center">
            {description.split(" ").map((word, index, array) => {
              const wordProgress = Math.max(
                0,
                Math.min(1, descriptionProgress * array.length - index)
              );
              const opacity = wordProgress;
              const blur = (1 - wordProgress) * 40;

              return (
                <span
                  key={index}
                  style={{
                    opacity,
                    filter: `blur(${blur}px)`,
                    transition: "opacity 0.3s ease, filter 0.3s ease",
                  }}
                >
                  {word}
                  {index < array.length - 1 ? " " : ""}
                </span>
              );
            })}
          </p>
        </div>
      </div>
    </section>
  );
}
