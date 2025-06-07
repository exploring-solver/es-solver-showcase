import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"

import { MainNav } from "@/components/layout/main-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { authOptions } from "@/lib/auth"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/sign-in")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 md:pt-6">
        <aside className="fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <Sidebar />
        </aside>
        <main className="flex w-full flex-col overflow-hidden pb-10">
          {children}
        </main>
      </div>
    </div>
  )
}