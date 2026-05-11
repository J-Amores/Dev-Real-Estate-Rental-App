"use server";

import { ApplicationStatus } from "@prisma/client";
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
  applicationSchema,
  profileSchema,
  propertySchema,
  type ApplicationInput,
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

async function requireTenant(): Promise<
  | { ok: true; userId: string; tenantId: number }
  | { ok: false; error: FormState }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "tenant") {
    return { ok: false, error: { errors: { _form: ["Not authorized"] } } };
  }
  if (typeof session.user.tenantId !== "number") {
    return { ok: false, error: { errors: { _form: ["Tenant profile missing"] } } };
  }
  return { ok: true, userId: session.user.id, tenantId: session.user.tenantId };
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

export type ToggleFavoriteResult =
  | { ok: true; isFavorited: boolean }
  | { ok: false; error: FormState };

export async function toggleFavoriteAction(
  propertyId: number,
): Promise<ToggleFavoriteResult> {
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return { ok: false, error: { errors: { _form: ["Invalid property"] } } };
  }

  const gate = await requireTenant();
  if (!gate.ok) return { ok: false, error: gate.error };

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      favoritedBy: {
        where: { id: gate.tenantId },
        select: { id: true },
      },
    },
  });
  if (!property) {
    return { ok: false, error: { errors: { _form: ["Property not found"] } } };
  }

  const wasFavorited = property.favoritedBy.length > 0;
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      favoritedBy: wasFavorited
        ? { disconnect: { id: gate.tenantId } }
        : { connect: { id: gate.tenantId } },
    },
  });

  revalidatePath("/dashboard/favorites");
  revalidatePath("/search");
  revalidatePath(`/properties/${propertyId}`);

  return { ok: true, isFavorited: !wasFavorited };
}

export async function createApplicationAction(
  propertyId: number,
  input: ApplicationInput,
): Promise<FormState> {
  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return { errors: { _form: ["Invalid property"] } };
  }

  const gate = await requireTenant();
  if (!gate.ok) return gate.error;

  const parsed = applicationSchema.safeParse(input);
  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }
  const v = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { id: true },
  });
  if (!property) {
    return { errors: { _form: ["Property not found"] } };
  }

  const existing = await prisma.application.findFirst({
    where: {
      propertyId,
      tenantId: gate.userId,
      status: { in: [ApplicationStatus.Pending, ApplicationStatus.Approved] },
    },
    select: { id: true, status: true },
  });
  if (existing) {
    return {
      errors: {
        _form: [
          existing.status === ApplicationStatus.Approved
            ? "You've already been approved for this property."
            : "You already have a pending application for this property.",
        ],
      },
    };
  }

  await prisma.application.create({
    data: {
      propertyId,
      tenantId: gate.userId,
      applicationDate: new Date(),
      status: ApplicationStatus.Pending,
      name: v.name,
      email: v.email,
      phoneNumber: v.phoneNumber,
      message: v.message?.length ? v.message : null,
    },
  });

  revalidatePath("/dashboard/applications");
  revalidatePath(`/properties/${propertyId}`);
  return { message: "Application submitted" };
}

export async function updateApplicationStatusAction(
  id: number,
  formData: FormData,
): Promise<void> {
  if (!Number.isInteger(id) || id <= 0) return;

  const status = String(formData.get("status") ?? "");
  if (status !== "Approved" && status !== "Denied") return;

  const gate = await requireManager();
  if (!gate.ok) return;

  const application = await prisma.application.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      tenantId: true,
      propertyId: true,
      property: {
        select: {
          managerId: true,
          pricePerMonth: true,
          securityDeposit: true,
        },
      },
    },
  });
  if (!application || application.property.managerId !== gate.userId) return;
  if (application.status !== ApplicationStatus.Pending) return;

  if (status === "Denied") {
    await prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.Denied },
    });
  } else {
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);

    await prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          propertyId: application.propertyId,
          tenantId: application.tenantId,
          startDate,
          endDate,
          rent: application.property.pricePerMonth,
          deposit: application.property.securityDeposit,
        },
        select: { id: true },
      });
      await tx.application.update({
        where: { id },
        data: {
          status: ApplicationStatus.Approved,
          leaseId: lease.id,
        },
      });
    });
  }

  revalidatePath("/dashboard/applications");
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
