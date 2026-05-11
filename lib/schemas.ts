import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().max(30),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const PROPERTY_TYPES = [
  "Apartment",
  "Villa",
  "Townhouse",
  "Cottage",
  "Tinyhouse",
  "Rooms",
] as const;

export const AMENITIES = [
  "WasherDryer",
  "AirConditioning",
  "Dishwasher",
  "HighSpeedInternet",
  "HardwoodFloors",
  "WalkInClosets",
  "Microwave",
  "Refrigerator",
  "Pool",
  "Gym",
  "Parking",
  "PetsAllowed",
  "WiFi",
] as const;

export const HIGHLIGHTS = [
  "HighSpeedInternetAccess",
  "WasherDryer",
  "AirConditioning",
  "Heating",
  "SmokeFree",
  "CableReady",
  "SatelliteTV",
  "DoubleVanities",
  "TubShower",
  "Intercom",
  "SprinklerSystem",
  "RecentlyRenovated",
  "CloseToTransit",
  "GreatView",
  "QuietNeighborhood",
] as const;

export const propertySchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  description: z.string().trim().min(1, "Required").max(4000),
  pricePerMonth: z.number().positive("Must be positive"),
  securityDeposit: z.number().min(0, "Must be 0 or greater"),
  applicationFee: z.number().min(0, "Must be 0 or greater"),
  isPetsAllowed: z.boolean(),
  isParkingIncluded: z.boolean(),
  photoUrls: z
    .array(z.url("Must be a valid URL"))
    .min(1, "Add at least one photo")
    .max(10, "Up to 10 photos"),
  amenities: z.array(z.enum(AMENITIES)),
  highlights: z.array(z.enum(HIGHLIGHTS)),
  beds: z.number().int("Whole number").min(0).max(20),
  baths: z.number().min(0).max(20),
  squareFeet: z.number().int("Whole number").positive("Must be positive"),
  propertyType: z.enum(PROPERTY_TYPES),
  address: z.string().trim().min(1, "Required").max(200),
  city: z.string().trim().min(1, "Required").max(120),
  state: z.string().trim().min(1, "Required").max(120),
  country: z.string().trim().min(1, "Required").max(120),
  postalCode: z.string().trim().min(1, "Required").max(20),
});

export type PropertyInput = z.infer<typeof propertySchema>;

export const applicationSchema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email(),
  phoneNumber: z.string().trim().min(1, "Required").max(30),
  message: z.string().trim().max(1000, "Up to 1000 characters").optional(),
});

export type ApplicationInput = z.infer<typeof applicationSchema>;
