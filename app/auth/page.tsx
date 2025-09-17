"use client";

import React from "react";
import {useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useMemo } from "react";
import { onRegister } from "./signin-functions";
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
import { Progress } from "@/components/ui/progress";

const schema = z
  .object({
    email: z.email("Please enter a valid email address").trim(),
    firstName: z
      .string()
      .trim()
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string()
      .trim()
      .min(2, "Last name must be at least 2 characters"),
    password: z
      .string()
      .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/, {
        message:
          "The password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      }),
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }
  });

export type RegisterForm = z.infer<typeof schema>;

function calculateStrength(password: string): number {
  let score = 0;

  if (!password) return score;
  if (password.length >= 8) score += 25;
  if (password.length >= 12) score += 15;

  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[^A-Za-z0-9]/.test(password)) score += 15;

  return Math.min(score, 100);
}

function getColor(score: number) {
  if (score >= 100) return "bg-green-500";
  if (score >= 80) return "bg-lime-500";
  if (score >= 50) return "bg-yellow-400";
  if (score >= 30) return "bg-orange-500";
  return "bg-red-500";
}

export default function Page() {
  const methods = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    mode: "onChange"
  });

  const { control, formState: { isSubmitting, isValid }, getValues } = methods;


   const onSubmit = async (data: RegisterForm) => {
        const formData = new FormData();
        formData.append("email", (data as any).email);
        formData.append("name", (data as any).name);
        formData.append("password", (data as any).password);
        formData.append("confirmPassword", (data as any).confirmPassword);
        const response = await onRegister(formData);
        if (response.success) {
            alert("Registered successfully!");
            localStorage.setItem("token", response.token);
            window.location.href = "/authorized/editor";
        }
        if (response.error) {
            alert("Registration failed: " + response.error);
        }
    };

  const password = methods.watch("password");
  const strength = useMemo(() => calculateStrength(password), [password]);
  const colorClass = useMemo(() => getColor(strength), [strength]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl border bg-card shadow-lg">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Create an account
      </h1>

      <Form {...methods}>
        <form onSubmit={e => {e.preventDefault(); onSubmit(getValues());}} className="space-y-5">
          <FormField
            control={control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <FormField
                control={control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="col-span-6">
              <FormField
                control={control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <FormField
            control={control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <Progress
                  value={strength}
                  colorClass={colorClass}
                  className="mt-2 h-2"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit"  disabled={!isValid || isSubmitting} className="w-full">
            Create Account
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
                        cursor: "pointer"
                    }}
                >
                    Register with Google
                </Button>
                <Button
                    type="button"
                    onClick={() => {
                        signIn("github", { callbackUrl: "/authorized/editor" });
                    }}
                    style={{
                        marginTop: "1rem",
                        width: "100%",
                        padding: "0.5rem",
                        background: "#333",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Register with GitHub
                </Button>
        </form>
      </Form>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-medium text-primary hover:underline"
        >
          Login
        </Link>
      </p>
    </div>
  );
}
