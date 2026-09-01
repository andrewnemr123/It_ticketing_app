import { Request, Response, NextFunction } from "express";
import { Role } from "../types";

/**
 * Guards a route so only the listed roles may pass.
 * Must run after authenticateToken.
 */
export function authorizeRoles(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    next();
  };
}

export default authorizeRoles;
