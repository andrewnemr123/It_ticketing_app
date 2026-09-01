import { Card } from "@/components/ui/card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartPie,
  faGear,
  faTicket,
  faUsersGear,
} from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

type DashBoardItemProps = {
  icon: IconProp;
  name: string;
};

function DashBoardItem({ icon, name }: DashBoardItemProps) {
  return (
    <Card className="size-50 flex flex-col items-center justify-center hover:-translate-y-2 hover:text-primary hover:shadow-2xl active:translate-y-0 active:shadow-md cursor-pointer">
      <FontAwesomeIcon icon={icon} className="text-5xl" />
      <span className="text-lg font-medium text-center">{name}</span>
    </Card>
  );
}

function DashBoard() {
  return (
    <div className="flex w-screen h-screen items-center justify-center gap-6">
      <DashBoardItem icon={faTicket} name="Manage Tickets" />
      <DashBoardItem icon={faUsersGear} name="Manage Users" />
      <DashBoardItem icon={faChartPie} name="Reports" />
      <DashBoardItem icon={faGear} name="Settings" />
    </div>
  );
}

export default DashBoard;
