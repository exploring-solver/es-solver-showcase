import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/layout/main-nav"
import { Footer } from "@/components/layout/footer"
import { 
  MessageSquare, 
  ShoppingCart, 
  FileText, 
  ArrowRight 
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                ES Solver Showcase
              </h1>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                A full-stack Next.js application showcasing AI-powered features, E-commerce, and a Notes App
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    Get Started
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="#features">
                    View Features
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Key Features
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Explore our modular applications built with Next.js and TypeScript
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {/* AI Chatbot */}
              <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg">
                <div className="p-3 rounded-full bg-primary/10">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI Chatbot with RAG</h3>
                <p className="text-muted-foreground text-center">
                  Upload PDFs or text files and ask questions with AI-generated responses backed by your documents.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/module/ai-chatbot">
                    Try AI Chatbot <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {/* E-Commerce */}
              <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg">
                <div className="p-3 rounded-full bg-primary/10">
                  <ShoppingCart className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">E-Commerce Store</h3>
                <p className="text-muted-foreground text-center">
                  Browse products, add to cart, and checkout with Stripe integration and admin dashboard.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/module/ecommerce">
                    Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              
              {/* Notes App */}
              <div className="flex flex-col items-center space-y-4 p-6 border rounded-lg">
                <div className="p-3 rounded-full bg-primary/10">
                  <FileText className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Notes App</h3>
                <p className="text-muted-foreground text-center">
                  Create, edit, and share rich-text notes with markdown support and real-time autosave.
                </p>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/module/notes-app">
                    Take Notes <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Technologies Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Built with Modern Technologies
              </h2>
              <p className="max-w-[700px] text-muted-foreground md:text-xl">
                Leveraging the latest tools and frameworks for a seamless experience
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12">
              <TechCard title="Next.js" description="App Router, Server Components, API Routes" />
              <TechCard title="TypeScript" description="Type-safe code for better development" />
              <TechCard title="PostgreSQL" description="Relational database with Prisma ORM" />
              <TechCard title="OpenAI API" description="Powerful language models for AI chatbot" />
              <TechCard title="Vector DB" description="Efficient similarity search for RAG" />
              <TechCard title="Stripe" description="Secure payment processing" />
              <TechCard title="TipTap" description="Rich text editor for notes app" />
              <TechCard title="ShadcnUI" description="Beautiful UI components" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function TechCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center space-y-2 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-muted-foreground text-center">{description}</p>
    </div>
  )
}