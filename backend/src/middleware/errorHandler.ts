import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { ApiError } from "../utils/ApiError";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ message: "Route not found" });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  if (err instanceof SyntaxError && "status" in err && (err as { status: number }).status === 400) {
    res.status(400).json({ message: "Malformed JSON payload in request body" });
    return;
  }


  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File is too large (max 5 MB)"
        : `Upload error: ${err.message}`;
    res.status(400).json({ message });
    return;
  }

  if (err instanceof Error && err.message.startsWith("Unsupported file type")) {
    res.status(400).json({ message: err.message });
    return;
  }

  console.error("UNHANDLED ERROR:", err);
  res.status(500).json({ message: "Internal server error" });
}
