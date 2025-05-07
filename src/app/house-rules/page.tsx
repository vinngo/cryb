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

export default function HouseRulesPage() {
  const [isEditing, setIsEditing] = useState(false);
  const [rules, setRules] = useState(`# House Rules & Roommate Agreement

## Quiet Hours
- Sunday-Thursday: 10:00 PM - 8:00 AM
- Friday-Saturday: 12:00 AM - 9:00 AM

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
- Bills due by the 5th of each month
- Venmo preferred for payments

## Conflict Resolution
- Discuss issues directly and respectfully
- House meetings as needed, minimum once per month
- Majority vote for unresolved issues

Last updated: May 5, 2023`);

  const saveRules = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would save the rules to the database
    setIsEditing(false);
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
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <Button>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit Rules
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
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>House Rules & Roommate Agreement</CardTitle>
          <CardDescription>Last updated: May 5, 2023</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h2>Quiet Hours</h2>
            <ul>
              <li>Sunday-Thursday: 10:00 PM - 8:00 AM</li>
              <li>Friday-Saturday: 12:00 AM - 9:00 AM</li>
            </ul>

            <h2>Guests</h2>
            <ul>
              <li>
                Please notify all housemates at least 24 hours before having
                overnight guests
              </li>
              <li>
                Guests should not stay more than 3 consecutive nights without
                prior agreement
              </li>
              <li>Guests must respect all house rules</li>
            </ul>

            <h2>Cleaning</h2>
            <ul>
              <li>Kitchen: Clean dishes within 24 hours of use</li>
              <li>
                Bathroom: Each person cleans once per week (see chore schedule)
              </li>
              <li>
                Common areas: Vacuum and dust every Sunday (rotating schedule)
              </li>
            </ul>

            <h2>Shared Items</h2>
            <ul>
              <li>
                Groceries: Label personal items, shared items noted on
                whiteboard
              </li>
              <li>Appliances: Free to use but clean after use</li>
              <li>Toiletries: Personal unless explicitly shared</li>
            </ul>

            <h2>Utilities</h2>
            <ul>
              <li>All utilities split equally</li>
              <li>Bills due by the 5th of each month</li>
              <li>Venmo preferred for payments</li>
            </ul>

            <h2>Conflict Resolution</h2>
            <ul>
              <li>Discuss issues directly and respectfully</li>
              <li>House meetings as needed, minimum once per month</li>
              <li>Majority vote for unresolved issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
