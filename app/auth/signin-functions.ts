"use server";

import { GenerateJWT } from "./generateJWT";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function onRegister(data: FormData) {
    const email = data.get("email")?.toString().toLowerCase();
    const name = data.get("name")?.toString();
    const password = data.get("password")?.toString();
    const confirmPassword = data.get("confirmPassword")?.toString();
    const bcrypt = require('bcrypt');

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

    const userid = bcrypt.hashSync(name + email, 10);

    try {
        const hashedPassword = await bcrypt.hash(password!, 10);
        await db.insert(users).values({
            email: email,
            name: name!,
            userid: userid,
            password: hashedPassword,
        });
        const token = GenerateJWT(userid);
        return { success: true, token: token };
    } catch (error: any) {
        return { success: false, error: error.message || "Registration failed" };
    }
}


export async function onLogin(data: FormData) {
    const email = data.get("email")?.toString().toLowerCase();
    const password = data.get("password")?.toString();
    const bcrypt = require('bcrypt');
    
    if (!email || !password) {
        return { success: false, error: "Email and password are required" };
    }

    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user || user.length === 0 || !bcrypt.compareSync(password, user[0].password)) {
        return { success: false, error: "Invalid email or password" };
    }
    const token = GenerateJWT(user[0].userid);
    return { success: true, token: token };
}