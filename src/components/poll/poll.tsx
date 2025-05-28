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
import { PollOption, PollVote } from "../../../types/database";
import { useUserStore } from "@/lib/stores/usersStore";
import { votePoll, removeVote, removeVotes } from "./actions";
import { useState, useEffect } from "react";

export default function Poll({
  id,
  title,
  multipleChoice,
  options,
  votes: initialVotesData,
  expires_at,
}: PollProps) {
  const { user } = useUserStore();

  const [votesData, setVotesData] = useState(initialVotesData);

  const [selectedOption, setSelectedOption] = useState<PollOption | undefined>(
    undefined,
  );
  const [selectedOptions, setSelectedOptions] = useState<PollOption[]>([]);
  const [vote, setVote] = useState<PollVote | undefined>(undefined);
  const [votes, setVotes] = useState<PollVote[]>([]);

  useEffect(() => {
    if (multipleChoice) {
      setVotes(votesData.filter((vote) => vote.user_id === user?.id));
    } else {
      //select one single vote
      setVote(votesData.find((vote) => vote.user_id === user?.id));
    }
  }, [user, votesData, multipleChoice]);

  const [voted, setVoted] = useState<boolean>(false);

  useEffect(() => {
    if (multipleChoice) {
      setVoted(votes.map((vote) => vote.user_id === user?.id).length > 0);
    } else {
      setVoted(vote !== undefined);
    }
  }, [votes, voted, user?.id, multipleChoice, vote]);

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
    if (voted) return;
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
    if (voted) return;
    setSelectedOption(options.find((option) => option.id === optionId));
  };

  const handleVote = async () => {
    if (!user) {
      return;
    }
    if (!selectedOption && selectedOptions.length === 0) {
      return;
    }

    // Store original data for potential rollback
    const originalVotesData = [...votesData];

    // Optimistically update UI
    setVoted(true);

    if (selectedOption) {
      // Create optimistic vote
      const optimisticVote: PollVote = {
        id: `temp-${Date.now()}`,
        poll_id: id,
        user_id: user.id,
        option_id: selectedOption.id,
        created_at: new Date(),
      };

      // Update UI optimistically
      setVote(optimisticVote);
      setVotesData((prev) => [...prev, optimisticVote]);

      // Make the actual API call
      const { data, success, error } = await votePoll(
        id,
        user.id,
        selectedOption.id,
      );

      if (!success || !data || error) {
        console.error(error);
        // Undo optimistic update
        setVoted(false);
        setVote(undefined);
        setVotesData(originalVotesData);
      } else {
        // Replace optimistic data with real data
        const newVote = data as PollVote;
        setVote(newVote);
        setVotesData((prev) =>
          prev.map((v) => (v.id === optimisticVote.id ? newVote : v)),
        );
      }
    } else {
      // Create optimistic votes for multiple selection
      const optimisticVotes: PollVote[] = selectedOptions.map((option) => ({
        id: `temp-${option.id}-${Date.now()}`,
        poll_id: id,
        user_id: user.id,
        option_id: option.id,
        created_at: new Date(),
      }));

      // Update UI optimistically
      setVotes(optimisticVotes);
      setVotesData((prev) => [...prev, ...optimisticVotes]);

      // Make the actual API call
      const { data, success, error } = await votePoll(
        id,
        user.id,
        undefined,
        selectedOptions,
      );

      if (!success || !data || error) {
        console.error(error);
        // Undo optimistic update
        setVoted(false);
        setVotes([]);
        setVotesData(originalVotesData);
      } else {
        // Replace optimistic data with real data
        const newVotes = data as PollVote[];
        setVotes(newVotes);

        // Remove optimistic votes and add real ones
        setVotesData((prev) => {
          const filtered = prev.filter(
            (v) => !optimisticVotes.some((ov) => ov.id === v.id),
          );
          return [...filtered, ...newVotes];
        });
      }
    }
  };

  const handleRemoveVote = async () => {
    if (!vote && votes.length === 0) return;
    setVoted(false);

    // Store original data for potential rollback
    const originalVotesData = [...votesData];

    if (vote) {
      setVotesData((prev) =>
        prev.filter(
          (v) => !(v.user_id === user?.id && v.option_id === vote.option_id),
        ),
      );
      const { success, error } = await removeVote(vote.option_id);
      if (!success) {
        console.error(error);
        setVoted(true);
        // Undo optimistic update by restoring original data
        setVotesData(originalVotesData);
        return;
      }
      setVote(undefined);
    } else {
      const optionIds = votes.map((vote) => vote.option_id);
      setVotesData((prev) =>
        prev.filter(
          (v) => !(v.user_id === user?.id && optionIds.includes(v.option_id)),
        ),
      );
      const { success, error } = await removeVotes(
        votes.map((vote) => vote.option_id),
      );
      if (!success) {
        console.error(error);
        setVoted(true);
        // Undo optimistic update by restoring original data
        setVotesData(originalVotesData);
        return;
      }
      setVotes([]);
    }
  };

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
          <div className="grid gap-3">
            {options.map((option) => (
              <div
                key={option.id}
                className={
                  votesData.some(
                    (v) => v.user_id === user?.id && v.option_id === option.id,
                  )
                    ? "flex item-center justify-between space-x-2 rounded-lg border border-green-500 p-4"
                    : "flex item-center justify-between space-x-2 rounded-lg border p-4"
                }
                onClick={() => handleMultipleChoiceClick(option.id)}
              >
                <label htmlFor={option.option_text}>{option.option_text}</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {
                      votes.filter((vote) => vote.option_id === option.id)
                        .length
                    }{" "}
                    {votes.filter((vote) => vote.option_id === option.id)
                      .length === 1
                      ? "vote"
                      : "votes"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {(votes.filter((vote) => vote.option_id === option.id)
                      .length /
                      votes.length) *
                      100}
                    {"%"}
                  </span>
                  <Checkbox
                    id={option.id}
                    onChange={() => handleMultipleChoiceClick(option.id)}
                    checked={selectedOptions.some(
                      (selectedOption) => selectedOption.id === option.id,
                    )}
                    disabled={voted}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup value={selectedOption?.option_text}>
            {options.map((option) => (
              <div
                className={
                  votesData.some(
                    (v) => v.user_id === user?.id && v.option_id === option.id,
                  )
                    ? "flex items-center justify-between space-x-2 rounded-lg border border-green-500 p-4"
                    : "flex items-center justify-between space-x-2 rounded-lg border p-4"
                }
                key={option.id}
                onClick={() => handleSingleChoiceClick(option.id)}
              >
                <label htmlFor={option.option_text}>{option.option_text}</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {
                      votesData.filter((vote) => vote.option_id === option.id)
                        .length
                    }{" "}
                    {votesData.filter((vote) => vote.option_id === option.id)
                      .length === 1
                      ? "vote"
                      : "votes"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {(votesData.filter((vote) => vote.option_id === option.id)
                      .length /
                      votesData.length) *
                      100}
                    {"%"}
                  </span>
                  <RadioGroupItem
                    value={option.option_text}
                    id={option.id}
                    onChange={() => handleSingleChoiceClick(option.id)}
                    disabled={voted}
                  />
                </div>
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
