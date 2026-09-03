import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Ticket, TicketListResponse } from "@/lib/types";

function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export default function MyTickets() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: () => api.get<TicketListResponse>("/tickets"),
  });

  const tickets: Ticket[] = data?.tickets ?? [];

  const filteredTickets = tickets.filter(
    (ticket: Ticket) => Boolean(user && ticket.creator_name === user.name),
  );


  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">My Tickets</h1>
        <div className="flex gap-2">
          <Link
            to="/tickets/create"
            className={buttonVariants({ variant: "default" })}
          >
            Create Ticket
          </Link>
          <Button onClick={() => navigate(-1)} variant="outline">
            Back
          </Button>
          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="size-6" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "Failed to load tickets"}
        </p>
      )}

      {!isLoading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Created Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                onClick={() => navigate(`/tickets/${ticket.id}`)}
                className="hover:cursor-pointer"
              >
                <TableCell>{ticket.ticket_number}</TableCell>
                <TableCell>{ticket.title}</TableCell>
                <TableCell>{ticket.category}</TableCell>
                <TableCell>{ticket.priority}</TableCell>
                <TableCell>{ticket.status}</TableCell>
                <TableCell>{ticket.assignee_name ?? "—"}</TableCell>
                <TableCell>{formatDate(ticket.created_at)}</TableCell>
              </TableRow>
            ))}
            {filteredTickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground">
                  You have not created any tickets yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
