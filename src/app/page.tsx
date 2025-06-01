import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">cryb</span>
        </div>
        <div>
          <Button asChild variant="outline" className="mr-2">
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/login?tab=signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
            No More Sticky Notes on the Fridge
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            cryb helps college housemates manage chores, split expenses, and
            communicate effectively.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild size="lg">
              <Link href="/login?tab=signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-between gap-4 px-4 md:h-16 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} cryb. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="#"
              className="text-sm text-muted-foreground hover:underline"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
