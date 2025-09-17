import "next-auth";
import "next-auth/jwt";

// This module declaration is used to extend the default types
// provided by next-auth.

declare module "next-auth/jwt" {
	/**
	 * Returned by the `jwt` callback and `getToken` method.
	 * We are adding our custom token to the JWT object.
	 */
	interface JWT {
		// This adds the 'token' property to the JWT type
		token?: string;
	}
}

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop
	 * on the `SessionProvider` React Context.
	 * We are adding our custom token to the Session object.
	 */
	interface Session {
		// This adds the 'token' property to the Session type
		token?: string;
	}

	/**
	 * The user object returned by the `signIn` callback.
	 * We are adding our custom token to be available in subsequent callbacks.
	 */
	interface User {
		// This allows the 'token' property on the user object in callbacks
		token?: string;
	}
}