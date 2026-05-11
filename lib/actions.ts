"use server";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth, signIn, signOut } from "@/lib/auth";
import { geocodeAddress, geocodeText } from "@/lib/geocoding";
import { prisma } from "@/lib/prisma";
import {
  PROPERTY_TYPES,
  profileSchema,
  propertySchema,
  type PropertyInput,
} from "@/lib/schemas";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "At least 8 characters"),
  username: z.string().min(1),
  role: z.enum(["tenant", "manager"]),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type FormState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const dashboardForRole = (role: "tenant" | "manager") =>
  role === "tenant" ? "/dashboard/favorites" : "/dashboard/properties";

export async function signUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  const { email, password, username, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { errors: { email: ["Email already registered"] } };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, passwordHash, username, role },
    });
    if (role === "tenant") {
      await tx.tenant.create({
        data: { userId: user.id, name: username, email, phoneNumber: "" },
      });
    } else {
      await tx.manager.create({
        data: { userId: user.id, name: username, email, phoneNumber: "" },
      });
    }
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: dashboardForRole(role),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Account created — please sign in." };
    }
    throw error;
  }
  return {};
}

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });
  const redirectTo = user ? dashboardForRole(user.role) : "/dashboard/favorites";

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return { errors: { _form: ["Invalid email or password"] } };
    }
    throw error;
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { errors: { _form: ["Not signed in"] } };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  const data = parsed.data;

  if (session.user.role === "tenant") {
    if (!session.user.tenantId) {
      return { errors: { _form: ["Tenant profile missing"] } };
    }
    await prisma.tenant.update({
      where: { id: session.user.tenantId },
      data,
    });
  } else {
    if (!session.user.managerId) {
      return { errors: { _form: ["Manager profile missing"] } };
    }
    await prisma.manager.update({
      where: { id: session.user.managerId },
      data,
    });
  }

  revalidatePath("/dashboard/settings");
  return { message: "Profile updated" };
}

async function requireManager(): Promise<
  { ok: true; userId: string } | { ok: false; error: FormState }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "manager") {
    return { ok: false, error: { errors: { _form: ["Not authorized"] } } };
  }
  return { ok: true, userId: session.user.id };
}

function toPropertyData(v: PropertyInput) {
  return {
    name: v.name,
    description: v.description,
    pricePerMonth: v.pricePerMonth,
    securityDeposit: v.securityDeposit,
    applicationFee: v.applicationFee,
    isPetsAllowed: v.isPetsAllowed,
    isParkingIncluded: v.isParkingIncluded,
    photoUrls: v.photoUrls,
    amenities: v.amenities,
    highlights: v.highlights,
    beds: v.beds,
    baths: v.baths,
    squareFeet: v.squareFeet,
    propertyType: v.propertyType,
  };
}

export async function createPropertyAction(
  input: PropertyInput,
): Promise<FormState> {
  const gate = await requireManager();
  if (!gate.ok) return gate.error;

  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  const v = parsed.data;

  const coords = await geocodeAddress({
    address: v.address,
    city: v.city,
    state: v.state,
    postalCode: v.postalCode,
    country: v.country,
  });
  if (!coords) {
    return {
      errors: {
        address: ["Couldn't find that address. Check spelling and try again."],
      },
    };
  }

  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: number }[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (
        ${v.address}, ${v.city}, ${v.state}, ${v.country}, ${v.postalCode},
        ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography
      )
      RETURNING id
    `;
    const locationId = rows[0].id;
    await tx.property.create({
      data: {
        ...toPropertyData(v),
        locationId,
        managerId: gate.userId,
      },
    });
  });

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function updatePropertyAction(
  id: number,
  input: PropertyInput,
): Promise<FormState> {
  const gate = await requireManager();
  if (!gate.ok) return gate.error;

  const parsed = propertySchema.safeParse(input);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  const v = parsed.data;

  const existing = await prisma.property.findUnique({
    where: { id },
    select: {
      managerId: true,
      locationId: true,
      location: {
        select: {
          address: true,
          city: true,
          state: true,
          country: true,
          postalCode: true,
        },
      },
    },
  });
  if (!existing || existing.managerId !== gate.userId) {
    return { errors: { _form: ["Property not found"] } };
  }

  const addressChanged =
    existing.location.address !== v.address ||
    existing.location.city !== v.city ||
    existing.location.state !== v.state ||
    existing.location.country !== v.country ||
    existing.location.postalCode !== v.postalCode;

  let coords: { lng: number; lat: number } | null = null;
  if (addressChanged) {
    coords = await geocodeAddress({
      address: v.address,
      city: v.city,
      state: v.state,
      postalCode: v.postalCode,
      country: v.country,
    });
    if (!coords) {
      return {
        errors: {
          address: ["Couldn't find that address. Check spelling and try again."],
        },
      };
    }
  }

  await prisma.$transaction(async (tx) => {
    if (addressChanged && coords) {
      await tx.$executeRaw`
        UPDATE "Location"
        SET address = ${v.address},
            city = ${v.city},
            state = ${v.state},
            country = ${v.country},
            "postalCode" = ${v.postalCode},
            coordinates = ST_SetSRID(ST_MakePoint(${coords.lng}, ${coords.lat}), 4326)::geography
        WHERE id = ${existing.locationId}
      `;
    }
    await tx.property.update({
      where: { id },
      data: {
        ...toPropertyData(v),
        amenities: { set: v.amenities },
        highlights: { set: v.highlights },
      },
    });
  });

  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}/edit`);
  redirect("/dashboard/properties");
}

export async function searchAction(formData: FormData): Promise<void> {
  const params = new URLSearchParams();

  const location = String(formData.get("location") ?? "").trim();
  if (location) {
    params.set("location", location);
    const coords = await geocodeText(location);
    if (coords) {
      params.set("lat", coords.lat.toFixed(6));
      params.set("lng", coords.lng.toFixed(6));
    }
  }

  const numeric = (key: string) => {
    const raw = String(formData.get(key) ?? "").trim();
    if (!raw) return;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) params.set(key, String(n));
  };
  numeric("beds");
  numeric("baths");
  numeric("priceMin");
  numeric("priceMax");

  const propertyType = String(formData.get("propertyType") ?? "").trim();
  if (
    propertyType &&
    (PROPERTY_TYPES as readonly string[]).includes(propertyType)
  ) {
    params.set("propertyType", propertyType);
  }

  const query = params.toString();
  redirect(query ? `/search?${query}` : "/search");
}

export async function deletePropertyAction(id: number): Promise<FormState> {
  const gate = await requireManager();
  if (!gate.ok) return gate.error;

  const existing = await prisma.property.findUnique({
    where: { id },
    select: { managerId: true },
  });
  if (!existing || existing.managerId !== gate.userId) {
    return { errors: { _form: ["Property not found"] } };
  }

  await prisma.$transaction(async (tx) => {
    const leaseIds = (
      await tx.lease.findMany({
        where: { propertyId: id },
        select: { id: true },
      })
    ).map((l) => l.id);
    if (leaseIds.length) {
      await tx.payment.deleteMany({ where: { leaseId: { in: leaseIds } } });
    }
    await tx.application.deleteMany({ where: { propertyId: id } });
    if (leaseIds.length) {
      await tx.lease.deleteMany({ where: { id: { in: leaseIds } } });
    }
    await tx.property.delete({ where: { id } });
  });

  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}
