import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment NextAuth's Session/User and JWT so `role` and `id` are typed everywhere.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
