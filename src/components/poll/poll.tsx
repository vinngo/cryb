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
import { Checkbox } from "../ui/checkbox";
import { Button } from "../ui/button";
import { PollProps } from "../../../types/poll";
import { PollOption } from "../../../types/database";
import { useUserStore } from "@/lib/stores/usersStore";
import { votePoll } from "./actions";
import { removeVote } from "./actions";
import { useState } from "react";

export default function Poll({
  id,
  title,
  multipleChoice,
  options,
  expires_at,
}: PollProps) {
  const { user } = useUserStore();

  const [selectedOption, setSelectedOption] = useState<PollOption | undefined>(
    undefined,
  );
  const [selectedOptions, setSelectedOptions] = useState<PollOption[]>([]);
  const [voted, setVoted] = useState<boolean>(false);
  const [votedOption, setVotedOption] = useState<PollOption | undefined>(
    undefined,
  );

  const calculateTimeLeft = () => {
    const now = new Date();
    if (typeof expires_at === "string") {
      expires_at = new Date(expires_at);
    }
    const timeLeft = expires_at.getTime() - now.getTime();
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
    );
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    return { days, hours, minutes };
  };

  const { days, hours, minutes } = calculateTimeLeft();

  const handleMultipleChoiceClick = (optionId: string) => {
    // Implement logic to handle multiple choice click
    //@ts-expect-error this should work regardless
    setSelectedOptions((prevOptions) => {
      if (prevOptions.some((option) => option.id === optionId)) {
        return prevOptions.filter((option) => option.id !== optionId);
      } else {
        return [
          ...prevOptions,
          options.find((option) => option.id === optionId),
        ];
      }
    });
  };

  const handleSingleChoiceClick = (optionId: string) => {
    setSelectedOption(options.find((option) => option.id === optionId));
  };

  const handleVote = async () => {
    if (!user) {
      return;
    }
    if (!selectedOption && selectedOptions.length === 0) {
      return;
    }
    setVoted(true);
    if (selectedOption) {
      const { success, error } = await votePoll(id, user.id, selectedOption.id);
      if (!success) {
        console.error(error);
        setVoted(false);
      }
    } else {
      const { success, error } = await votePoll(
        id,
        user.id,
        undefined,
        selectedOptions,
      );
      if (!success) {
        console.error(error);
        setVoted(false);
      }
    }
  };

  const handleRemoveVote = async () => {};

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
              onClick={() => handleMultipleChoiceClick(option.id)}
            >
              <label htmlFor={option.option_text}>{option.option_text}</label>
              <Checkbox
                id={option.id}
                onChange={() => handleMultipleChoiceClick(option.id)}
                checked={selectedOptions.some(
                  (selectedOption) => selectedOption.id === option.id,
                )}
              />
            </div>
          ))
        ) : (
          <RadioGroup value={selectedOption?.option_text}>
            {options.map((option) => (
              <div
                className="flex items-center justify-between space-x-2 rounded-lg border p-4"
                key={option.id}
                onClick={() => handleSingleChoiceClick(option.id)}
              >
                <label htmlFor={option.option_text}>{option.option_text}</label>
                <RadioGroupItem
                  value={option.option_text}
                  id={option.id}
                  onChange={() => handleSingleChoiceClick(option.id)}
                />
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{`${days}d ${hours}h ${minutes}m`}</span>
        </div>
        <div className="flex items-center gap-4">
          {voted ? (
            <Button onClick={() => handleRemoveVote()}>Remove Vote</Button>
          ) : (
            <Button onClick={() => handleVote()}>Vote</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
