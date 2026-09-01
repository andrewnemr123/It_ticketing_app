import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faGear,
  faPlus,
  faTicket,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Link } from "react-router-dom";

type DashBoardItemProps = {
  icon: IconProp;
  name: string;
  to?: string;
};

function DashBoardItem({ icon, name, to }: DashBoardItemProps) {
  const content = (
    <Card className="size-50 flex flex-col items-center justify-center hover:-translate-y-2 hover:text-primary hover:shadow-2xl active:translate-y-0 active:shadow-md cursor-pointer">
      <FontAwesomeIcon icon={icon} className="text-5xl" />
      <span className="text-lg font-medium text-center">{name}</span>
    </Card>
  );

  return to ? <Link to={to}>{content}</Link> : content;
}

export function AdminDashBoard() {
  return (
    <div className="flex w-screen h-screen items-center justify-center gap-6">
      <DashBoardItem
        icon={faTicket}
        name="Manage Tickets"
        to="/admin/tickets"
      />
      <DashBoardItem icon={faUsersGear} name="Manage Users" to="/admin/users" />
      <DashBoardItem icon={faChartPie} name="Reports" />
      <DashBoardItem icon={faGear} name="Settings" />
    </div>
  );
}

export function UserDashBoard() {
  return (
    <div className="flex w-screen h-screen items-center justify-center gap-6">
      <DashBoardItem icon={faPlus} name="Create Ticket" to="/tickets/create" />
      <DashBoardItem icon={faTicket} name="My Tickets" to="/tickets" />
      <DashBoardItem icon={faGear} name="Settings" />
    </div>
  );
}
