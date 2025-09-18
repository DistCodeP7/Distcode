import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";
import { GenerateJWT } from "@/app/auth/generateJWT";
import { onRegister } from "@/app/auth/signin-functions";
import { credentials } from "amqplib";
import { decrypt } from "dotenv";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    GitHubProvider({
      clientId: process.env.GLITHUB_CLIENT_ID as string,
      clientSecret: process.env.GLITHUB_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("Login in");
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const existingUser = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email));
        if (!existingUser || existingUser.length === 0) {
          return null;
        }
        const bcrypt = require("bcrypt");
        if (
          bcrypt.compareSync(credentials.password, existingUser[0].password)
        ) {
          return {
            id: existingUser[0].userid,
            email: existingUser[0].email,
            name: existingUser[0].name,
            userid: existingUser[0].userid,
            token: GenerateJWT(existingUser[0].userid),
          };
        }

        return null;
      },
    }),
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
          user.userId = userid;
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
  }, // End of callbacks
}; // End of authOptions

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
