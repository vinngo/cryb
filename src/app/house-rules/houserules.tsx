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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Edit2 } from "lucide-react";
import { useRulesStore } from "@/lib/stores/rulesStore";
import { useRootStore } from "@/lib/stores/rootStore";
import { saveHouseRules } from "./actions";
import { format } from "date-fns";

export default function HouseRulesPage() {
  const { rules: rulesData, fetchRulesForce, loading } = useRulesStore();
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useRootStore();

  useEffect(() => {
    console.log(user);
  }, [user]);
  // Template for new house rules
  const DEFAULT_TEMPLATE = `# House Rules Template

## Guests
- Please notify all housemates at least 24 hours before having overnight guests
- Guests should not stay more than 3 consecutive nights without prior agreement
- Guests must respect all house rules

## Cleaning
- Kitchen: Clean dishes within 24 hours of use
- Bathroom: Each person cleans once per week (see chore schedule)
- Common areas: Vacuum and dust every Sunday (rotating schedule)

## Shared Items
- Groceries: Label personal items, shared items noted on whiteboard
- Appliances: Free to use but clean after use
- Toiletries: Personal unless explicitly shared

## Utilities
- All utilities split equally
- Zelle preferred for payments

## Conflict Resolution
- Discuss issues directly and respectfully
- House meetings as needed, minimum once per month
- Majority vote for unresolved issues`;

  const [rules, setRules] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set rules content from data or template for new rules
  useEffect(() => {
    setRules(rulesData?.markdown_content || DEFAULT_TEMPLATE);
  }, [rulesData, DEFAULT_TEMPLATE]);

  const saveRules = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id || !user?.house_id) {
      setError("User must be part of a house to create rules");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("rules", rules);

      const result = await saveHouseRules(formData, user.id, user.house_id);

      if (!result.success) {
        throw new Error(result.error || "Failed to save rules");
      }

      // Refresh rules data
      await fetchRulesForce();

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save rules:", error);
      setError(error instanceof Error ? error.message : "Failed to save rules");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">House Rules</h1>
          <p className="text-muted-foreground">
            Roommate agreement and house guidelines
          </p>
        </div>
        <Dialog
          open={isEditing}
          onOpenChange={(open) => {
            if (!isSaving) setIsEditing(open);
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Edit2 className="mr-2 h-4 w-4" />
              {rulesData ? "Edit Rules" : "Create Rules"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <form onSubmit={saveRules}>
              <DialogHeader>
                <DialogTitle>Edit House Rules</DialogTitle>
                <DialogDescription>
                  Update your house rules and roommate agreement
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <Label htmlFor="rules">Rules (Markdown supported)</Label>
                  <Textarea
                    id="rules"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className="min-h-[400px] font-mono text-sm"
                    required
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="w-full sm:w-auto"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <Card className="p-8">
          <div className="flex justify-center items-center h-40">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-pulse h-6 w-40 bg-muted rounded"></div>
              <p className="text-muted-foreground">Loading house rules...</p>
            </div>
          </div>
        </Card>
      ) : rulesData ? (
        <Card>
          <CardHeader>
            <CardTitle>House Rules</CardTitle>
            <CardDescription>
              Last updated:{" "}
              {rulesData.updated_at
                ? format(new Date(rulesData.updated_at), "MMMM d, yyyy")
                : "N/A"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none whitespace-pre-wrap">
              {rulesData.markdown_content.split("\n").map((line, index) => {
                // Apply some basic formatting for markdown headings and lists
                if (line.startsWith("# ")) {
                  return (
                    <h1 key={index} className="text-2xl font-bold mt-6 mb-4">
                      {line.substring(2)}
                    </h1>
                  );
                } else if (line.startsWith("## ")) {
                  return (
                    <h2 key={index} className="text-xl font-bold mt-5 mb-3">
                      {line.substring(3)}
                    </h2>
                  );
                } else if (line.startsWith("- ")) {
                  return (
                    <li key={index} className="ml-5 mb-1">
                      {line.substring(2)}
                    </li>
                  );
                } else if (line === "") {
                  return <br key={index} />;
                }
                return (
                  <p key={index} className="mb-2">
                    {line}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No House Rules Yet</CardTitle>
            <CardDescription>
              Establish guidelines for a harmonious living environment
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-6 text-center">
            <div className="max-w-md space-y-4">
              <div className="flex flex-col items-center mb-4">
                <div className="bg-muted p-3 rounded-full mb-3">
                  <Edit2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">
                  Create Your House Rules
                </h3>
              </div>
              <p className="text-muted-foreground">
                Setting clear expectations helps everyone in your house live
                together smoothly. Consider including guidelines for:
              </p>
              <ul className="text-sm text-muted-foreground text-left pl-5 pt-2 space-y-2 list-disc">
                <li>Quiet hours</li>
                <li>Guest policies</li>
                <li>Cleaning responsibilities</li>
                <li>Shared items and spaces</li>
                <li>Utility bills</li>
                <li>Conflict resolution</li>
              </ul>
              <p className="text-sm text-muted-foreground">
                A template will be provided to help you get started.
              </p>
            </div>
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              Create House Rules
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
