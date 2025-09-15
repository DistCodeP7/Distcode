"use server";

import { GenerateJWT } from "./generateJWT";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

export async function onRegister(data: FormData) {
    const email = data.get("email")?.toString();
    const name = data.get("name")?.toString();
    const password = data.get("password")?.toString();
    const confirmPassword = data.get("confirmPassword")?.toString();

    if (!email || !name || !password || !confirmPassword) {
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

    try {
        await db.insert(users).values({
            email: email!,
            name: name!,
            password: password!,
        });
        const token = GenerateJWT(email); 
        console.log("Registering user:", { email, password, confirmPassword });
        return { success: true, token: token };
    } catch (error: any) {
        if (error.code === '23505') { // Unique violation
            return { success: false, error: "Email already registered" };
        }
        return { success: false, error: error.message || "Registration failed" };
    }
}

export async function onLogin(data: FormData) {
    const email = data.get("email")?.toString();
    const password = data.get("password")?.toString();
    
    if (!email || !password) {
        return { success: false, error: "Email and password are required" };
    }

    const user = await db.select().from(users).where(and(eq(users.email, email), eq(users.password, password))).limit(1);
if (!user || user.length === 0) {
    return { success: false, error: "Invalid email or password" };
}
    const token = GenerateJWT(email);
    return { success: true, token: token };
}