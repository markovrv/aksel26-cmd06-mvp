import express from "express";
import { dbGet, dbRun, dbAll } from "../db/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateExcursion } from "../validators/auth.js";

const router = express.Router();

// Получить список экскурсий
router.get("/", async (req, res, next) => {
	try {
		const {
			enterprise_id,
			status = "active",
			search,
			target_audience,
		} = req.query;

		let sql = `
      SELECT e.*, ent.name as enterprise_name, ent.address as enterprise_address,
             u.full_name as operator_name, u.company_name as operator_company
      FROM excursions e
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      LEFT JOIN users u ON e.operator_id = u.id
      WHERE 1=1
    `;
		const params = [];

		if (status) {
			sql += " AND e.status = ?";
			params.push(status);
		}

		if (enterprise_id) {
			sql += " AND e.enterprise_id = ?";
			params.push(enterprise_id);
		}

		if (search) {
			sql += " AND (e.title LIKE ? OR e.short_description LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}

		if (target_audience) {
			sql += " AND e.target_audience LIKE ?";
			params.push(`%${target_audience}%`);
		}

		sql += " ORDER BY e.created_at DESC";

		const excursions = await dbAll(sql, params);
		res.json({ excursions });
	} catch (error) {
		next(error);
	}
});

// Получить экскурсию по ID
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const excursion = await dbGet(
			`
      SELECT e.*, ent.name as enterprise_name, ent.address as enterprise_address,
             ent.contacts as enterprise_contacts, ent.access_rules, ent.group_min as ent_group_min,
             ent.group_max as ent_group_max, ent.ovz_accessible,
             ent.ticket_price as enterprise_ticket_price,
             u.full_name as operator_name, u.company_name as operator_company, u.phone as operator_phone
      FROM excursions e
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      LEFT JOIN users u ON e.operator_id = u.id
      WHERE e.id = ?
    `,
			[id],
		);

		if (!excursion) {
			return res.status(404).json({ error: "Экскурсия не найдена" });
		}

		// Получаем количество заявок
		const requestCount = await dbGet(
			"SELECT COUNT(*) as count FROM requests WHERE excursion_id = ?",
			[id],
		);

		res.json({
			excursion: { ...excursion, request_count: requestCount.count },
		});
	} catch (error) {
		next(error);
	}
});

// Создать экскурсию (только оператор/админ)
router.post(
	"/",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const errors = validateExcursion(req.body);
			if (errors.length > 0) {
				return res.status(400).json({ error: errors.join(", ") });
			}

			// Проверяем существование предприятия
			const enterprise = await dbGet(
				"SELECT id FROM enterprises WHERE id = ?",
				[req.body.enterprise_id],
			);
			if (!enterprise) {
				return res.status(400).json({ error: "Предприятие не найдено" });
			}

			const {
				enterprise_id,
				title,
				short_description,
				target_audience,
				route_description,
				duration_minutes = 120,
				seasonality,
				base_price,
				extra_charges,
				group_min = 10,
				group_max = 20,
				photos,
			} = req.body;

			const result = await dbRun(
				`
      INSERT INTO excursions (enterprise_id, operator_id, title, short_description, target_audience, route_description, duration_minutes, seasonality, base_price, extra_charges, group_min, group_max, photos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
				[
					enterprise_id,
					req.user.id,
					title,
					short_description,
					target_audience,
					route_description,
					duration_minutes,
					seasonality,
					base_price,
					extra_charges,
					group_min,
					group_max,
					photos,
				],
			);

			res.status(201).json({
				message: "Экскурсия создана",
				excursion: { id: result.lastInsertRowid, title },
			});
		} catch (error) {
			next(error);
		}
	},
);

// Обновить экскурсию
router.put(
	"/:id",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const excursion = await dbGet("SELECT * FROM excursions WHERE id = ?", [
				id,
			]);

			if (!excursion) {
				return res.status(404).json({ error: "Экскурсия не найдена" });
			}

			if (excursion.operator_id !== req.user.id && req.user.role !== "admin") {
				return res
					.status(403)
					.json({ error: "Нельзя редактировать чужую экскурсию" });
			}

			const {
				enterprise_id,
				title,
				short_description,
				target_audience,
				route_description,
				duration_minutes,
				seasonality,
				base_price,
				extra_charges,
				group_min,
				group_max,
				photos,
				status,
			} = req.body;

			await dbRun(
				`
      UPDATE excursions SET
        enterprise_id = COALESCE(?, enterprise_id),
        title = COALESCE(?, title),
        short_description = COALESCE(?, short_description),
        target_audience = COALESCE(?, target_audience),
        route_description = COALESCE(?, route_description),
        duration_minutes = COALESCE(?, duration_minutes),
        seasonality = COALESCE(?, seasonality),
        base_price = COALESCE(?, base_price),
        extra_charges = COALESCE(?, extra_charges),
        group_min = COALESCE(?, group_min),
        group_max = COALESCE(?, group_max),
        photos = COALESCE(?, photos),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
				[
					enterprise_id,
					title,
					short_description,
					target_audience,
					route_description,
					duration_minutes,
					seasonality,
					base_price,
					extra_charges,
					group_min,
					group_max,
					photos,
					status,
					id,
				],
			);

			res.json({ message: "Экскурсия обновлена" });
		} catch (error) {
			next(error);
		}
	},
);

// Удалить экскурсию
router.delete(
	"/:id",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const excursion = await dbGet("SELECT * FROM excursions WHERE id = ?", [
				id,
			]);

			if (!excursion) {
				return res.status(404).json({ error: "Экскурсия не найдена" });
			}

			if (excursion.operator_id !== req.user.id && req.user.role !== "admin") {
				return res
					.status(403)
					.json({ error: "Нельзя удалять чужую экскурсию" });
			}

			await dbRun("DELETE FROM excursions WHERE id = ?", [id]);
			res.json({ message: "Экскурсия удалена" });
		} catch (error) {
			next(error);
		}
	},
);

export default router;
