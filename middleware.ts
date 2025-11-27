import { getServerSession } from "next-auth";
import { withAuth } from "next-auth/middleware";
import { authOptions } from "./app/api/auth/[...nextauth]/route";
import { getUserById } from "./lib/user";

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
    signIn: "/auth/signout",
    error: "/api/auth/signout",
    signOut: "/auth/login",
  },
});

export const config = {
  matcher: ["/authorized/:path*"],
};
