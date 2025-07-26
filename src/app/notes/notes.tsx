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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PinIcon, Plus, Trash2, Home } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import Poll from "@/components/poll/poll";
import { useNotesStore } from "@/lib/stores/notesStore";
import { usePollStore } from "@/lib/stores/pollsStore";
import {
  addNewNote,
  togglePinned,
  deleteNoteAction,
  addNewPoll,
} from "./actions";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRootStore } from "@/lib/stores/rootStore";

export interface Option {
  id: number;
  text: string;
}

export default function NotesPage() {
  const {
    notes: notesData,
    loading: notesLoading,
    fetchNotesData,
  } = useNotesStore();
  const { user, houseMembers: members } = useRootStore.getState();
  const [notes, setNotes] = useState(notesData);
  const {
    polls: pollsData,
    loading: pollsLoading,
    fetchPollData,
  } = usePollStore();
  const [polls, setPolls] = useState(pollsData);
  const [pollOptions, setPollOptions] = useState<Option[]>([
    { id: 0, text: "Type your answer" },
  ]);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isMultChoice, setIsMultChoice] = useState(false);
  const [duration, setDuration] = useState("24 hours");
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  // Get current user (in a real app, this would come from auth)
  const currentUser = user;

  useEffect(() => {
    fetchNotesData();
    useNotesStore.getState().setupRealtimeNoteSubscription();
    return () => {
      useNotesStore.getState().cleanupRealtimeNoteSubscription();
    };
  }, [fetchNotesData]);

  useEffect(() => {
    fetchPollData();
    usePollStore.getState().setupRealtimeSubscription();
    return () => {
      usePollStore.getState().cleanupRealtimeSubscription();
    };
  }, [fetchPollData]);

  useEffect(() => {
    setNotes(notesData);
  }, [notesData]);

  useEffect(() => {
    setPolls(pollsData);
  }, [pollsData]);

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

    setIsDialogOpen(false);
    setIsPinned(false);
  };

  const addPoll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pollOptions.length < 2) {
      toast({
        title: "Error",
        description: "Poll must have at least two options",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    formData.set("mult_choice", isMultChoice ? "true" : "false");

    const result = await addNewPoll(
      formData,
      pollOptions,
      currentUser?.house_id,
      currentUser?.id,
    );

    if (!result?.success) {
      console.error(result?.error || "Failed to add poll");
    }

    const pollStore = usePollStore.getState();
    pollStore.cleanupRealtimeSubscription();
    pollStore.cleanupRealtimeSubscription();

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
  };

  const deleteNote = async (id: string) => {
    // Store original notes for potential revert
    const originalNotes = [...notes];

    // Optimistic UI update
    setNotes(notes.filter((note) => note.id !== id));

    const { success } = await deleteNoteAction(id);

    if (!success) {
      // Revert to original notes if deletion fails
      setNotes(originalNotes);
    }
  };

  const addOption = () => {
    setPollOptions([
      ...pollOptions,
      { id: pollOptions.length + 1, text: "Type your answer" },
    ]);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    option_id: string,
  ) => {
    e.preventDefault();
    setPollOptions(
      pollOptions.map((option) => {
        if (String(option.id) === option_id) {
          return { ...option, text: e.target.value };
        }
        return option;
      }),
    );
  };

  const removeOption = (id: number) => {
    setPollOptions(pollOptions.filter((option) => option.id !== id));
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
        {pollsLoading || notesLoading ? (
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
              <DialogHeader>
                <DialogTitle>Add New Note</DialogTitle>
                <DialogDescription>
                  Create a new note or poll for your house
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[400px] -mx-6">
                <div className="px-6">
                  <Tabs className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="note">Note</TabsTrigger>
                      <TabsTrigger value="poll">Poll</TabsTrigger>
                    </TabsList>
                    <TabsContent value="note">
                      <form onSubmit={addNote}>
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
                    </TabsContent>
                    <TabsContent value="poll">
                      <form onSubmit={addPoll}>
                        <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="question">Question</Label>
                            <Input
                              id="question"
                              name="question"
                              placeholder="e.g., What's for dinner?"
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="options">Answers</Label>
                            <div className="space-y-2">
                              {pollOptions.map((option) => {
                                return (
                                  <div
                                    key={option.id}
                                    className="flex items-center rounded-lg border p-4 space-x-2"
                                  >
                                    <Input
                                      id={`option-${option.id}`}
                                      name={`option-${option.id}`}
                                      onChange={(e) =>
                                        handleInputChange(e, String(option.id))
                                      }
                                      placeholder="Type your answer"
                                      required
                                    />
                                    <Button
                                      variant="ghost"
                                      onClick={() => removeOption(option.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={addOption}
                                className="w-full flex gap-2 rounded-lg border p-4"
                              >
                                <Plus className="h-4 w-4" />
                                Add option
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Duration</Label>
                            <Select onValueChange={setDuration}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="24 hours" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1 hour">1 hour</SelectItem>
                                <SelectItem value="4 hours">4 hours</SelectItem>
                                <SelectItem value="8 hours">8 hours</SelectItem>
                                <SelectItem value="24 hours">
                                  24 hours
                                </SelectItem>
                                <SelectItem value="3 days">3 days</SelectItem>
                                <SelectItem value="1 week">1 week</SelectItem>
                                <SelectItem value="2 weeks">2 weeks</SelectItem>
                              </SelectContent>
                            </Select>
                            <input
                              type="hidden"
                              name="duration"
                              value={duration}
                            ></input>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="pin"
                              checked={isMultChoice}
                              onCheckedChange={setIsMultChoice}
                            />
                            <Label htmlFor="mulchoice">
                              Allow Multiple Choice
                            </Label>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="submit">Create Poll</Button>
                        </DialogFooter>
                      </form>
                    </TabsContent>
                  </Tabs>
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        ) : null}
      </div>

      {notesLoading ? (
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
                  const author = members?.find(
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
        {notesLoading || pollsLoading ? (
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
                const author = members?.find(
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
            {polls.map((poll) => (
              <Poll
                key={poll.id}
                id={poll.id}
                title={poll.title}
                multipleChoice={poll.multipleChoice}
                options={poll.options}
                votes={poll.votes}
                created_at={poll.created_at}
                expires_at={poll.expires_at}
              />
            ))}

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
