import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInForm from "../../components/auth/SignInForm";
// import Header from "../../components/la";
import Footer from "../../components/layout/Footer";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  // If user is already logged in, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* <Header /> */}
      <main className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <SignInForm />
      </main>
      {/* <Footer /> */}
    </div>
  );
}