"use client";

import React from "react";
import {useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { onLogin, onRegister } from "../onregister";

const schema = z.object({
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
    const methods = useForm<FormData>({
        resolver: zodResolver(schema),
        mode: "onChange",
    });
    const { control, formState: { isSubmitting, isValid }, getValues } = methods;
    const onSubmit = async (data: FormData) => {
        const formData = new FormData();
        formData.append("email", (data as any).email);
        formData.append("password", (data as any).password);
        const response = await onLogin(formData);
        if (response.success) {
            alert("Logged in successfully!");
            localStorage.setItem("token", response.token);
            window.location.href = "/editor";
        }
        if (response.error) {
            alert("Login failed: " + response.error);
        }
    }
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
                            <input {...field} type="password" value={field.value ?? ""} placeholder="Password here" />
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                        </div>
                    )}
                />
                <Button type="submit" disabled={!isValid || isSubmitting} style={{ marginTop: "1rem" }}>
                    {"Login"}
                </Button>
            </form>
        </FormProvider>
    );
}