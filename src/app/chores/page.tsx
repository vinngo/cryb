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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { CalendarIcon, Plus } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { mockChores, mockUsers } from "@/lib/mock-data";

export default function ChoresPage() {
  const [chores, setChores] = useState(mockChores);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date>();

  const toggleChoreCompletion = (id: string) => {
    setChores(
      chores.map((chore) =>
        chore.id === id ? { ...chore, completed: !chore.completed } : chore,
      ),
    );
  };

  const addChore = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would add the chore to the database
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chores</h1>
          <p className="text-muted-foreground">
            Manage and track household chores
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Chore
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={addChore}>
              <DialogHeader>
                <DialogTitle>Add New Chore</DialogTitle>
                <DialogDescription>
                  Create a new chore for your household
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Clean kitchen"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Assigned To</Label>
                  <Select>
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
                  <Label>Due Date</Label>
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
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="once">Once</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Chore</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Chores</CardTitle>
            <CardDescription>Chores that need to be completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chores
                .filter((chore) => !chore.completed)
                .map((chore) => {
                  const assignedTo = mockUsers.find(
                    (user) => user.id === chore.assignedTo,
                  );
                  return (
                    <div
                      key={chore.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={chore.completed}
                          onCheckedChange={() =>
                            toggleChoreCompletion(chore.id)
                          }
                        />
                        <div>
                          <p className="font-medium">{chore.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={
                                  assignedTo?.avatarUrl || "/placeholder.svg"
                                }
                                alt={assignedTo?.name}
                              />
                              <AvatarFallback>
                                {assignedTo?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{assignedTo?.name}</span>
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

              {chores.filter((chore) => !chore.completed).length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No active chores. Great job!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed Chores</CardTitle>
            <CardDescription>Recently completed chores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chores
                .filter((chore) => chore.completed)
                .map((chore) => {
                  const assignedTo = mockUsers.find(
                    (user) => user.id === chore.assignedTo,
                  );
                  return (
                    <div
                      key={chore.id}
                      className="flex items-center justify-between border-b pb-4"
                    >
                      <div className="flex items-center gap-4">
                        <Checkbox
                          checked={chore.completed}
                          onCheckedChange={() =>
                            toggleChoreCompletion(chore.id)
                          }
                        />
                        <div>
                          <p className="font-medium line-through text-muted-foreground">
                            {chore.title}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={
                                  assignedTo?.avatarUrl || "/placeholder.svg"
                                }
                                alt={assignedTo?.name}
                              />
                              <AvatarFallback>
                                {assignedTo?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{assignedTo?.name}</span>
                            <span>•</span>
                            <span>
                              Completed on {new Date().toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {chores.filter((chore) => chore.completed).length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No completed chores yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
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
