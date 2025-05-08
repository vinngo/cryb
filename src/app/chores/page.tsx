"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { useSearchParams } from "next/navigation";
import { useChoreStore } from "@/lib/stores/choresStore";
import addNewChore, { updateChore } from "./actions";
import { Chore } from "../../../types/database";

export default function ChoresPage() {
  const searchParams = useSearchParams();
  const {
    chores: choresData,
    members,
    user,
    fetchChoresData,
  } = useChoreStore();

  // Local state
  const [chores, setChores] = useState(choresData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [assignedTo, setAssignedTo] = useState<string>("");

  // Initial data fetch
  useEffect(() => {
    fetchChoresData();
  }, [fetchChoresData]);

  // Keep local chores state in sync with store data
  useEffect(() => {
    setChores(choresData);
  }, [choresData]);

  // Check for URL parameters
  useEffect(() => {
    const action = searchParams.get("action");
    if (action === "new") {
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  const toggleChoreCompletion = async (id: string, currentStatus: boolean) => {
    try {
      // Call the server action to update the chore
      setChores((prevChores: Array<Chore>) =>
        prevChores.map((chore: Chore) =>
          chore.id === id ? { ...chore, completed: !currentStatus } : chore,
        ),
      );

      const result = await updateChore(id, !currentStatus);

      if (!result.success) {
        console.error("Server update failed:", result.error);
        // Revert the local state change
        setChores((prevChores) =>
          prevChores.map((chore) =>
            chore.id === id ? { ...chore, completed: currentStatus } : chore,
          ),
        );
        return;
      }

      // Fetch updated data from the server
      await fetchChoresData();

      // No need to manually update local state as it will be updated via the useEffect
    } catch (error) {
      console.error("Error toggling chore completion:", error);
    }
  };

  const addChore = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Get FormData from the form event
    const formData = new FormData(e.currentTarget);

    // Manually add assignedTo value to formData
    formData.set("assigned_to", assignedTo);

    // Call the server action with the FormData
    await addNewChore(formData, user?.house_id);

    // Fetch updated chores data from the server
    await fetchChoresData();

    // Reset form state
    setDate(undefined);
    setAssignedTo("");

    // Close the dialog
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setDate(undefined);
    setAssignedTo("");
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
                    name="title"
                    placeholder="e.g., Clean kitchen"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Assigned To</Label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger id="assigned-to">
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
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
                        type="button"
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
                  <input
                    type="hidden"
                    name="due_date"
                    value={date ? date.toISOString() : ""}
                  />
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
                  const assignedTo = members.find(
                    (user) => user.user_id === chore.assigned_to,
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
                            toggleChoreCompletion(chore.id, chore.completed)
                          }
                        />
                        <div>
                          <p className="font-medium">{chore.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>
                                {assignedTo?.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span>{assignedTo?.name}</span>
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
                  const assignedTo = members.find(
                    (user) => user.user_id === chore.assigned_to,
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
                            toggleChoreCompletion(chore.id, chore.completed)
                          }
                        />
                        <div>
                          <p className="font-medium line-through text-muted-foreground">
                            {chore.title}
                          </p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6">
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
