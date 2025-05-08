export interface User {
  id: string;
  display_name: string;
  house_id: string;
  created_at: Date;
}

export interface House {
  id: string;
  name: string;
  created_by: string;
  created_at: Date;
  house: string;
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
