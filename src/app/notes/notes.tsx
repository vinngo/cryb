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
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PinIcon, Plus, Trash2, Home } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotesStore } from "@/lib/stores/notesStore";
import { addNewNote, togglePinned, deleteNoteAction } from "./actions";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

export default function NotesPage() {
  const {
    notes: notesData,
    user,
    members,
    loading,
    fetchNotesData,
  } = useNotesStore();
  const [notes, setNotes] = useState(notesData);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const searchParams = useSearchParams();
  const action = searchParams.get("action");

  // Get current user (in a real app, this would come from auth)
  const currentUser = user;

  useEffect(() => {
    setNotes(notesData);
  }, [notesData]);

  useEffect(() => {
    if (action === "new") {
      setIsDialogOpen(true);
    }
  }, [action]);

  // Check if user has a house
  const hasHouse = currentUser?.house_id != null;

  const addNote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // In a real app, we would add the note to the database
    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("is_pinned", isPinned ? "true" : "false");

    const result = await addNewNote(
      formData,
      currentUser?.house_id,
      currentUser?.id,
    );

    console.log(result);

    if (!result?.success) {
      throw new Error(result?.error || "Failed to add note");
    }

    await fetchNotesData();

    setIsDialogOpen(false);
    setIsPinned(false);
  };

  const togglePin = async (id: string) => {
    setNotes(
      notes.map((note) =>
        note.id === id ? { ...note, is_pinned: !note.is_pinned } : note,
      ),
    );

    const pinned_status = notes.filter((note) => note.id === id)[0].is_pinned;

    const { success } = await togglePinned(id, pinned_status);

    if (!success) {
      //revert anticipated change
      setNotes(
        notes.map((note) =>
          note.id === id ? { ...note, is_pinned: !note.is_pinned } : note,
        ),
      );
    }
    await fetchNotesData();
  };

  const deleteNote = async (id: string) => {
    setNotes(notes.filter((note) => note.id !== id));
    const { success } = await deleteNoteAction(id);

    if (!success) {
      setNotes(notes.filter((note) => note.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Notes & Bulletin Board
          </h1>
          <p className="text-muted-foreground">
            Share important information with your housemates
          </p>
        </div>
        {loading ? (
          <div className="h-10 w-[120px]">
            <Skeleton className="h-full w-full" />
          </div>
        ) : hasHouse ? (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={addNote}>
                <DialogHeader>
                  <DialogTitle>Add New Note</DialogTitle>
                  <DialogDescription>
                    Create a new note or announcement for your house
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., House Meeting"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      name="content"
                      placeholder="Write your note here..."
                      className="min-h-[120px]"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="pin"
                      checked={isPinned}
                      onCheckedChange={setIsPinned}
                    />
                    <Label htmlFor="pin">Pin this note</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Note</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {loading ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pinned Notes</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        </div>
      ) : !hasHouse ? (
        <Card className="mt-10">
          <CardContent className="pt-6">
            <EmptyState
              icon={Home}
              title="No House Found"
              description="You need to join or create a house before you can see and create notes."
              action={
                <Button asChild>
                  <Link href="/profile">Join a House</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        notes.some((note) => note.is_pinned) && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pinned Notes</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {notes
                .filter((note) => note.is_pinned)
                .map((note) => {
                  const author = members.find(
                    (user) => user.user_id === note.created_by,
                  );
                  return (
                    <Card key={note.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {note.title}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePin(note.id)}
                              className="h-8 w-8"
                            >
                              <PinIcon className="h-4 w-4 text-yellow-500" />
                              <span className="sr-only">Unpin</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNote(note.id)}
                              className="h-8 w-8 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              {author?.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            By {author?.name} •{" "}
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-line">{note.content}</p>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          </div>
        )
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">All Notes</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
            <Skeleton className="h-[180px] w-full" />
          </div>
        ) : !hasHouse ? null : (
          <div className="grid gap-4 md:grid-cols-2">
            {notes
              .filter((note) => !note.is_pinned)
              .map((note) => {
                const author = members.find(
                  (user) => user.user_id === note.created_by,
                );
                return (
                  <Card key={note.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => togglePin(note.id)}
                            className="h-8 w-8"
                          >
                            <PinIcon className="h-4 w-4" />
                            <span className="sr-only">Pin</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteNote(note.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                      <CardDescription className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            {author?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          By {author?.name} •{" "}
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="whitespace-pre-line">{note.content}</p>
                    </CardContent>
                  </Card>
                );
              })}

            {notes.filter((note) => !note.is_pinned).length === 0 && (
              <p className="text-muted-foreground col-span-2 text-center py-8">
                No notes yet. Create one to get started!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
