"use server";

import { GenerateJWT } from "./generateJWT";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function onRegister(credentials: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const { email, password, firstName, lastName } = credentials;
  const name = `${firstName} ${lastName}`;

  if (!email || !password || !firstName || !lastName) {
    return { success: false, error: "All fields are required" };
  }

  const bcrypt = require("bcrypt");
  const userid = bcrypt.hashSync(name + email, 10);
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.insert(users).values({
    email: email,
    name: name,
    userid: userid,
    password: hashedPassword,
    provider: "credentials",
  });

  const user = {
    email: email,
    name: name,
    password: hashedPassword,
    id: userid,
  };
  return { success: true, user };
}
