import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app";
import pool from "../src/config/db";


describe("Ticket Controller & CRUD API Tests", () => {
  const JWT_SECRET = "test_jwt_secret_key_123";
  let adminToken: string;
  let employeeToken: string;

  const mockTicket = {
    id: 1,
    ticket_number: "TICK-1001",
    title: "VPN connection issue",
    description: "Cannot connect to company VPN",
    category: "Network",
    priority: "High",
    status: "Open",
    creator_id: 2,
    assigned_to_id: 1,
    created_at: new Date(),
    updated_at: new Date(),
    creator_name: "Sarah Jenkins",
    assignee_name: "System Admin",
  };

  beforeEach(() => {
    process.env.JWT_SECRET = JWT_SECRET;
    adminToken = jwt.sign(
      { userId: 1, email: "admin@company.com", role: "ADMIN" },
      JWT_SECRET
    );
    employeeToken = jwt.sign(
      { userId: 2, email: "sarah@company.com", role: "EMPLOYEE" },
      JWT_SECRET
    );
    vi.restoreAllMocks();
  });

  describe("GET /api/tickets", () => {
    it("should require authentication and return 401 if unauthenticated", async () => {
      const res = await request(app).get("/api/tickets");
      expect(res.status).toBe(401);
    });

    it("should allow an employee to retrieve their tickets", async () => {
      vi.spyOn(pool, "query").mockResolvedValueOnce([[mockTicket], []] as any);

      const res = await request(app)
        .get("/api/tickets")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body.tickets).toHaveLength(1);
      expect(res.body.tickets[0].title).toBe("VPN connection issue");
    });

    it("should allow filtering tickets by status and category", async () => {
      const querySpy = vi
        .spyOn(pool, "query")
        .mockResolvedValueOnce([[mockTicket], []] as any);

      const res = await request(app)
        .get("/api/tickets?status=Open&category=Network")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(querySpy).toHaveBeenCalled();
    });
  });

  describe("GET /api/tickets/:id", () => {
    it("should return 400 for invalid non-integer ticket id", async () => {
      const res = await request(app)
        .get("/api/tickets/abc")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid id");
    });

    it("should return 404 if ticket does not exist", async () => {
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[], []] as any);

      const res = await request(app)
        .get("/api/tickets/999")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("Ticket not found");
    });

    it("should return 404 if an employee tries to access another user's ticket", async () => {
      const otherUserTicket = { ...mockTicket, creator_id: 99 };
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[otherUserTicket], []] as any);

      const res = await request(app)
        .get("/api/tickets/1")
        .set("Authorization", `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });

    it("should allow admin to access any ticket", async () => {
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[mockTicket], []] as any);

      const res = await request(app)
        .get("/api/tickets/1")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.ticket.id).toBe(1);
    });
  });

  describe("POST /api/tickets (Create Ticket)", () => {
    it("should reject ticket creation with missing title or description", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          title: "",
          description: "",
          category: "Software",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Title and description are required");
    });

    it("should reject ticket creation with invalid category", async () => {
      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          title: "Broken mouse",
          description: "Mouse laser stopped working",
          category: "InvalidCategory",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid category");
    });

    it("should successfully create ticket and return 201 Created", async () => {
      const mockConn = {
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        execute: vi
          .fn()
          .mockResolvedValueOnce([{ insertId: 42 }]) // insert
          .mockResolvedValueOnce([{ affectedRows: 1 }]), // update ticket_number
        commit: vi.fn().mockResolvedValue(undefined),
        release: vi.fn(),
      };

      vi.spyOn(pool, "getConnection").mockResolvedValueOnce(mockConn as any);
      vi.spyOn(pool, "execute").mockResolvedValueOnce([
        [{ ...mockTicket, id: 42, ticket_number: "TICK-1042" }],
        [],
      ] as any);

      const res = await request(app)
        .post("/api/tickets")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          title: "Broken keyboard",
          description: "Spacebar is sticky",
          category: "Hardware",
          priority: "Medium",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe("Ticket created");
      expect(res.body.ticket.id).toBe(42);
    });
  });

  describe("PUT /api/tickets/:id/status", () => {
    it("should reject non-admin users with 403 Forbidden", async () => {
      const res = await request(app)
        .put("/api/tickets/1/status")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ status: "Resolved" });

      expect(res.status).toBe(403);
    });

    it("should reject invalid status string with 400 Bad Request", async () => {
      const res = await request(app)
        .put("/api/tickets/1/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "FakeStatus" });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Invalid status");
    });

    it("should allow admin to update status and record event", async () => {
      vi.spyOn(pool, "execute")
        .mockResolvedValueOnce([[mockTicket], []] as any) // getTicketById check
        .mockResolvedValueOnce([{ affectedRows: 1 }, []] as any) // UPDATE ticket status
        .mockResolvedValueOnce([{ insertId: 10 }, []] as any) // INSERT ticket_event
        .mockResolvedValueOnce([
          [{ ...mockTicket, status: "Resolved" }],
          [],
        ] as any); // getTicketById after update

      const res = await request(app)
        .put("/api/tickets/1/status")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "Resolved" });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Status updated");
      expect(res.body.ticket.status).toBe("Resolved");
    });
  });

  describe("PUT /api/tickets/:id (Edit Ticket)", () => {
    it("should allow an employee to edit their own ticket title and description", async () => {
      const updatedTicket = {
        ...mockTicket,
        title: "Updated VPN Issue",
        description: "New updated details",
      };

      vi.spyOn(pool, "execute")
        .mockResolvedValueOnce([[mockTicket], []] as any) // getTicketById
        .mockResolvedValueOnce([{ affectedRows: 1 }, []] as any) // UPDATE ticket
        .mockResolvedValueOnce([[updatedTicket], []] as any); // getTicketById after update

      const res = await request(app)
        .put("/api/tickets/1")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          title: "Updated VPN Issue",
          description: "New updated details",
          category: "Network",
          priority: "High",
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket updated successfully");
      expect(res.body.ticket.title).toBe("Updated VPN Issue");
    });

    it("should reject an employee editing another user's ticket with 404", async () => {
      const otherUserTicket = { ...mockTicket, creator_id: 99 };
      vi.spyOn(pool, "execute").mockResolvedValueOnce([[otherUserTicket], []] as any);

      const res = await request(app)
        .put("/api/tickets/1")
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({
          title: "Hacked Ticket",
          description: "Trying to edit someone else's ticket",
        });

      expect(res.status).toBe(404);
    });

    it("should allow admin to edit ticket, change status, and assign a technician", async () => {
      const adminAssignedTicket = {
        ...mockTicket,
        status: "In Progress",
        assigned_to_id: 1,
        assignee_name: "System Admin",
      };

      const mockAdminUser = { id: 1, name: "System Admin", role: "ADMIN" };

      vi.spyOn(pool, "execute")
        .mockResolvedValueOnce([[mockTicket], []] as any) // getTicketById
        .mockResolvedValueOnce([{ insertId: 10 }, []] as any) // STATUS_CHANGE event
        .mockResolvedValueOnce([[mockAdminUser], []] as any) // check assignee is admin
        .mockResolvedValueOnce([{ affectedRows: 1 }, []] as any) // UPDATE ticket
        .mockResolvedValueOnce([[adminAssignedTicket], []] as any); // getTicketById after update

      const res = await request(app)
        .put("/api/tickets/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "VPN connection issue",
          description: "Cannot connect to company VPN",
          category: "Network",
          priority: "High",
          status: "In Progress",
          assigned_to_id: 1,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket updated successfully");
      expect(res.body.ticket.status).toBe("In Progress");
      expect(res.body.ticket.assigned_to_id).toBe(1);
    });

    it("should allow admin to assign a ticket to an EMPLOYEE (any user)", async () => {
      const employeeAssignedTicket = {
        ...mockTicket,
        assigned_to_id: 2,
        assignee_name: "Sarah Jenkins",
      };

      const mockEmployeeUser = { id: 2, name: "Sarah Jenkins", role: "EMPLOYEE" };

      vi.spyOn(pool, "execute")
        .mockResolvedValueOnce([[mockTicket], []] as any) // getTicketById
        .mockResolvedValueOnce([[mockEmployeeUser], []] as any) // check assignee exists
        .mockResolvedValueOnce([{ insertId: 11 }, []] as any) // ASSIGNMENT_CHANGE event
        .mockResolvedValueOnce([{ affectedRows: 1 }, []] as any) // UPDATE ticket
        .mockResolvedValueOnce([[employeeAssignedTicket], []] as any); // getTicketById after update

      const res = await request(app)
        .put("/api/tickets/1")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          title: "VPN connection issue",
          description: "Cannot connect to company VPN",
          category: "Network",
          priority: "High",
          assigned_to_id: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe("Ticket updated successfully");
      expect(res.body.ticket.assigned_to_id).toBe(2);
    });
  });
});


