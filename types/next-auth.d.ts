// types/next-auth.d.ts
// biome-ignore lint/correctness/noUnusedImports: Need elsewhere
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: null | string | undefined;
    };
    token: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    token: string;
    userid: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    token: string;
    id: string;
  }
}
