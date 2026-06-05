import express from "express";
import { dbGet, dbRun, dbAll } from "../db/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../validators/auth.js";
import aiService from "../services/aiService.js";

const router = express.Router();

// Получить список заявок
router.get("/", authenticate, async (req, res, next) => {
	try {
		const { status, excursion_id } = req.query;

		let sql = `
      SELECT r.*, e.title as excursion_title, e.base_price,
             ent.name as enterprise_name, u.full_name as user_name
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
		const params = [];

		// Туроператор видит заявки на свои экскурсии
		if (req.user.role === "operator") {
			sql += " AND e.operator_id = ?";
			params.push(req.user.id);
		} else if (req.user.role === "tourist") {
			// Турист видит только свои заявки
			sql += " AND r.user_id = ?";
			params.push(req.user.id);
		}

		if (status) {
			sql += " AND r.status = ?";
			params.push(status);
		}

		if (excursion_id) {
			sql += " AND r.excursion_id = ?";
			params.push(excursion_id);
		}

		sql += " ORDER BY r.created_at DESC";

		const requests = await dbAll(sql, params);
		res.json({ requests });
	} catch (error) {
		next(error);
	}
});

// Получить заявку по ID
router.get("/:id", authenticate, async (req, res, next) => {
	try {
		const { id } = req.params;
		const request = await dbGet(
			`
      SELECT r.*, e.title as excursion_title, e.base_price, e.duration_minutes,
             e.operator_id, ent.name as enterprise_name, ent.address as enterprise_address,
             u.full_name as user_name, u.phone as user_phone, u.email as user_email
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `,
			[id],
		);

		if (!request) {
			return res.status(404).json({ error: "Заявка не найдена" });
		}

		// Проверяем доступ
		if (req.user.role === "tourist" && request.user_id !== req.user.id) {
			return res.status(403).json({ error: "Доступ запрещён" });
		}

		if (req.user.role === "operator" && request.operator_id !== req.user.id) {
			return res.status(403).json({ error: "Доступ запрещён" });
		}

		// Получаем документы
		const documents = await dbAll(
			"SELECT * FROM documents WHERE request_id = ?",
			[id],
		);

		res.json({ request: { ...request, documents } });
	} catch (error) {
		next(error);
	}
});

// Создать заявку
router.post("/", authenticate, async (req, res, next) => {
	try {
		const errors = validateRequest(req.body);
		if (errors.length > 0) {
			return res.status(400).json({ error: errors.join(", ") });
		}

		const {
			excursion_id,
			requested_date,
			requested_time,
			people_count,
			contact_phone,
			contact_email,
			notes,
		} = req.body;

		// Проверяем существование экскурсии
		const excursion = await dbGet(
			"SELECT * FROM excursions WHERE id = ? AND status = ?",
			[excursion_id, "active"],
		);
		if (!excursion) {
			return res
				.status(400)
				.json({ error: "Экскурсия не найдена или недоступна" });
		}

		// Проверяем превышение максимума
		if (people_count > excursion.group_max) {
			return res.status(400).json({
				error: `Максимальный размер группы: ${excursion.group_max} человек`,
				max_group: excursion.group_max,
			});
		}

		// Определяем статус: pending или group_not_met (если меньше минимума)
		const initialStatus = people_count < excursion.group_min ? "group_not_met" : "pending";

		// Создаём заявку
		const result = await dbRun(
			`
      INSERT INTO requests (user_id, excursion_id, requested_date, requested_time, people_count, contact_phone, contact_email, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
			[
				req.user.id,
				excursion_id,
				requested_date,
				requested_time || null,
				people_count,
				contact_phone || req.user.phone,
				contact_email || req.user.email,
				notes,
				initialStatus,
			],
		);

		const newRequest = {
			id: result.lastInsertRowid,
			status: initialStatus,
			excursion_id,
			people_count,
		};

		// Если группа меньше минимума - сразу генерируем альтернативы
		if (people_count < excursion.group_min) {
			// Получаем альтернативы от AI
			const alternatives = await aiService.getAlternatives({
				excursion_id,
				requested_date,
				people_count,
			});

			if (alternatives) {
				await dbRun("UPDATE requests SET ai_alternatives = ? WHERE id = ?", [
					JSON.stringify(alternatives),
					newRequest.id,
				]);
				newRequest.alternatives = alternatives;
			}
		}

		res.status(201).json({
			message: "Заявка создана",
			request: newRequest,
		});
	} catch (error) {
		next(error);
	}
});

// Обновить статус заявки
router.patch(
	"/:id/status",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const { status } = req.body;

			const validStatuses = [
				"pending",
				"confirmed",
				"cancelled",
				"group_not_met",
				"completed",
			];
			if (!validStatuses.includes(status)) {
				return res.status(400).json({ error: "Недопустимый статус" });
			}

			const request = await dbGet("SELECT * FROM requests WHERE id = ?", [id]);
			if (!request) {
				return res.status(404).json({ error: "Заявка не найдена" });
			}

			await dbRun(
				"UPDATE requests SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
				[status, id],
			);

			res.json({ message: "Статус обновлён", status });
		} catch (error) {
			next(error);
		}
	},
);

// Получить альтернативы для заявки
router.post("/:id/alternatives", authenticate, async (req, res, next) => {
	try {
		const { id } = req.params;
		const request = await dbGet(
			`
      SELECT r.*, e.*, ent.name as enterprise_name
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      WHERE r.id = ?
    `,
			[id],
		);

		if (!request) {
			return res.status(404).json({ error: "Заявка не найдена" });
		}

		const alternatives = await aiService.getAlternatives({
			excursion_id: request.excursion_id,
			requested_date: request.requested_date,
			people_count: request.people_count,
		});

		// Сохраняем альтернативы
		if (alternatives) {
			await dbRun("UPDATE requests SET ai_alternatives = ? WHERE id = ?", [
				JSON.stringify(alternatives),
				id,
			]);
		}

		res.json({ alternatives });
	} catch (error) {
		next(error);
	}
});

export default router;
