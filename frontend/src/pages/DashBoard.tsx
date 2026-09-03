import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faPlus,
  faTicket,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";

type DashBoardItemProps = {
  icon: IconProp;
  name: string;
  toInternal?: string;
  toExternal?: string;
} & (
  | {
      toInternal: string;
      toExternal?: never;
    }
  | {
      toExternal: string;
      toInternal?: never;
    }
  | {
      toInternal?: never;
      toExternal?: never;
    }
);

export function DashBoardItem({
  icon,
  name,
  toInternal,
  toExternal,
}: DashBoardItemProps) {
  const content = (
    <Card className="size-50 flex flex-col items-center justify-center hover:-translate-y-2 hover:text-primary hover:shadow-2xl active:translate-y-0 active:shadow-md cursor-pointer">
      <FontAwesomeIcon icon={icon} className="text-5xl" />
      <span className="text-lg font-medium text-center">{name}</span>
    </Card>
  );

  if (toInternal) {
    return <Link to={toInternal}>{content}</Link>;
  }

  if (toExternal) {
    return (
      <a href={toExternal} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function DashBoardShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="relative flex w-screen h-screen items-center justify-center gap-6">
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {user && (
          <span className="text-sm text-muted-foreground">
            {user.name} · {user.role}
          </span>
        )}
        <Button variant="ghost" onClick={logout}>
          Log out
        </Button>
      </div>
      {children}
    </div>
  );
}

export function AdminDashBoard() {
  return (
    <DashBoardShell>
      <DashBoardItem
        icon={faTicket}
        name="Manage Tickets"
        toInternal="/admin/tickets"
      />
      <DashBoardItem
        icon={faUsersGear}
        name="Manage Users"
        toInternal="/admin/users"
      />
      <DashBoardItem
        icon={faChartPie}
        name="Reports"
        toExternal={import.meta.env.VITE_GRAFANA_URL}
        toExternal={
          import.meta.env.VITE_GRAFANA_URL ||
          `${window.location.protocol}//${window.location.hostname}:3000`
        }
      />

    </DashBoardShell>
  );
}

export function UserDashBoard() {
  return (
    <DashBoardShell>
      <DashBoardItem
        icon={faPlus}
        name="Create Ticket"
        toInternal="/tickets/create"
      />
      <DashBoardItem icon={faTicket} name="My Tickets" toInternal="/tickets" />
    </DashBoardShell>
  );
}
