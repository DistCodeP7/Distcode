import { withAuth } from "next-auth/middleware";
import { getUserByEmail, getUserById } from "./lib/user";
import { getServerSession } from "next-auth";
import { authOptions } from "./app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";

export default withAuth(function middleware() {}, {
  callbacks: {
    authorized: async () => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user.id) {
        return false;
      }
      try {
        const user = await getUserById(session.user.id);
        if (!user) {
          return false;
        }
        return true;
      } catch (_e) {
        return false;
      }
    },
  },
  pages: {
    signIn: "/auth/signout", //For some reason authorized when return false calls signIn
    error: "/api/auth/signout",
    signOut: "/auth/login",
  },
});

export const config = {
  matcher: ["/authorized/:path*"],
};
