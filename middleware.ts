import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
});

export const config = {
  matcher: ["/authorized/:path*"],
};
