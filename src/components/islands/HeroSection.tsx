// Preact island (client:load) — port of components/sections/hero-section.tsx.
// Sticky 200vh scroll choreography: MONO letter stagger (slideUp keyframe from
// globals.css), text fades over progress 0–0.2, center image shrinks 100%→20%
// while side columns slide in from ±100% and gap grows 0→8px.
import { useEffect, useRef, useState } from "preact/hooks";

const word = "MONO";

const sideImages = [
  {
    src: "/images/hero-side-1.png",
    alt: "Modern architecture with corten steel",
    position: "left",
    span: 1,
  },
  {
    src: "/images/hero-side-2.png",
    alt: "Aerial view of modern home",
    position: "left",
    span: 1,
  },
  {
    src: "/images/hero-side-3.png",
    alt: "Interior view with landscape",
    position: "right",
    span: 1,
  },
  {
    src: "/images/hero-side-4.png",
    alt: "Modern architecture at night",
    position: "right",
    span: 1,
  },
];

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * 2;
      const scrolled = -rect.top;
      const progress = Math.max(0, Math.min(1, scrolled / scrollableHeight));

      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Text fades out first (0 to 0.2)
  const textOpacity = Math.max(0, 1 - scrollProgress / 0.2);

  // Image transforms start after text fades (0.2 to 1)
  const imageProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));

  // Smooth interpolations - More balanced distribution
  const centerWidth = 100 - imageProgress * 80; // 100% to 20% (same as each side image)
  const centerHeight = 100; // Always 100% height
  const sideWidth = imageProgress * 40; // 0% to 40% (20% per image, 2 images = 40%)
  const sideOpacity = imageProgress;
  const sideTranslateLeft = -100 + imageProgress * 100; // -100% to 0%
  const sideTranslateRight = 100 - imageProgress * 100; // 100% to 0%
  const borderRadius = 0; // No border radius
  const gap = imageProgress * 8; // 0px to 8px

  // Vertical offset for side columns to move them up on mobile
  const sideTranslateY = -(imageProgress * 15); // Move up by 15% when fully expanded

  return (
    <section id="hero" ref={sectionRef} class="relative bg-background">
      {/* Sticky container for scroll animation */}
      <div class="sticky top-0 h-screen overflow-hidden">
        <div class="flex h-full w-full items-center justify-center">
          {/* Bento Grid Container */}
          <div
            class="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: `${gap}px` }}
          >
            {/* Left Column */}
            <div
              class="flex h-full flex-row will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateLeft}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "left")
                .map((img, idx) => (
                  <div
                    key={idx}
                    class="relative h-full overflow-hidden will-change-transform"
                    style={{
                      flex: img.span,
                      borderRadius: `${borderRadius}px`,
                    }}
                  >
                    <img
                      src={img.src || "/placeholder.svg"}
                      alt={img.alt}
                      class="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
            </div>

            {/* Main Hero Image - Center */}
            <div
              class="relative overflow-hidden will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: `${centerHeight}%`,
                flex: "0 0 auto",
                borderRadius: `${borderRadius}px`,
              }}
            >
              {/* Text Behind - Fades out first */}
              <div
                class="absolute inset-0 z-0 flex items-center justify-center"
                style={{ opacity: textOpacity, transform: "translateY(-200px)" }}
              >
                <h1 class="whitespace-nowrap text-[35vw] font-bold leading-[0.8] tracking-tighter text-black">
                  {word.split("").map((letter, index) => (
                    <span
                      key={index}
                      class="inline-block animate-[slideUp_0.8s_ease-out_forwards] opacity-0"
                      style={{
                        animationDelay: `${index * 0.08}s`,
                        transition: "all 1.5s",
                        transitionTimingFunction: "cubic-bezier(0.86, 0, 0.07, 1)",
                      }}
                    >
                      {letter}
                    </span>
                  ))}
                </h1>
              </div>

              <img
                src="/images/hero-mono.png"
                alt="Modern architectural structure with reflection"
                class="absolute inset-0 z-10 h-full w-full object-cover"
                loading="eager"
                fetchpriority="high"
              />
            </div>

            {/* Right Column */}
            <div
              class="flex h-full flex-row will-change-transform"
              style={{
                width: `${sideWidth}%`,
                gap: `${gap}px`,
                transform: `translateX(${sideTranslateRight}%) translateY(${sideTranslateY}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "right")
                .map((img, idx) => (
                  <div
                    key={idx}
                    class="relative h-full overflow-hidden will-change-transform"
                    style={{
                      flex: img.span,
                      borderRadius: `${borderRadius}px`,
                    }}
                  >
                    <img
                      src={img.src || "/placeholder.svg"}
                      alt={img.alt}
                      class="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tagline Section - Fixed at bottom */}
      <div
        class="pointer-events-none fixed bottom-0 left-0 right-0 z-10 px-6 pb-12 md:px-12 md:pb-16 lg:px-20 lg:pb-20"
        style={{ opacity: textOpacity }}
      >
        <p class="mx-auto max-w-2xl text-center text-2xl leading-relaxed text-white md:text-3xl lg:text-[2.5rem] lg:leading-snug">
          Lightweight, durable
          <br />
          and adventure-ready.
        </p>
      </div>

      {/* Scroll space to enable animation */}
      <div class="h-[200vh]" />
    </section>
  );
}
