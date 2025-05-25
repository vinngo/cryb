"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { PollProps } from "../../types/poll";

export default function Poll({
  title,
  multipleChoice,
  options,
  expires_at,
}: PollProps) {
  const calculateTimeLeft = () => {
    const now = new Date();
    const timeLeft = expires_at.getTime() - now.getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    return { days, hours, minutes, seconds };
  };

  const { days, hours, minutes, seconds } = calculateTimeLeft();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {multipleChoice ? (
          <CardDescription>Select one or more answers</CardDescription>
        ) : (
          <CardDescription>Select one answer</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {multipleChoice ? (
          options.map((option) => (
            <div
              key={option.id}
              className="flex item-center justify-between space-x-2 rounded-lg border p-4"
            >
              <label htmlFor={option.option_text}>{option.option_text}</label>
              <Checkbox />
            </div>
          ))
        ) : (
          <RadioGroup>
            {options.map((option) => (
              <div
                className="flex items-center justify-between space-x-2 rounded-lg border p-4"
                key={option.id}
              >
                <label htmlFor={option.option_text}>{option.option_text}</label>
                <RadioGroupItem value={option.option_text} id={option.id} />
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span>{`${days}d ${hours}h ${minutes}m ${seconds}s`}</span>
        </div>
        <div className="flex items-center gap-4">
          <Button>Vote</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
