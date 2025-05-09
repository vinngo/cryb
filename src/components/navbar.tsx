"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ClipboardList,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Menu,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { useChoreStore } from "@/lib/stores/choresStore";
import { useExpenseStore } from "@/lib/stores/expensesStore";
import { useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { fetchDashboardData, user } = useDashboardStore();
  const { fetchChoresData } = useChoreStore();
  const { fetchExpensesData } = useExpenseStore();

  useEffect(() => {
    fetchDashboardData();
    fetchChoresData();
    fetchExpensesData();
  }, []);

  const routes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
    },
    {
      name: "Chores",
      href: "/chores",
      icon: ClipboardList,
    },
    {
      name: "Expenses",
      href: "/expenses",
      icon: DollarSign,
    },
    {
      name: "Notes",
      href: "/notes",
      icon: FileText,
    },
    {
      name: "House Rules",
      href: "/house-rules",
      icon: Users,
    },
    {
      name: "Calendar",
      href: "/calendar",
      icon: CalendarDays,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-10 w-full border-b bg-background">
        <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold">cryb</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.href
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                <route.icon className="h-4 w-4" />
                {route.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{user?.display_name}</span>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="hidden md:flex"
              asChild
            >
              <Link href="/login">
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Logout</span>
              </Link>
            </Button>

            {/* Mobile Menu Trigger */}
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0">
                <div className="h-full flex flex-col">
                  <div className="p-4 border-b flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={"/placeholder.svg"}
                        alt={user?.display_name}
                      />
                      <AvatarFallback>
                        {user?.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.display_name}
                      </p>
                    </div>
                  </div>
                  <nav className="flex-1 p-4 space-y-2">
                    {routes.map((route) => (
                      <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
                          pathname === route.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground",
                        )}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <route.icon className="h-4 w-4" />
                        {route.name}
                      </Link>
                    ))}
                  </nav>
                  <div className="p-4 border-t">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      asChild
                    >
                      <Link href="/login">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </Link>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
