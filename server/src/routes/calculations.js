import express from "express";
import { dbGet, dbRun, dbAll } from "../db/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { validateCalculation } from "../validators/auth.js";

const router = express.Router();

// Константы для расчёта
const DEFAULT_GUIDE_COST = 2500; // Оплата гида за группу
const DEFAULT_TRANSPORT_COST = 1500; // Транспорт за час
const OVERHEAD_PERCENT = 0.15; // 15% накладных расходов

// Расчёт рентабельности
router.post("/run", authenticate, async (req, res, next) => {
	try {
		const errors = validateCalculation(req.body);
		if (errors.length > 0) {
			return res.status(400).json({ error: errors.join(", ") });
		}

		const {
			excursion_id,
			people_count,
			guide_cost = DEFAULT_GUIDE_COST,
			transport_cost = 0,
			enterprise_fee = 0,
			overhead_percent,
		} = req.body;

		// Получаем экскурсию вместе с предприятием (для ticket_price)
		const excursion = await dbGet(
			`
      SELECT e.*, ent.ticket_price as enterprise_ticket_price
      FROM excursions e
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      WHERE e.id = ?
    `,
			[excursion_id],
		);
		if (!excursion) {
			return res.status(404).json({ error: "Экскурсия не найдена" });
		}

		// Расчёт
		const revenue = excursion.base_price * people_count;
		const guideCostTotal = guide_cost;
		const transportCostTotal = transport_cost;
		const enterpriseFeeTotal =
			enterprise_fee || (excursion.enterprise_ticket_price || 0) * people_count;

		const directCosts =
			guideCostTotal + transportCostTotal + enterpriseFeeTotal;
		const usedOverheadPercent = overhead_percent != null ? overhead_percent / 100 : OVERHEAD_PERCENT;
		const overheadCost = directCosts * usedOverheadPercent;
		const totalCosts = directCosts + overheadCost;
		const profit = revenue - totalCosts;
		const profitability = totalCosts > 0 ? (profit / totalCosts) * 100 : 0;

		// Сохраняем расчёт
		const result = await dbRun(
			`
      INSERT INTO calculations (excursion_id, people_count, guide_cost, transport_cost, enterprise_fee, overhead_cost, revenue, profit, profitability)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
			[
				excursion_id,
				people_count,
				guideCostTotal,
				transportCostTotal,
				enterpriseFeeTotal,
				overheadCost,
				revenue,
				profit,
				profitability,
			],
		);

		res.status(201).json({
			calculation: {
				id: result.lastInsertRowid,
				excursion_id,
				excursion_title: excursion.title,
				people_count,
				revenue,
				costs: {
					guide: guideCostTotal,
					transport: transportCostTotal,
					enterprise: enterpriseFeeTotal,
					overhead: overheadCost,
					total: totalCosts,
				},
				profit,
				profitability: profitability.toFixed(2),
				details: {
					price_per_person: excursion.base_price,
					guide_cost_per_group: guide_cost,
					transport_cost_per_hour: transport_cost,
					overhead_percent: Math.round(usedOverheadPercent * 100),
				},
			},
		});
	} catch (error) {
		next(error);
	}
});

// Получить расчёт по ID
router.get("/:id", authenticate, async (req, res, next) => {
	try {
		const { id } = req.params;
		const calculation = await dbGet(
			`
      SELECT c.*, e.title as excursion_title, e.base_price
      FROM calculations c
      LEFT JOIN excursions e ON c.excursion_id = e.id
      WHERE c.id = ?
    `,
			[id],
		);

		if (!calculation) {
			return res.status(404).json({ error: "Расчёт не найден" });
		}

		res.json({ calculation });
	} catch (error) {
		next(error);
	}
});

// Получить расчёты по экскурсии
router.get("/excursion/:excursionId", authenticate, async (req, res, next) => {
	try {
		const { excursionId } = req.params;
		const calculations = await dbAll(
			`
      SELECT * FROM calculations WHERE excursion_id = ? ORDER BY created_at DESC
    `,
			[excursionId],
		);

		res.json({ calculations });
	} catch (error) {
		next(error);
	}
});

export default router;
