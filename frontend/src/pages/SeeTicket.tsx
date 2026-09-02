import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TicketResponse } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Hash,
  LogOut,
  Tag,
  User,
  UserCheck,
} from "lucide-react";

function statusVariant(status: string) {
  switch (status) {
    case "New":
    case "Open":
      return "default";
    case "In Progress":
      return "secondary";
    case "Waiting for User":
      return "outline";
    case "Resolved":
    case "Closed":
      return "outline";
    default:
      return "secondary";
  }
}

function priorityVariant(priority: string) {
  switch (priority) {
    case "Critical":
    case "High":
      return "destructive";
    case "Medium":
      return "default";
    case "Low":
      return "secondary";
    default:
      return "outline";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SeeTicket() {
  const navigate = useNavigate();
  const { ticket_id } = useParams<{ ticket_id: string }>();
  const { logout } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket", ticket_id],
    queryFn: () => api.get<TicketResponse>(`/tickets/${ticket_id}`),
    enabled: !!ticket_id,
  });

  const ticket = data?.ticket;

  if (!ticket_id) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Invalid ticket</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/50 bg-destructive/5 py-16">
          <p className="text-lg font-medium text-destructive">
            Failed to load ticket
          </p>
          <Link to="/" className={buttonVariants({ variant: "outline" })}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tickets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Top bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Hash className="h-4 w-4" />
            <span>{ticket.ticket_number ?? `Ticket #${ticket.id}`}</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {ticket.title}
          </h1>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="ghost" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      {/* Main card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(ticket.status)}>
              {ticket.status}
            </Badge>
            <Badge variant={priorityVariant(ticket.priority)}>
              {ticket.priority}
            </Badge>
            <Badge variant="outline" className="gap-1">
              <Tag className="h-3 w-3" />
              {ticket.category}
            </Badge>
          </div>

          <CardDescription className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              Created by {ticket.creator_name}
            </span>

            {ticket.assignee_name && (
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5" />
                Assigned to {ticket.assignee_name}
              </span>
            )}

            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(ticket.created_at)}
            </span>
          </CardDescription>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Description
            </h3>
            <p className="whitespace-pre-wrap leading-relaxed text-sm">
              {ticket.description || "No description provided."}
            </p>
          </div>

          {ticket.updated_at !== ticket.created_at && (
            <>
              <Separator className="my-6" />
              <p className="text-xs text-muted-foreground">
                Last updated {formatDate(ticket.updated_at)}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
