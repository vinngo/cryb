export interface User {
  id: string;
  display_name: string;
  email: string;
  house_id: string;
  created_at: Date;
}

export interface House {
  id: string;
  name: string;
  created_by: string;
  created_at: Date;
  code: string;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  house_id: string;
  due_date: Date;
  completed: boolean;
  created_at: Date;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  house_id: string;
  created_at: Date;
}

export interface HouseMember {
  id: string;
  user_id: string;
  house_id: string;
  role: string;
  joined_at: Date;
  name: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  created_by: string; //user_id
  house_id: string;
  is_pinned: boolean;
  created_at: Date;
}

export interface HouseRule {
  house_id: string;
  user_id: string;
  created_at: Date;
  markdown_content: string;
  updated_at: Date;
}

export interface Contribution {
  id: string;
  date: Date;
  expense_id: string;
  user_id: string;
  amount: number;
  house_id: string;
  note?: string;
}

export interface ShoppingListItem {
  id: string;
  house_id: string;
  name: string;
  quantity: number;
  user_id: string;
  is_checked: boolean;
  category: string;
}

export interface Poll {
  id: string;
  house_id: string;
  created_by: string;
  question: string;
  multiple_choice: boolean;
  created_at: Date;
  expires_at: Date;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
  created_at: Date;
}
