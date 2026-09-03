import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Role, User, UserListResponse } from "@/lib/types";

const ROLES: Role[] = ["EMPLOYEE", "ADMIN"];

function formatDate(value?: string) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

export default function ManageUsers() {
  const queryClient = useQueryClient();
  const { user: current, logout } = useAuth();
  const [mutationError, setMutationError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<UserListResponse>("/users"),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: Role }) =>
      api.put(`/users/${id}/role`, { role }),
    onSuccess: () => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      setMutationError(
        err instanceof ApiError ? err.message : "Failed to update role",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.del(`/users/${id}`),
    onSuccess: () => {
      setMutationError(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => {
      setMutationError(
        err instanceof ApiError ? err.message : "Failed to delete user",
      );
    },
  });

  const handleDelete = (user: User) => {
    if (user.id === current?.id) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`,
    );

    if (!confirmed) return;

    deleteMutation.mutate(user.id);
  };

  const users: User[] = data?.users ?? [];

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Manage Users</h1>

        <div className="flex gap-2">
          <Link to="/admin" className={buttonVariants({ variant: "outline" })}>
            Back
          </Link>

          <Button variant="ghost" onClick={logout}>
            Log out
          </Button>
        </div>
      </div>

      {mutationError && (
        <p className="mb-3 text-sm text-destructive" role="alert">
          {mutationError}
        </p>
      )}

      {isLoading && (
        <div className="flex justify-center py-10">
          <Spinner className="size-6" />
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error ? error.message : "Failed to load users"}
        </p>
      )}

      {!isLoading && !error && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {users.map((u) => {
              const isCurrentUser = u.id === current?.id;
              const isDeleting =
                deleteMutation.isPending &&
                deleteMutation.variables === u.id;

              return (
                <TableRow key={u.id}>
                  <TableCell>{u.name}</TableCell>

                  <TableCell>{u.email}</TableCell>

                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(role) =>
                        roleMutation.mutate({
                          id: u.id,
                          role: role as Role,
                        })
                      }
                      disabled={
                        isCurrentUser ||
                        roleMutation.isPending ||
                        deleteMutation.isPending
                      }
                    >
                      <SelectTrigger size="sm">
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>{formatDate(u.created_at)}</TableCell>

                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(u)}
                      disabled={isCurrentUser || deleteMutation.isPending}
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
