import express from "express";
import { dbGet, dbRun, dbAll } from "../db/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateEnterprise } from "../validators/auth.js";

const router = express.Router();

// Получить список предприятий
router.get("/", async (req, res, next) => {
	try {
		const { status = "active", search } = req.query;

		let sql = "SELECT * FROM enterprises WHERE 1=1";
		const params = [];

		if (status) {
			sql += " AND status = ?";
			params.push(status);
		}

		if (search) {
			sql += " AND (name LIKE ? OR description LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}

		sql += " ORDER BY name";

		const enterprises = await dbAll(sql, params);
		res.json({ enterprises });
	} catch (error) {
		next(error);
	}
});

// Получить предприятие по ID
router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const enterprise = await dbGet("SELECT * FROM enterprises WHERE id = ?", [
			id,
		]);

		if (!enterprise) {
			return res.status(404).json({ error: "Предприятие не найдено" });
		}

		// Получаем связанные экскурсии
		const excursions = await dbAll(
			"SELECT * FROM excursions WHERE enterprise_id = ? AND status = ?",
			[id, "active"],
		);

		res.json({ enterprise, excursions });
	} catch (error) {
		next(error);
	}
});

// Создать предприятие (только оператор/админ)
router.post(
	"/",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const errors = validateEnterprise(req.body);
			if (errors.length > 0) {
				return res.status(400).json({ error: errors.join(", ") });
			}

			const {
				name,
				description,
				address,
				contacts,
				access_rules,
				group_min = 10,
				group_max = 50,
				ticket_price = 0,
				age_limit,
				ovz_accessible = 0,
				seasonality,
				photos,
			} = req.body;

			const result = await dbRun(
				`
      INSERT INTO enterprises (name, description, address, contacts, access_rules, group_min, group_max, ticket_price, age_limit, ovz_accessible, seasonality, photos, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
				[
					name,
					description,
					address,
					contacts,
					access_rules,
					group_min,
					group_max,
					ticket_price,
					age_limit,
					ovz_accessible,
					seasonality,
					photos,
					req.user.id,
				],
			);

			res.status(201).json({
				message: "Предприятие создано",
				enterprise: { id: result.lastInsertRowid, name },
			});
		} catch (error) {
			next(error);
		}
	},
);

// Обновить предприятие
router.put(
	"/:id",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const enterprise = await dbGet("SELECT * FROM enterprises WHERE id = ?", [
				id,
			]);

			if (!enterprise) {
				return res.status(404).json({ error: "Предприятие не найдено" });
			}

			// Проверяем, что пользователь создал это предприятие или он админ
			if (enterprise.created_by !== req.user.id && req.user.role !== "admin") {
				return res
					.status(403)
					.json({ error: "Нельзя редактировать чужое предприятие" });
			}

			const {
				name,
				description,
				address,
				contacts,
				access_rules,
				group_min,
				group_max,
				ticket_price,
				age_limit,
				ovz_accessible,
				seasonality,
				photos,
				status,
			} = req.body;

			await dbRun(
				`
      UPDATE enterprises SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        address = COALESCE(?, address),
        contacts = COALESCE(?, contacts),
        access_rules = COALESCE(?, access_rules),
        group_min = COALESCE(?, group_min),
        group_max = COALESCE(?, group_max),
        ticket_price = COALESCE(?, ticket_price),
        age_limit = COALESCE(?, age_limit),
        ovz_accessible = COALESCE(?, ovz_accessible),
        seasonality = COALESCE(?, seasonality),
        photos = COALESCE(?, photos),
        status = COALESCE(?, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
				[
					name,
					description,
					address,
					contacts,
					access_rules,
					group_min,
					group_max,
					ticket_price,
					age_limit,
					ovz_accessible,
					seasonality,
					photos,
					status,
					id,
				],
			);

			res.json({ message: "Предприятие обновлено" });
		} catch (error) {
			next(error);
		}
	},
);

// Удалить предприятие
router.delete(
	"/:id",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const { id } = req.params;
			const enterprise = await dbGet("SELECT * FROM enterprises WHERE id = ?", [
				id,
			]);

			if (!enterprise) {
				return res.status(404).json({ error: "Предприятие не найдено" });
			}

			if (enterprise.created_by !== req.user.id && req.user.role !== "admin") {
				return res
					.status(403)
					.json({ error: "Нельзя удалять чужое предприятие" });
			}

			await dbRun("DELETE FROM enterprises WHERE id = ?", [id]);
			res.json({ message: "Предприятие удалено" });
		} catch (error) {
			next(error);
		}
	},
);

export default router;
