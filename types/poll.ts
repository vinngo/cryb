import { PollOption, PollVote } from "./database";

export interface PollProps {
  id: string;
  title: string;
  multipleChoice: boolean;
  options: PollOption[];
  votes: PollVote[];
  created_at: Date;
  expires_at: Date;
}
