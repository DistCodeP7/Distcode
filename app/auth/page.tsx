"use client";

import React from "react";
import {useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { onRegister } from "./onregister";

const schema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type FormData = z.infer<typeof schema>;

export default function Register() {
    const methods = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });
    const { control, formState: { isSubmitting, isValid }, getValues } = methods;
    const onSubmit = async (data: FormData) => {
        const formData = new FormData();
        formData.append("email", (data as any).email);
        formData.append("password", (data as any).password);
        formData.append("confirmPassword", (data as any).confirmPassword);
        const response = await onRegister(formData);
        if (response.success) {
            alert("Registered successfully!");
        }
        if (response.error) {
            alert("Registration failed: " + response.error);
        }
        localStorage.setItem("token", response.token);
        window.location.href = "/editor";
    };

    return (
        <FormProvider {...methods}>
            <form
                style={{ maxWidth: 400, margin: "2rem auto" }}
                onSubmit={e => {
                    e.preventDefault();
                    onSubmit(getValues());
                }}
            >
                <FormField
                    control={control}
                    name="email"
                    render={({ field, fieldState }) => (
                        <div>
                            <input {...field} value={field.value ?? ""} placeholder="Email here" />
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                        </div>
                    )}
                />
                <FormField
                    control={control}
                    name="password"
                    render={({ field, fieldState }) => (
                        <div>
                            <input {...field} value={field.value ?? ""} type="password" placeholder="Password here" />
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                        </div>
                    )}
                />
                <FormField
                    control={control}
                    name="confirmPassword"
                    render={({ field, fieldState }) => (
                        <div>
                            <input {...field} value={field.value ?? ""} type="password" placeholder="Confirm password here" />
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                        </div>
                    )}
                />
                <Button
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    style={{
                        marginTop: "1rem",
                        width: "100%",
                        padding: "0.5rem",
                        background: (!isValid || isSubmitting) ? "#ccc" : "#e01616ff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: (!isValid || isSubmitting) ? "not-allowed" : "pointer"
                    }}
                >
                    Register
                </Button>
            </form>
        </FormProvider>
    );
}