import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  CheckCircle,
  DollarSign,
  Home,
  Plus,
} from "lucide-react";
import Link from "next/link";
import {
  mockChores,
  mockExpenses,
  mockNotes,
  mockUsers,
} from "@/lib/mock-data";

export default function Dashboard() {
  // Get current user (in a real app, this would come from auth)
  const currentUser = mockUsers[0];

  // Get upcoming chores (filter for demo)
  const upcomingChores = mockChores
    .filter((chore) => !chore.completed)
    .slice(0, 3);

  // Get recent expenses (for demo)
  const recentExpenses = mockExpenses.slice(0, 3);

  // Get pinned notes
  const pinnedNotes = mockNotes.filter((note) => note.isPinned).slice(0, 2);

  // Calculate balances
  const totalOwed = mockExpenses
    .filter(
      (expense) =>
        expense.sharedWith.includes(currentUser.id) &&
        expense.paidBy !== currentUser.id,
    )
    .reduce((sum, expense) => {
      // Simple split calculation for demo
      const splitAmount = expense.amount / (expense.sharedWith.length + 1);
      return sum + splitAmount;
    }, 0);

  const totalOwing = mockExpenses
    .filter(
      (expense) =>
        expense.paidBy === currentUser.id && expense.sharedWith.length > 0,
    )
    .reduce((sum, expense) => {
      // Simple split calculation for demo
      const splitAmount =
        (expense.amount / (expense.sharedWith.length + 1)) *
        expense.sharedWith.length;
      return sum + splitAmount;
    }, 0);

  const netBalance = totalOwing - totalOwed;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser.name}! Here&apos;s what&apos;s happening
            in your house.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src={currentUser.avatarUrl || "/placeholder.svg"}
              alt={currentUser.name}
            />
            <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">
              {currentUser.house.name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chores Completed
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockChores.filter((chore) => chore.completed).length}/
              {mockChores.length}
            </div>
            <Progress
              value={
                (mockChores.filter((chore) => chore.completed).length /
                  mockChores.length) *
                100
              }
              className="h-2 mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              ${Math.abs(netBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netBalance >= 0 ? "You're owed" : "You owe"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">House Members</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <div className="flex -space-x-2 mt-2">
              {mockUsers.map((user) => (
                <Avatar
                  key={user.id}
                  className="h-8 w-8 border-2 border-background"
                >
                  <AvatarImage
                    src={user.avatarUrl || "/placeholder.svg"}
                    alt={user.name}
                  />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
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
                              Due {new Date(chore.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={getChoreVariant(chore.dueDate)}>
                          {getChoreStatus(chore.dueDate)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No upcoming chores</p>
                )}
              </CardContent>
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
                      const paidBy = mockUsers.find(
                        (user) => user.id === expense.paidBy,
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
                                {new Date(expense.date).toLocaleDateString()}
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
                  <p className="text-muted-foreground">No recent expenses</p>
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
                    const author = mockUsers.find(
                      (user) => user.id === note.createdBy,
                    );
                    return (
                      <Card key={note.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            {note.title}
                          </CardTitle>
                          <CardDescription>
                            By {author?.name} •{" "}
                            {new Date(note.createdAt).toLocaleDateString()}
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
                <p className="text-muted-foreground">No pinned notes</p>
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
                {mockChores.map((chore) => {
                  const assignedTo = mockUsers.find(
                    (user) => user.id === chore.assignedTo,
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
                              Due {new Date(chore.dueDate).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{chore.frequency}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={getChoreVariant(chore.dueDate)}>
                        {getChoreStatus(chore.dueDate)}
                      </Badge>
                    </div>
                  );
                })}
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
                {mockExpenses.map((expense) => {
                  const paidBy = mockUsers.find(
                    (user) => user.id === expense.paidBy,
                  );
                  const sharedWith = expense.sharedWith
                    .map((id) => mockUsers.find((user) => user.id === id)?.name)
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
                              {new Date(expense.date).toLocaleDateString()}
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
              <div className="grid gap-4 md:grid-cols-2">
                {mockNotes.map((note) => {
                  const author = mockUsers.find(
                    (user) => user.id === note.createdBy,
                  );
                  return (
                    <Card key={note.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md">
                            {note.title}
                          </CardTitle>
                          {note.isPinned && (
                            <Badge variant="outline">Pinned</Badge>
                          )}
                        </div>
                        <CardDescription>
                          By {author?.name} •{" "}
                          {new Date(note.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{note.content}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
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
