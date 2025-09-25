"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.email("Please enter a valid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

const callBackUrl = "/exercises";

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
                  <Input type="email" placeholder="you@email.com" {...field} />
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
                callbackUrl: callBackUrl,
              });
            }}
          >
            Login
          </Button>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
            }}
          >
            <Button
              type="button"
              onClick={() => {
                signIn("github", { callbackUrl: callBackUrl });
              }}
              style={{
                width: "64px",
                height: "64px",
                background: "#333",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/github-mark-white.svg"
                alt="GitHub"
                width={32}
                height={32}
              />
            </Button>
            <Button
              type="button"
              onClick={() => {
                signIn("google", { callbackUrl: callBackUrl });
              }}
              style={{
                width: "64px",
                height: "64px",
                background: "#ffffffff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                src="/google-login.svg"
                alt="Google"
                width={32}
                height={32}
              />
            </Button>
          </div>
        </form>
      </Form>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        Don’t have an account?{" "}
        <Link href="/auth" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
