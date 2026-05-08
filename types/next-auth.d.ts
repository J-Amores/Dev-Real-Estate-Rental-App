declare module "@auth/core/types" {
  interface User {
    role: import("@prisma/client").UserRole;
  }

  interface Session {
    user: {
      id: string;
      role: import("@prisma/client").UserRole;
      tenantId?: number;
      managerId?: number;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: import("@prisma/client").UserRole;
    tenantId?: number;
    managerId?: number;
  }
}

export {};
