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
  due_date: string;
  completed: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  house_id: string;
  created_at: string;
}

export interface HouseMember {
  id: string;
  user_id: string;
  house_id: string;
  role: string;
  joined_at: string;
  name: string;
}
