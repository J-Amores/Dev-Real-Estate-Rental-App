const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT =
  "Dev-Real-Estate-Rental-App/1.0 (+https://dev-real-estate-rental-app.vercel.app)";

export type GeocodeInput = {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type GeocodeResult = { lng: number; lat: number };

export async function geocodeAddress(
  input: GeocodeInput,
): Promise<GeocodeResult | null> {
  const q = [input.address, input.city, input.state, input.postalCode, input.country]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(", ");
  if (!q) return null;

  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(q)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    return null;
  }
  if (!res.ok) return null;

  const body = (await res.json()) as Array<{ lat: string; lon: string }>;
  const hit = body[0];
  if (!hit) return null;

  const lat = Number.parseFloat(hit.lat);
  const lng = Number.parseFloat(hit.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lng, lat };
}
