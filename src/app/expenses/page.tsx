"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { CalendarIcon, DollarSign, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { mockExpenses, mockUsers } from "@/lib/mock-data";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState(mockExpenses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Get current user (in a real app, this would come from auth)
  const currentUser = mockUsers[0];

  // Calculate balances
  const balances = mockUsers.map((user) => {
    let balance = 0;

    // Calculate what this user owes to others
    expenses.forEach((expense) => {
      if (expense.sharedWith.includes(user.id) && expense.paidBy !== user.id) {
        // Simple split calculation for demo
        const splitAmount = expense.amount / (expense.sharedWith.length + 1);
        balance -= splitAmount;
      }
    });

    // Calculate what others owe to this user
    expenses.forEach((expense) => {
      if (expense.paidBy === user.id && expense.sharedWith.length > 0) {
        // Simple split calculation for demo
        const splitAmount =
          (expense.amount / (expense.sharedWith.length + 1)) *
          expense.sharedWith.length;
        balance += splitAmount;
      }
    });

    return {
      user,
      balance,
    };
  });

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would add the expense to the database
    setIsDialogOpen(false);
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
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
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Input id="title" placeholder="e.g., Groceries" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount ($)</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paid-by">Paid By</Label>
                  <Select defaultValue={currentUser.id}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
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
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Split With</Label>
                  <div className="border rounded-md p-4 space-y-2">
                    {mockUsers
                      .filter((user) => user.id !== currentUser.id)
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center space-x-2"
                        >
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => toggleUserSelection(user.id)}
                          />
                          <Label
                            htmlFor={`user-${user.id}`}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={user.avatarUrl || "/placeholder.svg"}
                                alt={user.name}
                              />
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Balances</CardTitle>
            <CardDescription>Who owes what</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {balances.map(({ user, balance }) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={user.avatarUrl || "/placeholder.svg"}
                        alt={user.name}
                      />
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
                <span className="text-muted-foreground">Total Expenses</span>
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
                    .filter((expense) => expense.paidBy === currentUser.id)
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
                        expense.paidBy === currentUser.id ||
                        expense.sharedWith.includes(currentUser.id),
                    )
                    .reduce((sum, expense) => {
                      const totalPeople = expense.sharedWith.length + 1;
                      const share = expense.amount / totalPeople;
                      return sum + share;
                    }, 0)
                    .toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-medium">Net Balance</span>
                <span
                  className={`font-bold ${balances.find((b) => b.user.id === currentUser.id)?.balance! > 0 ? "text-green-500" : "text-red-500"}`}
                >
                  $
                  {Math.abs(
                    balances.find((b) => b.user.id === currentUser.id)
                      ?.balance || 0,
                  ).toFixed(2)}
                  {balances.find((b) => b.user.id === currentUser.id)
                    ?.balance! >= 0
                    ? " (you are owed)"
                    : " (you owe)"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>All household expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => {
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
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={paidBy?.avatarUrl || "/placeholder.svg"}
                            alt={paidBy?.name}
                          />
                          <AvatarFallback>
                            {paidBy?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
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
                  <p className="font-medium">${expense.amount.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
