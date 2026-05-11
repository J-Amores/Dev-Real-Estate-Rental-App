import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        if (user.role === "tenant") {
          const tenant = await prisma.tenant.findUnique({
            where: { userId: user.id! },
            select: { id: true },
          });
          token.tenantId = tenant?.id;
        } else {
          const manager = await prisma.manager.findUnique({
            where: { userId: user.id! },
            select: { id: true },
          });
          token.managerId = manager?.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.tenantId = token.tenantId;
      session.user.managerId = token.managerId;
      return session;
    },
  },
});

/**
 * Returns the signed-in user for a dashboard RSC, redirecting to /signin if missing.
 * Use inside `app/dashboard/**` pages — the layout already gates auth, so this helper
 * is purely for type narrowing and a uniform redirect target.
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  return session.user;
}
