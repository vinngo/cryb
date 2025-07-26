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
import { X } from "lucide-react";
import { PollProps } from "../../../types/poll";
import { PollOption, PollVote } from "../../../types/database";
import { votePoll, removePoll, removeVote, removeVotes } from "./actions";
import { useState, useEffect } from "react";
import { useRootStore } from "@/lib/stores/rootStore";
import { usePollStore } from "@/lib/stores/pollsStore";

export default function Poll({
  id,
  title,
  multipleChoice,
  options,
  votes: initialVotesData,
  expires_at,
}: PollProps) {
  const { user } = useRootStore();
  const { polls } = usePollStore();

  const now = new Date();

  const expiresAtDate =
    typeof expires_at === "string" ? new Date(expires_at) : expires_at;

  // Get the latest poll data from the store
  const currentPoll = polls.find((poll) => poll.id === id);

  // Use the most up-to-date votes data from the store if available, otherwise use props
  const [votesData, setVotesData] = useState(
    currentPoll?.votes || initialVotesData,
  );
  const [selectedOption, setSelectedOption] = useState<PollOption | undefined>(
    undefined,
  );
  const [selectedOptions, setSelectedOptions] = useState<PollOption[]>([]);
  const [vote, setVote] = useState<PollVote | undefined>(undefined);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [winners, setWinners] = useState<PollOption[]>([]);
  const [expired] = useState(expiresAtDate < now);

  // Update votesData whenever the store data changes
  useEffect(() => {
    if (currentPoll) {
      setVotesData(currentPoll.votes);
    }
  }, [currentPoll]);

  // Calculate winner(s) whenever votes change or when poll expires
  useEffect(() => {
    if (expired) {
      // Count votes for each option
      const voteCounts = votesData.reduce(
        (acc, vote) => {
          acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      // Find the maximum vote count
      const maxVotes =
        Object.values(voteCounts).length > 0
          ? Math.max(...Object.values(voteCounts))
          : 0;

      // Find all options with the maximum vote count (only if there are votes)
      const winningOptionIds = Object.keys(voteCounts).filter(
        (optionId) => voteCounts[optionId] === maxVotes && maxVotes > 0,
      );

      // Set winning options
      const winningOptions = options.filter((option) =>
        winningOptionIds.includes(option.id),
      );

      setWinners(winningOptions);
    } else {
      // Clear winners if poll is not expired
      setWinners([]);
    }
  }, [votesData, options, expired]);

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
    if (user) {
      const userVoted = votesData.some((v) => v.user_id === user.id);
      setVoted(userVoted);
    } else {
      setVoted(false);
    }
  }, [votesData, user]);

  const calculateTimeLeft = () => {
    const now = new Date();
    const expiryDate =
      typeof expires_at === "string" ? new Date(expires_at) : expires_at;
    const timeLeft = expiryDate.getTime() - now.getTime();
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
    if (expired || voted) return;

    setSelectedOptions((prevOptions) => {
      if (prevOptions.some((option) => option.id === optionId)) {
        return prevOptions.filter((option) => option.id !== optionId);
      } else {
        const foundOption = options.find((option) => option.id === optionId);
        if (foundOption) {
          return [...prevOptions, foundOption];
        }
        return prevOptions;
      }
    });
  };

  const handleSingleChoiceClick = (optionId: string) => {
    if (expired || voted) return;
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
        user.house_id,
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
        user.house_id,
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
      <CardHeader className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 p-1 h-auto"
          onClick={() => removePoll(id)}
        >
          <X className="h-4 w-4" />
        </Button>
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
                className={`
                  flex items-center justify-between space-x-2 rounded-lg border p-4
                  ${
                    votesData.some(
                      (v) =>
                        v.user_id === user?.id && v.option_id === option.id,
                    )
                      ? "border-green-500"
                      : ""
                  }
                  ${
                    expired &&
                    winners &&
                    winners.some((w) => w.id === option.id)
                      ? "bg-green-900 border-green-500"
                      : ""
                  }
                `}
                onClick={() => handleMultipleChoiceClick(option.id)}
              >
                <label htmlFor={option.option_text}>{option.option_text}</label>
                <div className="flex items-center gap-2">
                  {expired && winners.some((w) => w.id === option.id) && (
                    <span className="text-yellow-600 font-bold text-xs">
                      WINNER
                    </span>
                  )}
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
                  {votesData.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {Math.round(
                        (votesData.filter(
                          (vote) => vote.option_id === option.id,
                        ).length /
                          votesData.length) *
                          100,
                      )}
                      {"%"}
                    </span>
                  )}
                  {!expired && (
                    <Checkbox
                      id={option.id}
                      onChange={() => handleMultipleChoiceClick(option.id)}
                      checked={selectedOptions.some(
                        (selectedOption) => selectedOption.id === option.id,
                      )}
                      disabled={expired || voted}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup value={selectedOption?.option_text}>
            {options.map((option) => (
              <div
                className={`
                  flex items-center justify-between space-x-2 rounded-lg border p-4
                  ${
                    votesData.some(
                      (v) =>
                        v.user_id === user?.id && v.option_id === option.id,
                    )
                      ? "border-green-500"
                      : ""
                  }
                  ${
                    expired && winners.some((w) => w.id === option.id)
                      ? "bg-green-900 border-green-500"
                      : ""
                  }
                `}
                key={option.id}
                onClick={() => handleSingleChoiceClick(option.id)}
              >
                <label htmlFor={option.option_text}>{option.option_text}</label>
                <div className="flex items-center gap-2">
                  {expired && winners.some((w) => w.id === option.id) && (
                    <span className="font-bold text-xs">WINNER</span>
                  )}
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
                  {votesData.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {Math.round(
                        (votesData.filter(
                          (vote) => vote.option_id === option.id,
                        ).length /
                          votesData.length) *
                          100,
                      )}
                      {"%"}
                    </span>
                  )}
                  {!expired && (
                    <RadioGroupItem
                      value={option.option_text}
                      id={option.id}
                      onChange={() => handleSingleChoiceClick(option.id)}
                      disabled={expired || voted}
                    />
                  )}
                </div>
              </div>
            ))}
          </RadioGroup>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {expired ? (
            <span className="text-sm text-muted-foreground">Poll Expired</span>
          ) : (
            <span className="text-sm text-muted-foreground">{`${days}d ${hours}h ${minutes}m`}</span>
          )}
        </div>
        {!expired && (
          <div className="flex items-center gap-4">
            {voted ? (
              <Button onClick={() => handleRemoveVote()}>Remove Vote</Button>
            ) : (
              <Button onClick={() => handleVote()}>Vote</Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
