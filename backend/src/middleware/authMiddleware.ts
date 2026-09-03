import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";

/**
 * Validates the "Authorization: Bearer <token>" header and attaches the
 * decoded payload to req.user.
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || "default_jwt_secret_key_it_ticketing";
    const decoded = jwt.verify(token, secret) as JwtPayload;



    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export default authenticateToken;
