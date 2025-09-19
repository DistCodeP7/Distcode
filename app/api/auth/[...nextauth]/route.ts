import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const existingUser = await getUserByEmail(credentials.email);
        if (!existingUser) {
          return null;
        }
        const bcrypt = require("bcrypt");
        if (bcrypt.compareSync(credentials.password, existingUser.password)) {
          return {
            id: existingUser.userid,
            email: existingUser.email,
            name: existingUser.name,
            userid: existingUser.userid,
            token: GenerateJWT(existingUser.userid),
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
          const existingUser = await getUserByEmail(user.email);
          const bcrypt = require("bcrypt");
          const userid = bcrypt.hashSync(user.name + user.id, 10);
          user.userId = userid;
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
        } catch (error) {
          return false;
        }
      }
      user.token = GenerateJWT(user.userid);
      return true;
    },

    async jwt({ token, user }: { token: any; user: any }) {
      if (user?.token) {
        token.token = user.token;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      session.token = token.token;
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
