import { Router } from "express";
import {
  listUsers,
  getUser,
  createUser,
  updateUserRole,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = Router();

// All user-management routes are ADMIN only.
router.use(authenticateToken, authorizeRoles("ADMIN"));

router.get("/", listUsers);
router.post("/", createUser);
router.get("/:id", getUser);
router.put("/:id/role", updateUserRole);

export default router;
