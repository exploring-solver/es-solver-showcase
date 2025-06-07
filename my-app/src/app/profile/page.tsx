"use client" // <--- Add this directive

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSession } from "next-auth/react" // <--- Import useSession
import { useRouter } from "next/navigation" // <--- Import useRouter
import { useEffect } from "react" // <--- Import useEffect

// Remove async keyword
export default function ProfilePage() {
    const { data: session, status } = useSession(); // <--- Use useSession hook
    const router = useRouter(); // <--- Initialize useRouter

    // Handle loading and unauthenticated states
    useEffect(() => {
        if (status === "loading") return; // Do nothing while loading

        if (status === "unauthenticated" || !session) {
            // Redirect if not authenticated
            router.push("/sign-in");
        }
    }, [session, status, router]); // Dependencies for useEffect

    // Optionally show a loading state while session is loading
    if (status === "loading") {
        return <div className="max-w-md mx-auto mt-12 p-8 text-center">Loading profile...</div>;
    }

    // Only render if authenticated (session is available)
    if (!session || !session.user) {
        // This case should be caught by the useEffect redirect,
        // but as a fallback or while redirecting.
        return null;
    }

    const user = session.user;

    const initials = user?.name
        ? user.name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
        : "U";

    return (
        <div className="max-w-md mx-auto mt-12 p-8 border-white border-2 rounded-lg shadow">
            <div className="flex flex-col items-center gap-4">
                <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.image || undefined} alt={user?.name || ""} />
                    <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <h1 className="text-2xl font-bold">{user?.name || "User"}</h1>
                <p className="text-muted-foreground">{user?.email}</p>
            </div>
        </div>
    );
}

// Remove the getServerSession and redirect imports as they are for server components
// import getServerSession from "next-auth"
// import { authOptions } from "@/lib/auth" // If authOptions is only used for getServerSession here
// import { redirect } from "next/navigation"