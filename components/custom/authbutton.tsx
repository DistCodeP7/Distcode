"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function AuthButtons() {
    const pathname = usePathname()

    const isLoginPage = pathname === "/auth/login"
    const isSignupPage = pathname === "/auth"

    return (
        <div className="flex items-center justify-end gap-2">
            {!isLoginPage && (
                <Link href="/auth/login" passHref>
                    <Button variant="ghost">Login</Button>
                </Link>
            )}
            {!isSignupPage && (
                <Link href="/auth" passHref>
                    <Button>Sign Up</Button>
                </Link>
            )}
        </div>
    )
}
