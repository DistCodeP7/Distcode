import NextAuth from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default NextAuth(authOptions).auth;

export const config = {
  matcher: [
    // Protect all routes except API, static files, and login/register
    "/((?!api|_next/static|_next/image|.*\\.png$|auth/login|auth/register).*)",
  ],
};
