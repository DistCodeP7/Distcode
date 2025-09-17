import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { GenerateJWT } from "@/app/auth/generateJWT";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    })
  ],
  callbacks: {
  async signIn({ user, account }: { user: any; account: any }) {
 
   if (account?.provider === "google" || account?.provider === "github") {
      try {
        const existingUser = await db.query.users.findMany({
          where: eq(users.email, user.email),
        });
        const bcrypt = require("bcrypt");
        const userid = bcrypt.hashSync(user.name + user.id, 10);

        if (!existingUser || existingUser.length === 0) {
          await db.insert(users).values({
            email: user.email,
            name: user.name,
            userid: userid,
            provider: account.provider,
            providerId: user.id,
            password: null,
          });
        }
      } catch (error) {
        return false;
      }
    }
    // Always attach JWT to user object for downstream callbacks
    user.token = GenerateJWT(user.userid);
    return true;
  },

  async jwt({ token, user }: { token: any; user: any }) {
    // If user is present (on sign in), set token
    if (user?.token) {
      token.token = user.token;
    }
    return token;
  },

  async session({ session, token }: { session: any; token: any }) {
    // Always pass token from JWT callback to session
    session.token = token.token;
    return session;
  },
},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };