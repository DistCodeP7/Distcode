// types/next-auth.d.ts (or at the root)

import { DefaultSession } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";

/**
 * Extends the built-in session.user type to include your custom token.
 */
declare module "next-auth" {
  interface Session {
    user: {
      /** The custom JWT token. */
      token?: string;
    } & DefaultSession["user"]; // Keep the original properties
  }
}

/**
 * Extends the built-in JWT type.
 * This is used in the `jwt` callback on the server.
 */
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    /** The custom JWT token. */
    customToken?: string;
  }
}