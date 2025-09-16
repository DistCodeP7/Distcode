import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
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
  ],
  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (!user?.email) {
        console.error("Sign in failed, user has no email.");
        return false;
      }

      if (account?.provider === "google") {
        try {
          const existingUser = await db.query.users.findMany({
            where: eq(users.email, user.email),
          });

          if (!existingUser || existingUser.length === 0) {
            console.log(`User ${user.email} not found. Creating...`);
            await db.insert(users).values({
              email: user.email,
              name: user.name,
              provider: "google",
              providerId: user.id, 
              password: null, 
            });
            console.log(`User ${user.email} created successfully.`);
          } else {
            console.log(`User ${user.email} already exists.`);
          }
        } catch (error) {
          console.error("Error during signIn callback:", error);
          return false;
        }
      }
      user.customToken = GenerateJWT(user.email);
      return true;
    },
    async jwt({ token, user }: { token: any ; user: any }) {
      if (user) {
        token.customToken = user.customToken;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token && session.user) {
        session.user.token = token.customToken;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };