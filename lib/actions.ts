"use server";

import bcrypt from "bcrypt";
import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth, signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/schemas";

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
