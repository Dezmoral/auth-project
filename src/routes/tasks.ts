import { Router, Request, Response } from "express";
import { pool } from "../db";
import { auth, requireAdmin, JWTPayload } from "../middleware/auth";

const router = Router();

// ============ PUBLIC ROUTES ============
// Public list: only tasks with is_public = true
router.get("/public/tasks", async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT t.id, t.title, t.description, t.is_public, t.status, t.due_date, t.created_at,
              json_build_object('id', u.id, 'email', u.email, 'full_name', u.full_name) as owner
         FROM tasks t
         JOIN users u ON u.id = t.owner_id
        WHERE t.is_public = true
        ORDER BY t.created_at DESC`
    );
    res.json({ items: result.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка сервера" });
  }
});

// ============ AUTH ROUTES ============
// Create task (owner = current user)
router.post(
  "/tasks",
  auth,
  async (req: Request & { user?: JWTPayload }, res: Response) => {
    const { title, description, is_public, status, due_date } = req.body || {};

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return res.status(400).json({ message: "Название (title) обязательно" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO tasks (owner_id, title, description, is_public, status, due_date)
         VALUES ($1, $2, $3, COALESCE($4, false), $5, $6)
         RETURNING *`,
        [
          req.user!.id,
          title.trim(),
          description ?? null,
          typeof is_public === "boolean" ? is_public : null,
          status ?? null,
          due_date ?? null,
        ]
      );
      res.status(201).json({ item: result.rows[0] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// List own tasks with optional filters: status, from, to (due_date)
router.get(
  "/tasks",
  auth,
  async (req: Request & { user?: JWTPayload }, res: Response) => {
    try {
      const { status, from, to } = req.query as {
        status?: string;
        from?: string; // ISO date string
        to?: string;   // ISO date string
      };

      const conditions: string[] = ["owner_id = $1"];
      const params: any[] = [req.user!.id];
      let idx = params.length + 1;

      if (status) {
        conditions.push(`status = $${idx++}`);
        params.push(status);
      }
      if (from) {
        conditions.push(`(due_date IS NOT NULL AND due_date >= $${idx++})`);
        params.push(from);
      }
      if (to) {
        conditions.push(`(due_date IS NOT NULL AND due_date <= $${idx++})`);
        params.push(to);
      }

      const sql = `SELECT * FROM tasks WHERE ${conditions.join(" AND ")} ORDER BY created_at DESC`;
      const result = await pool.query(sql, params);
      res.json({ items: result.rows });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// Helper to load task and perform ownership/admin check
async function loadTaskAndAuthorize(
  id: number,
  req: Request & { user?: JWTPayload },
  res: Response
): Promise<any | null> {
  try {
    const taskRes = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (taskRes.rows.length === 0) {
      res.status(404).json({ message: "Задача не найдена" });
      return null;
    }
    const task = taskRes.rows[0];
    const isOwner = task.owner_id === req.user!.id;
    const isAdmin = req.user!.role === "admin";
    if (!isOwner && !isAdmin) {
      res.status(403).json({ message: "Доступ запрещён" });
      return null;
    }
    return task;
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка сервера" });
    return null;
  }
}

// Read one with owner/admin check
router.get(
  "/tasks/:id",
  auth,
  async (req: Request & { user?: JWTPayload }, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Некорректный id" });

    const task = await loadTaskAndAuthorize(id, req, res);
    if (!task) return; // response already sent
    res.json({ item: task });
  }
);

// Update (owner or admin)
router.put(
  "/tasks/:id",
  auth,
  async (req: Request & { user?: JWTPayload }, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Некорректный id" });

    const existing = await loadTaskAndAuthorize(id, req, res);
    if (!existing) return;

    const { title, description, is_public, status, due_date } = req.body || {};

    if (title !== undefined && (typeof title !== "string" || title.trim().length === 0)) {
      return res.status(400).json({ message: "Пустое название недопустимо" });
    }

    // Build dynamic update
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`); params.push(title.trim());
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`); params.push(description);
    }
    if (is_public !== undefined) {
      fields.push(`is_public = $${idx++}`); params.push(!!is_public);
    }
    if (status !== undefined) {
      fields.push(`status = $${idx++}`); params.push(status);
    }
    if (due_date !== undefined) {
      fields.push(`due_date = $${idx++}`); params.push(due_date);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: "Нет полей для обновления" });
    }

    try {
      const sql = `UPDATE tasks SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
      const result = await pool.query(sql, [...params, id]);
      res.json({ item: result.rows[0] });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// Delete (owner or admin)
router.delete(
  "/tasks/:id",
  auth,
  async (req: Request & { user?: JWTPayload }, res: Response) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "Некорректный id" });

    const existing = await loadTaskAndAuthorize(id, req, res);
    if (!existing) return;

    try {
      await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
      res.json({ message: "Удалено" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

// ============ ADMIN ROUTES ============
router.get(
  "/admin/tasks/all",
  auth,
  requireAdmin,
  async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(
        `SELECT t.*, json_build_object('id', u.id, 'email', u.email, 'full_name', u.full_name) as owner
           FROM tasks t
           JOIN users u ON u.id = t.owner_id
          ORDER BY t.created_at DESC`
      );
      res.json({ items: result.rows });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: "Ошибка сервера" });
    }
  }
);

export default router;
