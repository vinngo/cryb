"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, DollarSign, Home, Plus, FileText } from "lucide-react";
import Link from "next/link";

import { useDashboardStore } from "@/lib/stores/dashboardStore";
import { EmptyState } from "@/components/empty-state";
import { useMemo } from "react";

export default function Dashboard() {
  const { user, house, members, chores, expenses, contributions, notes } =
    useDashboardStore();

  // Get current user
  const currentUser = user;

  // Get upcoming chores (filter for demo)
  const upcomingChores = chores.filter((chore) => !chore.completed).slice(0, 3);

  // Get recent expenses (for demo)
  const recentExpenses = expenses.slice(0, 3);

  // Get pinned notes
  const pinnedNotes = notes.filter((note) => note.is_pinned).slice(0, 2);

  // Enhanced balance calculations with contributions
  const { totalOwed, totalOwing, netBalance } = useMemo(() => {
    if (!currentUser) {
      return { totalOwed: 0, totalOwing: 0, netBalance: 0 };
    }

    // What the current user owes to others
    let owed = 0;
    // What others owe to the current user
    let owing = 0;

    // Calculate what the user owes to others
    expenses.forEach((expense) => {
      // Skip if the user paid for this expense
      if (expense.paid_by === currentUser.id) {
        return;
      }

      // Skip if the user is not involved in this expense
      if (!expense.split_between.includes(currentUser.id)) {
        return;
      }

      // Calculate the user's share
      const totalPeople = expense.split_between.length + 1; // +1 for the person who paid
      const share = expense.amount / totalPeople;

      // Subtract any contributions the user has already made
      const userContributions = contributions
        .filter(
          (c) => c.expense_id === expense.id && c.user_id === currentUser.id,
        )
        .reduce((sum, c) => sum + c.amount, 0);

      owed += Math.max(0, share - userContributions);
    });

    // Calculate what others owe to the user
    expenses.forEach((expense) => {
      // Skip if the user didn't pay for this expense
      if (expense.paid_by !== currentUser.id) {
        return;
      }

      // Calculate how much others owe to this user
      expense.split_between.forEach((sharedUserId) => {
        const splitAmount = expense.amount / (expense.split_between.length + 1);

        // Subtract any contributions the shared user has already made
        const sharedUserContributions = contributions
          .filter(
            (c) => c.expense_id === expense.id && c.user_id === sharedUserId,
          )
          .reduce((sum, c) => sum + c.amount, 0);

        owing += Math.max(0, splitAmount - sharedUserContributions);
      });
    });

    return {
      totalOwed: owed,
      totalOwing: owing,
      netBalance: owing - owed,
    };
  }, [currentUser, expenses, contributions]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.display_name || "Guest"}! Here&apos;s
            what&apos;s happening in your house.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarFallback>{user?.display_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user?.display_name}</p>
            <p className="text-sm text-muted-foreground">{house?.name}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chores Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chores.filter((chore) => chore.completed).length}/{chores.length}
            </div>
            <Progress
              value={
                (chores.filter((chore) => chore.completed).length /
                  chores.length) *
                100
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">You Owe</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              ${totalOwed.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalOwed > 0 ? "Outstanding payments" : "All paid up!"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              You&apos;re Owed
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${totalOwing.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Outstanding receivables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              ${Math.abs(netBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netBalance >= 0 ? "You're owed money" : "You owe money"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">House Members</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <div className="flex -space-x-2 mt-2">
              {members.map((user) => (
                <Avatar
                  key={user.user_id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chores">Chores</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Upcoming Chores</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/chores">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {upcomingChores.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingChores.map((chore) => (
                      <div
                        key={chore.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle
                            className={`h-5 w-5 ${chore.completed ? "text-green-500" : "text-gray-300"}`}
                          />
                          <div>
                            <p className="font-medium">{chore.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Due{" "}
                              {new Date(chore.due_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            getChoreVariant(
                              new Date(chore.due_date).toLocaleDateString(),
                            ) as
                              | "destructive"
                              | "outline"
                              | "default"
                              | "secondary"
                          }
                        >
                          {getChoreStatus(
                            new Date(chore.due_date).toLocaleDateString(),
                          )}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={CheckCircle}
                    title="No upcoming chores"
                    description="Add your first chore to get started"
                    action={
                      <Button asChild>
                        <Link href="/chores/?action=new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Chore
                        </Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
              <CardFooter
                className={upcomingChores.length > 0 ? "pt-0" : "hidden"}
              >
                <Button asChild variant="outline" className="w-full">
                  <Link href="/chores?action=new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Chore
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-md">Recent Expenses</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/expenses">View All</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {recentExpenses.length > 0 ? (
                  <div className="space-y-4">
                    {recentExpenses.map((expense) => {
                      const paidBy = members.find(
                        (user) => user.user_id === expense.paid_by,
                      );
                      return (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{expense.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Paid by {paidBy?.name} •{" "}
                                {new Date(
                                  expense.created_at,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <p className="font-medium">
                            ${expense.amount.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={DollarSign}
                    title="No expenses yet"
                    description="Add your first expense to start tracking"
                    action={
                      <Button asChild>
                        <Link href="/expenses">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Expense
                        </Link>
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-md">Pinned Notes</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/notes">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {pinnedNotes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {pinnedNotes.map((note) => {
                    const author = members.find(
                      (user) => user.user_id === note.created_by,
                    );
                    return (
                      <Card key={note.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {note.title}
                          </CardTitle>
                          <CardDescription>
                            By {author?.name} •{" "}
                            {new Date(note.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">
                            {note.content.substring(0, 100)}...
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No pinned notes"
                  description="Pin important notes for quick access"
                  action={
                    <Button asChild>
                      <Link href="/notes?action=new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Note
                      </Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chores">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Chores</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Chore
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chores.map((chore) => {
                  const assignedTo = members.find(
                    (user) => user.user_id === chore.assigned_to,
                  );
                  return (
                    <div
                      key={chore.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-4">
                        <CheckCircle
                          className={`h-5 w-5 ${chore.completed ? "text-green-500" : "text-gray-300"}`}
                        />
                        <div>
                          <p className="font-medium">{chore.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Assigned to {assignedTo?.name}</span>
                            <span>•</span>
                            <span>
                              Due{" "}
                              {new Date(chore.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          getChoreVariant(
                            new Date(chore.due_date).toLocaleDateString(),
                          ) as
                            | "default"
                            | "destructive"
                            | "outline"
                            | "secondary"
                        }
                      >
                        {getChoreStatus(
                          new Date(chore.due_date).toLocaleDateString(),
                        )}
                      </Badge>
                    </div>
                  );
                })}
                {chores.length === 0 && (
                  <EmptyState
                    icon={CheckCircle}
                    title="No chores yet"
                    description="Add your first chore to get started"
                    action={
                      <Button asChild>
                        <Link href="/chores?action=new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Chore
                        </Link>
                      </Button>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expenses</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const paidBy = members.find(
                    (user) => user.user_id === expense.paid_by,
                  );
                  const sharedWith = expense.split_between
                    .map(
                      (id) => members.find((user) => user.user_id === id)?.name,
                    )
                    .join(", ");

                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-4">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{expense.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Paid by {paidBy?.name}</span>
                            <span>•</span>
                            <span>
                              {new Date(
                                expense.created_at,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {sharedWith && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Shared with: {sharedWith}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="font-medium">
                        ${expense.amount.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
                {expenses.length === 0 && (
                  <EmptyState
                    icon={DollarSign}
                    title="No expenses yet"
                    description="Add your first expense to start tracking"
                    action={
                      <Button asChild>
                        <Link href="/expenses?action=new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Expense
                        </Link>
                      </Button>
                    }
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Notes & Announcements</CardTitle>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </CardHeader>
            <CardContent>
              {notes.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {notes.map((note) => {
                    const author = members.find(
                      (user) => user.user_id === note.created_by,
                    );
                    return (
                      <Card key={note.id}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-md">
                              {note.title}
                            </CardTitle>
                            {note.is_pinned && (
                              <Badge variant="outline">Pinned</Badge>
                            )}
                          </div>
                          <CardDescription>
                            By {author?.name} •{" "}
                            {new Date(note.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm">{note.content}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No notes yet"
                  description="Add your first note to get started"
                  action={
                    <Button asChild>
                      <Link href="/notes?action=new">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Note
                      </Link>
                    </Button>
                  }
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper functions
function getChoreVariant(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "destructive";
  if (diffDays <= 1) return "warning";
  return "outline";
}

function getChoreStatus(dueDate: string) {
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) return "Overdue";
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  return `${diffDays} days`;
}
