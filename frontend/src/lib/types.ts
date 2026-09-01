// Shared types that mirror the backend API responses.

export type Role = "EMPLOYEE" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export const TICKET_CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Access / Permissions",
  "Security",
  "Email",
  "Other",
] as const;

export const TICKET_PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;

export const TICKET_STATUSES = [
  "New",
  "Open",
  "In Progress",
  "Waiting for User",
  "Resolved",
  "Closed",
] as const;

export type TicketCategory = (typeof TICKET_CATEGORIES)[number];
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface Ticket {
  id: number;
  ticket_number: string | null;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  creator_id: number;
  assigned_to_id: number | null;
  creator_name: string;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTicketRequest {
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
}

export interface TicketListResponse {
  tickets: Ticket[];
}

export interface TicketResponse {
  ticket: Ticket;
}

export interface UserListResponse {
  users: User[];
}
