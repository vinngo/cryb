"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, DollarSign, Plus, CreditCard, Home } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useExpenseStore } from "@/lib/stores/expensesStore";
import { useRootStore } from "@/lib/stores/rootStore";
import { Contribution, Expense } from "../../../types/database";
import { addNewExpense, addNewContribution } from "./actions";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function ExpensesPage() {
  const searchParams = useSearchParams();

  const {
    expenses: expensesData,
    contributions: contributionsData,
    loading,
    fetchExpensesData,
  } = useExpenseStore();

  const { user, houseMembers } = useRootStore();
  // Check if user has a house
  const hasHouse = user?.house_id != null;

  useEffect(() => {
    fetchExpensesData();
  }, [fetchExpensesData]);

  const [expenses, setExpenses] = useState(expensesData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isContributeDialogOpen, setIsContributeDialogOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [contributionDate, setContributionDate] = useState<Date>(new Date());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [contributionNote, setContributionNote] = useState("");
  const [paidBy, setPaidBy] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Add state for contributions
  const [contributions, setContributions] =
    useState<Contribution[]>(contributionsData);

  // Get current user (in a real app, this would come from auth)
  const currentUser = user;

  useEffect(() => {
    // Check if there's an action parameter in the URL
    const action = searchParams.get("action");
    if (action === "new") {
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    setExpenses(expensesData);
  }, [expensesData]);

  useEffect(() => {
    setContributions(contributionsData);
  }, [contributionsData]);

  // Calculate what the current user owes for a specific expense
  const calculateUserOwes = (expense: Expense) => {
    if (!currentUser) {
      return 0; // User is not logged in
    }

    if (expense.paid_by === currentUser.id) {
      return 0; // User paid for this expense
    }

    if (!expense.split_between.includes(currentUser.id)) {
      return 0; // User is not involved in this expense
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

    return Math.max(0, share - userContributions);
  };

  // Calculate balances
  const balances = useMemo(() => {
    const calculatedBalances = houseMembers?.map((member) => {
      let balance = 0;

      // Calculate what this user owes to others
      expenses.forEach((expense) => {
        if (
          expense.split_between.includes(member.user_id) &&
          expense.paid_by !== member.user_id
        ) {
          // Simple split calculation for demo
          const splitAmount =
            expense.amount / (expense.split_between.length + 1);

          // Subtract any contributions the user has already made
          const userContributions = contributions
            .filter(
              (c) =>
                c.expense_id === expense.id && c.user_id === member.user_id,
            )
            .reduce((sum, c) => sum + c.amount, 0);

          balance -= Math.max(0, splitAmount - userContributions);
        }
      });

      // Calculate what others owe to this user
      expenses.forEach((expense) => {
        if (
          expense.paid_by === member.user_id &&
          expense.split_between.length > 0
        ) {
          // Calculate how much others owe to this user
          expense.split_between.forEach((sharedUserId) => {
            const splitAmount =
              expense.amount / (expense.split_between.length + 1);

            // Subtract any contributions the shared user has already made
            const sharedUserContributions = contributions
              .filter(
                (c) =>
                  c.expense_id === expense.id && c.user_id === sharedUserId,
              )
              .reduce((sum, c) => sum + c.amount, 0);

            balance += Math.max(0, splitAmount - sharedUserContributions);
          });
        }
      });

      return {
        user: member,
        balance,
      };
    });

    return calculatedBalances;
  }, [expenses, houseMembers, contributions]);

  const addExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user?.house_id) {
      console.error("User is not part of a house");
      return;
    }

    if (!date) {
      toast({
        title: "Date is required",
        description: "Please select a date for the expense",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);

    formData.set("paid_by", paidBy);
    formData.set("split_between", JSON.stringify(selectedUsers));

    //call server action using formData...
    setSubmitting(true);
    setIsDialogOpen(false);
    const result = await addNewExpense(formData, user?.house_id);
    setSubmitting(false);

    if (!result.success) {
      throw new Error(result.error || "Failed to add expense");
    }

    await fetchExpensesData();

    setDate(undefined);
    setPaidBy("");
    setSelectedUsers([]);
  };

  const resetForm = () => {
    setDate(undefined);
    setPaidBy("");
    setSelectedUsers([]);
  };

  const handleContribute = (expense: Expense) => {
    setSelectedExpense(expense);
    setContributionAmount("");
    setContributionNote("");
    setContributionDate(new Date());
    setIsContributeDialogOpen(true);
  };

  const submitContribution = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedExpense || !contributionAmount) return;

    if (!currentUser) return;

    const formData = new FormData(e.currentTarget);

    formData.set("paid_by", currentUser.id);
    setIsContributeDialogOpen(false);
    const result = await addNewContribution(formData, selectedExpense.id);

    if (!result.success) {
      throw new Error(result.error || "Failed to add contribution!");
    }

    await fetchExpensesData();
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Check if the current user is involved in an expense
  const isUserInvolved = (expense: Expense) => {
    if (!currentUser) return false;

    return (
      expense.paid_by === currentUser.id ||
      expense.split_between.includes(currentUser.id)
    );
  };

  // Get the total contributions for an expense
  const getExpenseContributions = (expenseId: string) => {
    return contributions
      .filter((c) => c.expense_id === expenseId)
      .reduce((sum, c) => sum + c.amount, 0);
  };

  // Get the remaining amount for an expense after contributions
  const getRemainingAmount = (expense: Expense) => {
    const totalContributions = getExpenseContributions(expense.id);
    return Math.max(0, expense.amount - totalContributions);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">
            Track and split household expenses
          </p>
        </div>
        {!loading && hasHouse && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={addExpense}>
                <DialogHeader>
                  <DialogTitle>Add New Expense</DialogTitle>
                  <DialogDescription>
                    Add a new expense to split with your housemates
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Groceries"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ($)</Label>
                    <Input
                      id="amount"
                      type="number"
                      name="amount"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paid-by">Paid By</Label>
                    <Select
                      value={paidBy}
                      defaultValue={currentUser?.id}
                      onValueChange={setPaidBy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select person" />
                      </SelectTrigger>
                      <SelectContent>
                        {houseMembers?.map((user) => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                        />
                      </PopoverContent>
                    </Popover>
                    <input
                      type="hidden"
                      name="date"
                      required
                      value={date ? date.toISOString() : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Split With</Label>
                    <div className="border rounded-md p-4 space-y-2">
                      {houseMembers
                        ?.filter((user) => user.user_id !== paidBy)
                        .map((user) => (
                          <div
                            key={user.user_id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`user-${user.user_id}`}
                              checked={selectedUsers.includes(user.user_id)}
                              onCheckedChange={() =>
                                toggleUserSelection(user.user_id)
                              }
                            />
                            <Label
                              htmlFor={`user-${user.user_id}`}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  {user.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {user.name}
                            </Label>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Expense</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Contribute Dialog */}
        <Dialog
          open={isContributeDialogOpen}
          onOpenChange={setIsContributeDialogOpen}
        >
          <DialogContent>
            <form onSubmit={submitContribution}>
              <DialogHeader>
                <DialogTitle>Make a Contribution</DialogTitle>
                <DialogDescription>
                  Record your payment towards {selectedExpense?.title}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="contribution-amount">Amount ($)</Label>
                  <Input
                    id="contribution-amount"
                    type="number"
                    name="amount"
                    step="0.01"
                    min="0.01"
                    max={
                      selectedExpense
                        ? calculateUserOwes(selectedExpense).toString()
                        : "0"
                    }
                    placeholder="0.00"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    required
                  />
                  {selectedExpense && (
                    <p className="text-xs text-muted-foreground">
                      You owe ${calculateUserOwes(selectedExpense).toFixed(2)}{" "}
                      for this expense
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {contributionDate
                          ? format(contributionDate, "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={contributionDate}
                        onSelect={(date) => date && setContributionDate(date)}
                        initialFocus
                        required
                      />
                    </PopoverContent>
                  </Popover>
                  <input
                    type="hidden"
                    name="date"
                    value={
                      contributionDate ? contributionDate.toISOString() : ""
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contribution-note">Note (optional)</Label>
                  <Textarea
                    id="contribution-note"
                    placeholder="e.g., Venmo payment"
                    name="note"
                    value={contributionNote}
                    onChange={(e) => setContributionNote(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Record Contribution</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <>
            <Skeleton className="w-full h-[300px]" />
            <Skeleton className="w-full h-[300px]" />
          </>
        ) : !hasHouse && currentUser ? (
          <Card className="col-span-2 mt-6">
            <CardContent className="pt-6">
              <EmptyState
                icon={Home}
                title="No House Found"
                description="You need to join or create a house before you can manage expenses."
                action={
                  <Button asChild>
                    <Link href="/profile">Join a House</Link>
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Balances</CardTitle>
                <CardDescription>Who owes what</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {balances?.map(({ user, balance }) => (
                    <div
                      key={user.user_id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                      <div
                        className={`font-medium ${balance > 0 ? "text-green-500" : balance < 0 ? "text-red-500" : ""}`}
                      >
                        {balance > 0
                          ? `+$${balance.toFixed(2)}`
                          : balance < 0
                            ? `-$${Math.abs(balance).toFixed(2)}`
                            : "$0.00"}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
                <CardDescription>Your expense summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">
                      Total Expenses
                    </span>
                    <span className="font-medium">
                      $
                      {expenses
                        .reduce((sum, expense) => sum + expense.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">You Paid</span>
                    <span className="font-medium">
                      $
                      {expenses
                        .filter(
                          (expense) => expense.paid_by === currentUser?.id,
                        )
                        .reduce((sum, expense) => sum + expense.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">Your Share</span>
                    <span className="font-medium">
                      $
                      {expenses
                        .filter(
                          (expense) =>
                            expense.paid_by === currentUser?.id ||
                            (currentUser &&
                              expense.split_between.includes(currentUser.id)),
                        )
                        .reduce((sum, expense) => {
                          const totalPeople = expense.split_between.length + 1;
                          const share = expense.amount / totalPeople;
                          return sum + share;
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-muted-foreground">
                      Your Contributions
                    </span>
                    <span className="font-medium">
                      $
                      {contributions
                        .filter((c) => c.user_id === currentUser?.id)
                        .reduce((sum, c) => sum + c.amount, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-medium">Net Balance</span>
                    <span
                      className={`font-bold ${
                        (balances?.find(
                          (b) => b.user.user_id === currentUser?.id,
                        )?.balance ?? 0 >= 0)
                          ? "text-red-500"
                          : "text-green-500"
                      }`}
                    >
                      $
                      {Math.abs(
                        balances?.find(
                          (b) => b.user.user_id === currentUser?.id,
                        )?.balance ?? 0,
                      ).toFixed(2)}
                      {(balances?.find(
                        (b) => b.user.user_id === currentUser?.id,
                      )?.balance ?? 0) >= 0
                        ? " (you are owed)"
                        : " (you owe)"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : !hasHouse && currentUser ? null : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>All household expenses</CardDescription>
          </CardHeader>
          <CardContent>
            {expenses.length > 0 ? (
              <div className="space-y-4">
                {expenses.map((expense) => {
                  const paidBy = houseMembers?.find(
                    (user) => user.user_id === expense.paid_by,
                  );
                  const sharedWith = expense.split_between
                    .map(
                      (id) =>
                        houseMembers?.find((user) => user.user_id === id)?.name,
                    )
                    .join(", ");

                  const userOwes = calculateUserOwes(expense);
                  const totalContributions = getExpenseContributions(
                    expense.id,
                  );
                  const remainingAmount = getRemainingAmount(expense);
                  const userContributions = contributions
                    .filter(
                      (c) =>
                        c.expense_id === expense.id &&
                        c.user_id === currentUser?.id,
                    )
                    .reduce((sum, c) => sum + c.amount, 0);

                  const isInvolved = isUserInvolved(expense);
                  const canContribute = isInvolved && userOwes > 0;

                  return (
                    <div
                      key={expense.id}
                      className="flex flex-col border rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-4">
                          <DollarSign className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{expense.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback>
                                  {paidBy?.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span>Paid by {paidBy?.name}</span>
                            </div>
                            {sharedWith && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Shared with: {sharedWith}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            ${expense.amount.toFixed(2)}
                          </p>
                          {totalContributions > 0 && (
                            <p className="text-xs text-muted-foreground">
                              ${remainingAmount.toFixed(2)} remaining
                            </p>
                          )}
                        </div>
                      </div>

                      {isInvolved && (
                        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
                          <div>
                            {expense.paid_by === currentUser?.id ? (
                              <Badge variant="outline" className="bg-green-500">
                                You paid
                              </Badge>
                            ) : userOwes > 0 ? (
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="bg-red-500">
                                  You owe ${userOwes.toFixed(2)}
                                </Badge>
                                {userContributions > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-500"
                                  >
                                    Contributed ${userContributions.toFixed(2)}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <Badge variant="outline" className="bg-green-500">
                                Paid in full
                              </Badge>
                            )}
                          </div>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleContribute(expense)}
                                    disabled={!canContribute}
                                  >
                                    <CreditCard className="mr-2 h-4 w-4" />
                                    Contribute
                                  </Button>
                                </div>
                              </TooltipTrigger>
                              {!canContribute &&
                                expense.paid_by !== currentUser?.id && (
                                  <TooltipContent>
                                    {userOwes <= 0
                                      ? "You've already paid your share"
                                      : "You're not involved in this expense"}
                                  </TooltipContent>
                                )}
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      )}

                      {/* Show contributions if any exist */}
                      {contributions.filter((c) => c.expense_id === expense.id)
                        .length > 0 && (
                        <div className="mt-3 pt-2 border-t">
                          <p className="text-xs font-medium mb-1">
                            Contributions:
                          </p>
                          <div className="space-y-1">
                            {contributions
                              .filter((c) => c.expense_id === expense.id)
                              .map((contribution) => {
                                const contributor = houseMembers?.find(
                                  (u) => u.user_id === contribution.user_id,
                                );
                                return (
                                  <div
                                    key={contribution.id}
                                    className="flex justify-between text-xs text-muted-foreground"
                                  >
                                    <span>
                                      {contributor?.name} •{" "}
                                      {new Date(
                                        contribution.date,
                                      ).toLocaleDateString()}
                                      {contribution.note &&
                                        ` • ${contribution.note}`}
                                    </span>
                                    <span>
                                      ${contribution.amount.toFixed(2)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
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
                  <Button
                    disabled={submitting}
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
