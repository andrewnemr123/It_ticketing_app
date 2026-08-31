import { Router } from "express";
import { dashboard } from "../controllers/reportController";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";

const router = Router();

router.get("/dashboard", authenticateToken, authorizeRoles("ADMIN"), dashboard);

export default router;
