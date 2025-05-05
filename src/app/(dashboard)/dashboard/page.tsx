import { Metadata } from "next"
import {getServerSession} from "next-auth/next"
import { redirect } from "next/navigation"

import { authOptions } from "../../../lib/auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare, ShoppingCart, FileText, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
    title: "Dashboard",
    description: "View your modules and statistics",
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions)
    console.log(session)
    if (!session) {
        redirect("/sign-in")
    }

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">
                    Welcome back, {session.user.name || "User not found"}!
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            AI Chatbot with RAG
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="mt-4 mb-4">
                            <p className="text-sm text-muted-foreground">
                                Ask questions using your uploaded documents with AI-powered retrieval augmented generation.
                            </p>
                        </div>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/module/ai-chatbot">
                                Go to AI Chatbot
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            E-Commerce Store
                        </CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="mt-4 mb-4">
                            <p className="text-sm text-muted-foreground">
                                Browse products, add to cart, and checkout with Stripe integration.
                            </p>
                        </div>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/module/ecommerce">
                                Go to E-Commerce
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Notes App
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="mt-4 mb-4">
                            <p className="text-sm text-muted-foreground">
                                Create, edit, and share rich-text notes with markdown support.
                            </p>
                        </div>
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/module/notes-app">
                                Go to Notes App
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your recent interactions across all modules
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ActivityList />
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Uploaded Documents</CardTitle>
                        <CardDescription>
                            Your documents available for AI chatbot
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DocumentList />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Statistics</CardTitle>
                        <CardDescription>
                            Overview of your usage
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <StatisticsList />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function ActivityList() {
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">No recent activity</p>
                    <p className="text-sm text-muted-foreground">
                        Your recent activities will appear here
                    </p>
                </div>
            </div>
        </div>
    )
}

function DocumentList() {
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <div className="ml-4 space-y-1">
                    <p className="text-sm font-medium leading-none">No documents</p>
                    <p className="text-sm text-muted-foreground">
                        Upload documents in the AI Chatbot module
                    </p>
                </div>
            </div>
        </div>
    )
}

function StatisticsList() {
    return (
        <div className="grid gap-4 grid-cols-2">
            <div className="flex flex-col space-y-2">
                <span className="text-muted-foreground text-sm">AI Chat Messages</span>
                <span className="text-2xl font-bold">0</span>
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-muted-foreground text-sm">Documents</span>
                <span className="text-2xl font-bold">0</span>
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-muted-foreground text-sm">Products Viewed</span>
                <span className="text-2xl font-bold">0</span>
            </div>
            <div className="flex flex-col space-y-2">
                <span className="text-muted-foreground text-sm">Notes Created</span>
                <span className="text-2xl font-bold">0</span>
            </div>
        </div>
    )
}