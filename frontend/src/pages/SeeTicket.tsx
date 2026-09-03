import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { TicketResponse } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Hash,
  LogOut,
  Tag,
  User,
  UserCheck,
  Pencil,
  X,
  Check,
} from "lucide-react";

const CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Access / Permissions",
  "Security",
  "Email",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High", "Critical"];

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
  const queryClient = useQueryClient();
  const { ticket_id } = useParams<{ ticket_id: string }>();
  const { user, logout } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ticket", ticket_id],
    queryFn: () => api.get<TicketResponse>(`/tickets/${ticket_id}`),
    enabled: !!ticket_id,
  });

  const ticket = data?.ticket;

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Other");
  const [priority, setPriority] = useState("Medium");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync state when ticket loads
  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title || "");
      setDescription(ticket.description || "");
      setCategory(ticket.category || "Other");
      setPriority(ticket.priority || "Medium");
    }
  }, [ticket]);

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
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to tickets
          </Button>
        </div>
      </div>
    );
  }

  // Admin or Ticket Creator can edit
  const canEdit = Boolean(
    user && (user.role === "ADMIN" || user.name === ticket.creator_name)
  );

  function startEditing() {
    if (!ticket) return;
    setTitle(ticket.title);
    setDescription(ticket.description);
    setCategory(ticket.category);
    setPriority(ticket.priority);
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEditing() {
    if (!ticket) return;
    setTitle(ticket.title);
    setDescription(ticket.description);
    setCategory(ticket.category);
    setPriority(ticket.priority);
    setSaveError(null);
    setIsEditing(false);
  }


  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setSaveError("Title and description are required.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await api.put(`/tickets/${ticket_id}`, {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
      });

      await queryClient.invalidateQueries({ queryKey: ["ticket", ticket_id] });
      setIsEditing(false);
    } catch (err: unknown) {
      setSaveError(
        err instanceof Error ? err.message : "Failed to save ticket changes."
      );
    } finally {
      setIsSaving(false);
    }
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

        <div className="flex shrink-0 items-center gap-2">
          {canEdit && !isEditing && (
            <Button variant="default" onClick={startEditing}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Ticket
            </Button>
          )}
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

      {/* Editing Form Card */}
      {isEditing ? (
        <Card className="border-primary/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Edit Ticket Details</CardTitle>
            <CardDescription>
              Update the ticket subject, category, priority, and description.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="edit-ticket-form" onSubmit={handleSave} className="space-y-4">
              <Field>
                <FieldLabel htmlFor="edit-title">Title</FieldLabel>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ticket title"
                  required
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="edit-category">Category</FieldLabel>
                  <select
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-popover text-popover-foreground">
                        {cat}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="edit-priority">Priority</FieldLabel>
                  <select
                    id="edit-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p} className="bg-popover text-popover-foreground">
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="edit-description">Description</FieldLabel>
                <Textarea
                  id="edit-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  placeholder="Detailed description of the issue"
                  required
                />
              </Field>

              {saveError && (
                <p className="text-sm text-destructive" role="alert">
                  {saveError}
                </p>
              )}
            </form>
          </CardContent>
          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={cancelEditing}
              disabled={isSaving}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-ticket-form"
              disabled={isSaving}
            >
              {isSaving ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* Read-only Ticket View */
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
      )}
    </div>
  );
}
