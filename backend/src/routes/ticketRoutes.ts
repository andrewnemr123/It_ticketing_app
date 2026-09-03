import { Router } from "express";
import {
  listTickets,

  getTicket,
  createTicket,
  updateTicket,
  updateStatus,
  updatePriority,
  assignTicket,
  listEvents,
  addComment,
  addAttachment,
  listAttachments,
  downloadAttachment,
} from "../controllers/ticketController";
import { authenticateToken } from "../middleware/authMiddleware";
import { authorizeRoles } from "../middleware/roleMiddleware";
import { upload } from "../middleware/uploadMiddleware";

const router = Router();

// Every ticket route requires a valid token.
router.use(authenticateToken);

router.get("/", listTickets);
router.post("/", createTicket);
router.get("/:id", getTicket);
router.put("/:id", updateTicket);


router.get("/:id/events", listEvents);
router.post("/:id/comments", addComment);

router.get("/:id/attachments", listAttachments);
router.post("/:id/attachments", upload.single("file"), addAttachment);
router.get("/:id/attachments/:attachmentId/download", downloadAttachment);

// Admin-only ticket actions.
router.put("/:id/status", authorizeRoles("ADMIN"), updateStatus);
router.put("/:id/priority", authorizeRoles("ADMIN"), updatePriority);
router.put("/:id/assign", authorizeRoles("ADMIN"), assignTicket);

export default router;
