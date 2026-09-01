import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";

export default function Unauthorized() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Access denied</h1>
      <p className="text-muted-foreground">
        You do not have permission to view this page.
      </p>
      <Link to="/" className={buttonVariants({ variant: "outline" })}>
        Go home
      </Link>
    </div>
  );
}
