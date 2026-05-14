export type PolaroidMarker = {
  id: string;
  /** [lat, lng] in degrees. lat ∈ [-90, 90], lng ∈ [-180, 180]. */
  location: [number, number];
  /** Public-served image path. */
  image: string;
  /** Display caption beneath the image. */
  caption: string;
  /** Frame tilt in degrees, kept within ±8 for visual balance. */
  rotate: number;
  /** Destination on polaroid click. */
  href: string;
};

export const LANDING_MARKERS: readonly PolaroidMarker[] = [
  {
    id: "tokyo",
    location: [35.68, 139.65],
    image: "/landing-globe/tokyo.jpg",
    caption: "Tokyo",
    rotate: -5,
    href: "/search?location=Tokyo",
  },
  {
    id: "lisbon",
    location: [38.72, -9.14],
    image: "/landing-globe/lisbon.jpg",
    caption: "Lisbon",
    rotate: 4,
    href: "/search?location=Lisbon",
  },
  {
    id: "new-york",
    location: [40.71, -74.01],
    image: "/landing-globe/new-york.jpg",
    caption: "New York",
    rotate: -3,
    href: "/search?location=New+York",
  },
  {
    id: "cape-town",
    location: [-33.92, 18.42],
    image: "/landing-globe/cape-town.jpg",
    caption: "Cape Town",
    rotate: 6,
    href: "/search?location=Cape+Town",
  },
  {
    id: "sydney",
    location: [-33.87, 151.21],
    image: "/landing-globe/sydney.jpg",
    caption: "Sydney",
    rotate: -4,
    href: "/search?location=Sydney",
  },
  {
    id: "mexico-city",
    location: [19.43, -99.13],
    image: "/landing-globe/mexico-city.jpg",
    caption: "Mexico City",
    rotate: 3,
    href: "/search?location=Mexico+City",
  },
] as const;
