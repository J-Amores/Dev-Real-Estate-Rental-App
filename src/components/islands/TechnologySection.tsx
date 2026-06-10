// Preact island (client:visible) — port of components/sections/technology-section.tsx.
// 400vh sticky choreography: title cycles 3 texts (word blur in/out), layered
// mono-1..4 day-cycle crossfade, side columns slide in; followed by the black
// scroll-reveal description block.
import { useEffect, useRef, useState } from "preact/hooks";

function ScrollRevealText({ text }: { text: string }) {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Slower animation - more viewport range
      const startOffset = windowHeight * 0.9;
      const endOffset = windowHeight * 0.1;

      const totalDistance = startOffset - endOffset;
      const currentPosition = startOffset - rect.top;

      const newProgress = Math.max(0, Math.min(1, currentPosition / totalDistance));
      setProgress(newProgress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const words = text.split(" ");

  return (
    <p
      ref={containerRef}
      class="text-3xl font-semibold leading-snug text-white md:text-4xl lg:text-5xl"
    >
      {words.map((word, index) => {
        const appearProgress = progress * (words.length + 1);
        const wordAppearProgress = Math.max(0, Math.min(1, appearProgress - index));
        const wordOpacity = wordAppearProgress;
        const wordBlur = (1 - wordAppearProgress) * 40;

        return (
          <span
            key={index}
            class="inline-block"
            style={{
              opacity: wordOpacity,
              filter: `blur(${wordBlur}px)`,
              transition: "opacity 0.1s linear, filter 0.1s linear",
              marginRight: "0.3em",
            }}
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}

const sideImages = [
  {
    src: "/images/interior-view.png",
    alt: "Interior view with landscape",
    position: "left",
  },
  {
    src: "/images/rusted-metal.png",
    alt: "Rusted metal texture",
    position: "right",
  },
];

const textCycles = [
  "Design & Sustainability.",
  "Passive Energy.",
  "Bio-sourced Construction.",
];

export function TechnologySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const textSectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const descriptionText =
    "Passive architecture reimagining modern living. Triple glazing, reinforced insulation and natural ventilation combine with solar panels to create an energy-autonomous home. Bio-sourced materials like solid wood and hemp wool ensure healthy indoor air and minimal ecological footprint.";

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const scrollableHeight = window.innerHeight * 4; // Increased for 3 text cycles
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

  // Title fades out first (0 to 0.2)
  // Image transforms start after title fades (0.2 to 1)
  const imageProgress = Math.max(0, Math.min(1, (scrollProgress - 0.2) / 0.8));

  // Smooth interpolations
  const centerWidth = 100 - imageProgress * 58; // 100% to 42%
  const sideWidth = imageProgress * 22; // 0% to 22%
  const sideOpacity = imageProgress;
  const sideTranslateLeft = -100 + imageProgress * 100; // -100% to 0%
  const sideTranslateRight = 100 - imageProgress * 100; // 100% to 0%
  const gap = imageProgress * 16; // 0px to 16px

  return (
    <section ref={sectionRef} class="relative bg-foreground">
      {/* Sticky container for scroll animation */}
      <div class="sticky top-0 h-screen overflow-hidden">
        <div class="flex h-full w-full items-center justify-center">
          {/* Bento Grid Container */}
          <div
            class="relative flex h-full w-full items-stretch justify-center"
            style={{ gap: `${gap}px`, padding: `${imageProgress * 16}px` }}
          >
            {/* Left Column */}
            <div
              class="relative overflow-hidden will-change-transform"
              style={{
                width: `${sideWidth}%`,
                height: "100%",
                transform: `translateX(${sideTranslateLeft}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "left")
                .map((img, idx) => (
                  <img
                    key={idx}
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                ))}
            </div>

            {/* Main Center Image */}
            <div
              class="relative overflow-hidden will-change-transform"
              style={{
                width: `${centerWidth}%`,
                height: "100%",
                flex: "0 0 auto",
              }}
            >
              {/* Layered Images - Progressive Fade In */}
              {/* Image 1 - Base layer - Sunrise/Sunset with sun rays */}
              <img
                src="/images/mono-1.png"
                alt="Modern architecture at sunrise"
                class="absolute inset-0 h-full w-full object-cover"
              />

              {/* Image 2 - Daytime scene - Fades in during first text cycle */}
              <img
                src="/images/mono-2.png"
                alt="Modern architecture in daylight"
                class="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: Math.max(0, Math.min(1, (scrollProgress - 0.1) / 0.2)),
                  transition: "opacity 0.3s ease",
                }}
              />

              {/* Image 3 - Dusk/Evening - Fades in during second text cycle */}
              <img
                src="/images/mono-3.png"
                alt="Modern architecture at dusk"
                class="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: Math.max(0, Math.min(1, (scrollProgress - 0.4) / 0.2)),
                  transition: "opacity 0.3s ease",
                }}
              />

              {/* Image 4 - Night with stars - Fades in during third text cycle */}
              <img
                src="/images/mono-4.png"
                alt="Modern architecture at night"
                class="absolute inset-0 h-full w-full object-cover"
                style={{
                  opacity: Math.max(0, Math.min(1, (scrollProgress - 0.7) / 0.2)),
                  transition: "opacity 0.3s ease",
                }}
              />

              <div class="absolute inset-0 bg-foreground/40" />

              {/* Title Text - Cycles through 3 texts with blur effect */}
              <div class="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                {textCycles.map((text, cycleIndex) => {
                  // Each text cycle takes 1/3 of the scroll progress
                  const cycleStart = cycleIndex / textCycles.length;
                  const cycleEnd = (cycleIndex + 1) / textCycles.length;

                  const words = text.split(" ");

                  return (
                    <h2
                      key={cycleIndex}
                      class="absolute max-w-3xl font-medium leading-tight tracking-tight text-white md:text-5xl lg:text-7xl text-5xl"
                    >
                      {words.map((word, wordIndex) => {
                        let wordOpacity = 0;
                        let wordBlur = 40;

                        if (scrollProgress >= cycleStart && scrollProgress < cycleEnd) {
                          const localProgress =
                            (scrollProgress - cycleStart) / (cycleEnd - cycleStart);

                          // First half: appear (blur 40→0, opacity 0→1)
                          if (localProgress < 0.5) {
                            const appearProgress =
                              (localProgress / 0.5) * (words.length + 1);
                            const wordAppearProgress = Math.max(
                              0,
                              Math.min(1, appearProgress - wordIndex)
                            );
                            wordOpacity = wordAppearProgress;
                            wordBlur = (1 - wordAppearProgress) * 40;
                          }
                          // Second half: disappear (blur 0→40, opacity 1→0)
                          else {
                            const disappearProgress =
                              ((localProgress - 0.5) / 0.5) * (words.length + 1);
                            const wordDisappearProgress = Math.max(
                              0,
                              Math.min(1, disappearProgress - wordIndex)
                            );
                            wordOpacity = 1 - wordDisappearProgress;
                            wordBlur = wordDisappearProgress * 40;
                          }
                        }

                        return (
                          <span
                            key={wordIndex}
                            class="inline-block"
                            style={{
                              opacity: wordOpacity,
                              filter: `blur(${wordBlur}px)`,
                              transition: "opacity 0.1s linear, filter 0.1s linear",
                              marginRight: "0.3em",
                            }}
                          >
                            {word}
                          </span>
                        );
                      })}
                    </h2>
                  );
                })}
              </div>
            </div>

            {/* Right Column */}
            <div
              class="relative overflow-hidden will-change-transform"
              style={{
                width: `${sideWidth}%`,
                height: "100%",
                transform: `translateX(${sideTranslateRight}%)`,
                opacity: sideOpacity,
              }}
            >
              {sideImages
                .filter((img) => img.position === "right")
                .map((img, idx) => (
                  <img
                    key={idx}
                    src={img.src || "/placeholder.svg"}
                    alt={img.alt}
                    class="absolute inset-0 h-full w-full object-cover"
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll space to enable animation - increased for 3 text cycles */}
      <div class="h-[400vh]" />

      {/* Description Section with Background Image and Scroll Reveal */}
      <div
        ref={textSectionRef}
        class="relative overflow-hidden px-6 py-24 md:px-12 md:py-32 lg:px-20 lg:py-40 bg-black"
      >
        {/* Gradient Overlay - Top to transparent */}
        <div
          class="absolute top-0 left-0 right-0 z-0 pointer-events-none"
          style={{
            height: "150px",
            background:
              "linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)",
          }}
        />

        {/* Text Content */}
        <div class="relative z-10 mx-auto max-w-4xl">
          <ScrollRevealText text={descriptionText} />
        </div>
      </div>
    </section>
  );
}
