import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function ManageTickets() {
  const queryClient = useQueryClient();

  const getTickets = async () => {
    const res = await fetch("/api/tickets/");

    if (!res.ok) {
      throw new Error("Failed to fetch tickets");
    }

    return res.json();
  };

  const { data: tickets = [], isLoading, error } = useQuery({
    queryKey: ["tickets"],
    queryFn: getTickets
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticket</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket: any) => (
          <TableRow key={ticket.ticket_number}>
            <TableCell>{ticket.title}</TableCell>
            <TableCell>{ticket.category}</TableCell>
            <TableCell>{ticket.priority}</TableCell>
            <TableCell>{ticket.status}</TableCell>
            <TableCell>{ticket.created_at}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
