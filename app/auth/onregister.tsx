"use server";

import { GenerateJWT } from "./generateJWT";

export async function onRegister(data: FormData) {
  const email = data.get("email")?.toString();
  const password = data.get("password")?.toString();
  const confirmPassword = data.get("confirmPassword")?.toString();

    if (!email || !password || !confirmPassword) {
        return { success: false, error: "All fields are required" };
    }
    if (password !== confirmPassword) {
        return { success: false, error: "Passwords do not match" };
    }
    if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" };
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        return { success: false, error: "Invalid email address" };
    }



    // Add your registration logic here, e.g., save to database
    const token = GenerateJWT(email); // Placeholder for JWT generation logic
    console.log("Registering user:", { email, password, confirmPassword });
    return { success: true, token: token };
}
