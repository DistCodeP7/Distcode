"use client";
import React from "react";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  email: z.email("Please enter a valid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

export type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const methods = useForm<LoginForm>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });
  const {
    control,
    formState: { isSubmitting, isValid },
    getValues,
  } = methods;

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl border bg-card shadow-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

        <Form {...methods}>
          <form className="space-y-5">
            <FormField
              control={control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              disabled={!isValid || isSubmitting}
              className="w-full"
              onClick={() => {
                const values = getValues();
                signIn("credentials", {
                  email: values.email,
                  password: values.password,
                  callbackUrl: "/authorized/editor",
                });
              }}
            >
              Login
            </Button>

            <Button
              type="button"
              onClick={() => {
                signIn("google", { callbackUrl: "/authorized/editor" });
              }}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.5rem",
                background: "#4285F4",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Login with Google
            </Button>
            <Button
              type="button"
              onClick={() => {
                signIn("github", {
                  callbackUrl: "/authorized/editor",
                });
              }}
              style={{
                marginTop: "1rem",
                width: "100%",
                padding: "0.5rem",
                background: "#333",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Login with GitHub
            </Button>
          </form>
        </Form>

        <p className="text-sm text-muted-foreground mt-4 text-center">
          Don’t have an account?{" "}
          <Link
            href="/auth"
            className="font-medium text-primary hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </>
  );
}
