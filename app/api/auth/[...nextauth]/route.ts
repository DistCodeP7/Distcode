import NextAuth, { type Account, type Session, type User } from "next-auth";
import type { AdapterUser } from "next-auth/adapters";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { GenerateJWT } from "@/app/auth/generateJWT";
import { createUserWithOAuth, getUserByEmail } from "@/lib/user";

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
        if (!credentials?.email || !credentials?.password) return null;

        const existingUser = await getUserByEmail(credentials.email);
        if (!existingUser) return null;

        const bcrypt = require("bcrypt");
        const valid = bcrypt.compareSync(
          credentials.password,
          existingUser.password
        );
        if (!valid) return null;

        return {
          id: existingUser.userid,
          userid: existingUser.userid,
          name: existingUser.name,
          email: existingUser.email,
          token: GenerateJWT(existingUser.userid),
        };
      },
    }),
  ],
  callbacks: {
    async signIn({
      user,
      account,
    }: {
      user: User | AdapterUser;
      account: Account | null;
    }) {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const existingUser = await getUserByEmail(user.email);
          const bcrypt = require("bcrypt");
          const userid = bcrypt.hashSync(user.name + user.id, 10);
          user.userid = userid;
          if (!existingUser) {
            await createUserWithOAuth({
              email: user.email,
              name: user.name,
              password: null,
              userid: userid,
              provider: account.provider,
              providerId: user.id,
            });
          }
        } catch (_error) {
          return false;
        }
      }
      user.token = GenerateJWT(user.userid);
      return true;
    },

    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user?.token) {
        token.token = user.token;
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      session.token = token.token;
      session.user.id = token.id;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
