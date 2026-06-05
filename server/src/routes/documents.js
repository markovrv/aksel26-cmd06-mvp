import express from "express";
import { dbGet, dbRun, dbAll } from "../db/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import {
	generateContract,
	generateInvoice,
	generateAct,
} from "../services/documentService.js";

const router = express.Router();

// Сгенерировать документ (если уже есть такого типа — пересоздать)
router.post("/generate", authenticate, async (req, res, next) => {
	try {
		const { request_id, type } = req.body;

		if (!request_id) {
			return res.status(400).json({ error: "Укажите ID заявки" });
		}

		const validTypes = ["contract", "invoice", "act"];
		if (!validTypes.includes(type)) {
			return res.status(400).json({ error: "Недопустимый тип документа" });
		}

		// Получаем заявку с информацией
		const request = await dbGet(
			`
      SELECT r.*, e.title as excursion_title, e.base_price, e.duration_minutes,
             ent.name as enterprise_name, ent.address as enterprise_address, ent.contacts as enterprise_contacts,
             u.full_name as user_name, u.phone as user_phone, u.email as user_email,
             u.company_name, u.company_address, u.company_inn, u.company_bank
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `,
			[request_id],
		);

		if (!request) {
			return res.status(404).json({ error: "Заявка не найдена" });
		}

		// Если документ такого типа уже существует — удаляем (пересоздаём)
		await dbRun(
			"DELETE FROM documents WHERE request_id = ? AND type = ?",
			[request_id, type],
		);

		// Генерируем документ в HTML
		let generatedText;
		switch (type) {
			case "contract":
				generatedText = generateContract(request);
				break;
			case "invoice":
				generatedText = generateInvoice(request);
				break;
			case "act":
				generatedText = generateAct(request);
				break;
		}

		// Сохраняем документ
		const result = await dbRun(
			`
      INSERT INTO documents (request_id, type, generated_text, status)
      VALUES (?, ?, ?, ?)
    `,
			[request_id, type, generatedText, "generated"],
		);

		res.status(201).json({
			message: "Документ сгенерирован",
			document: {
				id: result.lastInsertRowid,
				type,
				generated_text: generatedText,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Получить HTML-содержимое документа для печати/PDF
router.get("/:id/html", authenticate, async (req, res, next) => {
	try {
		const { id } = req.params;
		const document = await dbGet("SELECT * FROM documents WHERE id = ?", [id]);

		if (!document) {
			return res.status(404).json({ error: "Документ не найден" });
		}

		res.json({ document: { ...document, generated_text: document.generated_text } });
	} catch (error) {
		next(error);
	}
});

// Получить документ по ID
router.get("/:id", authenticate, async (req, res, next) => {
	try {
		const { id } = req.params;
		const document = await dbGet("SELECT * FROM documents WHERE id = ?", [id]);

		if (!document) {
			return res.status(404).json({ error: "Документ не найден" });
		}

		res.json({ document });
	} catch (error) {
		next(error);
	}
});

// Получить документы заявки
router.get("/request/:requestId", authenticate, async (req, res, next) => {
	try {
		const { requestId } = req.params;
		const documents = await dbAll(
			"SELECT * FROM documents WHERE request_id = ?",
			[requestId],
		);

		res.json({ documents });
	} catch (error) {
		next(error);
	}
});

// Получить все документы (для админа/оператора)
router.get(
	"/",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const { request_id } = req.query;

			let sql = `
      SELECT d.*, r.requested_date, e.title as excursion_title, u.full_name as user_name
      FROM documents d
      LEFT JOIN requests r ON d.request_id = r.id
      LEFT JOIN excursions e ON r.excursion_id = e.id
      LEFT JOIN users u ON r.user_id = u.id
      WHERE 1=1
    `;
			const params = [];

			if (req.user.role === "operator") {
				sql += " AND e.operator_id = ?";
				params.push(req.user.id);
			}

			if (request_id) {
				sql += " AND d.request_id = ?";
				params.push(request_id);
			}

			sql += " ORDER BY d.created_at DESC";

			const documents = await dbAll(sql, params);
			res.json({ documents });
		} catch (error) {
			next(error);
		}
	},
);

export default router;
