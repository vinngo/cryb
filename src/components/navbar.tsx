"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ClipboardList,
  ShoppingBasket,
  DollarSign,
  FileText,
  Home,
  LogOut,
  Menu,
  User,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { useChoreStore } from "@/lib/stores/choresStore";
import { useExpenseStore } from "@/lib/stores/expensesStore";
import { useNotesStore } from "@/lib/stores/notesStore";
import { useRulesStore } from "@/lib/stores/rulesStore";
import { useRootStore } from "@/lib/stores/rootStore";
import { useShoppingListStore } from "@/lib/stores/useShoppingListStore";
import { usePollStore } from "@/lib/stores/pollsStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showHouseDialog, setShowHouseDialog] = useState(false);

  const { fetchDashboardData } = useDashboardStore();
  const { fetchChoresData } = useChoreStore();
  const { fetchExpensesData } = useExpenseStore();
  const { fetchNotesData } = useNotesStore();
  const { fetchPollData } = usePollStore();
  const { fetchRulesData } = useRulesStore();
  const { fetchShoppingListData } = useShoppingListStore();
  const { user, email } = useRootStore();

  useEffect(() => {
    const fetchData = async () => {
      await useRootStore.getState().fetchCoreData();
      switch (pathname) {
        case "/dashboard":
          fetchDashboardData();
          break;
        case "/chores":
          fetchChoresData();
          break;
        case "/expenses":
          fetchExpensesData();
          break;
        case "/shopping-list":
          fetchShoppingListData();
          break;
        case "/notes":
          fetchNotesData();
          fetchPollData();
          break;
        case "/house-rules":
          fetchRulesData();
          break;
      }
    };
    fetchData();
  }, [
    pathname,
    fetchDashboardData,
    fetchChoresData,
    fetchExpensesData,
    fetchShoppingListData,
    fetchNotesData,
    fetchPollData,
    fetchRulesData,
  ]);

  // Show dialog if user is logged in but not in a house/group
  useEffect(() => {
    if (user && !user.house_id && pathname !== "/profile") {
      setShowHouseDialog(true);
    } else {
      setShowHouseDialog(false);
    }
  }, [user, pathname]);

  const routes = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Chores", href: "/chores", icon: ClipboardList },
    { name: "Expenses", href: "/expenses", icon: DollarSign },
    { name: "Shopping List", href: "/shopping-list", icon: ShoppingBasket },
    { name: "Notes", href: "/notes", icon: FileText },
    { name: "House Rules", href: "/house-rules", icon: Users },
    { name: "Calendar", href: "/calendar", icon: CalendarDays },
  ];

  return (
    <>
      {/* House/Group Dialog */}
      <Dialog
        open={showHouseDialog}
        onOpenChange={() => {}} // Prevent closing by clicking outside or pressing ESC
        modal
      >
        <DialogContent className="max-w-sm mx-auto text-center flex flex-col items-center no-dialog-close">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold mb-2">
              Welcome to Cryb!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mb-2">
            <p className="text-base font-medium">
              You are not part of a house yet.
            </p>
            <p className="text-sm text-muted-foreground">
              Please create a new house or join an existing one to continue.
            </p>
          </div>
          <div className="w-full border-t border-muted-foreground/20 my-2" />
          <DialogFooter className="w-full mt-2">
            <div className="flex flex-row gap-3 w-full justify-between">
              <Button
                onClick={() => {
                  setShowHouseDialog(false);
                  router.push("/profile?action=create-house");
                }}
                className="w-1/2 rounded-md py-2 text-base"
              >
                Create House
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowHouseDialog(false);
                  router.push("/profile?action=join-house");
                }}
                className="w-1/2 rounded-md py-2 text-base"
              >
                Join House
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hide the close (X) button in the dialog */}
      <style jsx global>{`
        .no-dialog-close button[aria-label="Close"] {
          display: none !important;
        }
      `}</style>

      <header className="sticky top-0 z-10 w-full border-b bg-background">
        <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
          {/* Logo */}
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

          {/* User & Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* User Dropdown (Desktop) */}
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.display_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.display_name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

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
                  {/* Mobile User Info */}
                  <div className="p-4 border-b flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={"/placeholder.svg"}
                        alt={user?.display_name}
                      />
                      <AvatarFallback>
                        {user?.display_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user?.display_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user?.display_name}
                      </p>
                    </div>
                  </div>
                  {/* Mobile Navigation */}
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
                  {/* Mobile Logout */}
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
