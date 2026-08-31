export type Role = "EMPLOYEE" | "ADMIN";

export interface JwtPayload {
  userId: number;
  email: string;
  role: Role;
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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
