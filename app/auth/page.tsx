"use client"

import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import Link from "next/link"
import { useMemo } from "react"

import {
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

const schema = z
    .object({
        email: z.email("Please enter a valid email address").trim(),
        firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
        lastName: z.string().trim().min(2, "Last name must be at least 2 characters"),
        password: z
            .string()
            .regex(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9]).{8,}$/, {
                message:
                    "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number",
            }),
        confirmPassword: z.string(),
    })
    .superRefine((data, ctx) => {
        if (data.password !== data.confirmPassword) {
            ctx.addIssue({
                code: "custom",
                path: ["confirmPassword"],
                message: "Passwords do not match",
            })
        }
    })

export type RegisterForm = z.infer<typeof schema>

function calculateStrength(password: string): number {
    let score = 0

    if (!password) return score
    if (password.length >= 8) score += 25
    if (password.length >= 12) score += 15

    if (/[a-z]/.test(password)) score += 15
    if (/[A-Z]/.test(password)) score += 15
    if (/[0-9]/.test(password)) score += 15
    if (/[^A-Za-z0-9]/.test(password)) score += 15

    return Math.min(score, 100)
}

function getColor(score: number) {
    if (score >= 100) return "bg-green-500"
    if (score >= 80) return "bg-lime-500"
    if (score >= 50) return "bg-yellow-400"
    if (score >= 30) return "bg-orange-500"
    return "bg-red-500"
}

export default function Page() {
    const form = useForm<RegisterForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
            firstName: "",
            lastName: "",
            password: "",
            confirmPassword: "",
        },
    })

    const onSubmit = (values: RegisterForm) => {
        console.log(values)
    }

    const password = form.watch("password")
    const strength = useMemo(() => calculateStrength(password), [password])
    const colorClass = useMemo(() => getColor(strength), [strength])

    return (
        <div className="max-w-md mx-auto mt-10 p-6 rounded-2xl border bg-card shadow-lg">
            <h1 className="text-2xl font-semibold mb-6 text-center">Create an account</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
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
                        control={form.control}
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

                    <FormField
                        control={form.control}
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

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <Progress value={strength} colorClass={colorClass} className="mt-2 h-2" />
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
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

                    <Button type="submit" className="w-full">
                        Create Account
                    </Button>
                </form>
            </Form>

            <p className="text-sm text-muted-foreground mt-4 text-center">
                Already have an account?{" "}
                <Link href="/auth/login" className="font-medium text-primary hover:underline">
                    Login
                </Link>
            </p>
        </div>
    )
}
