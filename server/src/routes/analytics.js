import express from "express";
import { dbAll, dbGet } from "../db/db.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Общая статистика
router.get(
	"/summary",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			let whereClause = "";
			const params = [];

			if (req.user.role === "operator") {
				whereClause = "WHERE e.operator_id = ?";
				params.push(req.user.id);
			}

			// Количество заявок по статусам
			const requestStats = await dbAll(
				`
      SELECT r.status, COUNT(*) as count
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      ${whereClause}
      GROUP BY r.status
    `,
				params,
			);

			// Общие показатели
			const totals = await dbGet(
				`
      SELECT 
        COUNT(DISTINCT r.id) as total_requests,
        SUM(CASE WHEN r.status = 'completed' THEN e.base_price * r.people_count ELSE 0 END) as total_revenue,
        SUM(DISTINCT e.id) as total_excursions,
        SUM(DISTINCT e.enterprise_id) as total_enterprises
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      ${whereClause}
    `,
				params,
			);

			// Подтверждённые экскурсии
			const confirmedCount =
				requestStats.find((s) => s.status === "confirmed")?.count || 0;
			const completedCount =
				requestStats.find((s) => s.status === "completed")?.count || 0;
			const notMetCount =
				requestStats.find((s) => s.status === "group_not_met")?.count || 0;

			res.json({
				summary: {
					total_requests: totals.total_requests || 0,
					confirmed: confirmedCount,
					completed: completedCount,
					group_not_met: notMetCount,
					total_revenue: totals.total_revenue || 0,
					total_excursions: totals.total_excursions || 0,
				},
				by_status: requestStats,
			});
		} catch (error) {
			next(error);
		}
	},
);

// Популярные экскурсии
router.get(
	"/popular",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			let whereClause = "";
			const params = [];

			if (req.user.role === "operator") {
				whereClause = "WHERE e.operator_id = ?";
				params.push(req.user.id);
			}

			const popular = await dbAll(
				`
      SELECT e.id, e.title, ent.name as enterprise_name,
             COUNT(r.id) as request_count,
             SUM(CASE WHEN r.status IN ('confirmed', 'completed') THEN r.people_count ELSE 0 END) as total_visitors,
             SUM(CASE WHEN r.status IN ('confirmed', 'completed') THEN e.base_price * r.people_count ELSE 0 END) as revenue
      FROM excursions e
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      LEFT JOIN requests r ON r.excursion_id = e.id
      ${whereClause}
      GROUP BY e.id
      ORDER BY request_count DESC
      LIMIT 10
    `,
				params,
			);

			res.json({ popular });
		} catch (error) {
			next(error);
		}
	},
);

// Доходы
router.get(
	"/revenue",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			const { period = "month" } = req.query;

			let dateFormat;
			switch (period) {
				case "year":
					dateFormat = "%Y";
					break;
				case "week":
					dateFormat = "%Y-%W";
					break;
				default:
					dateFormat = "%Y-%m";
			}

			let whereClause = "";
			const params = [];

			if (req.user.role === "operator") {
				whereClause = "AND e.operator_id = ?";
				params.push(req.user.id);
			}

			const revenue = await dbAll(
				`
      SELECT 
        strftime('${dateFormat}', r.requested_date) as period,
        COUNT(DISTINCT r.id) as request_count,
        SUM(r.people_count) as visitors,
        SUM(e.base_price * r.people_count) as revenue
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      WHERE r.status IN ('confirmed', 'completed') ${whereClause}
      GROUP BY period
      ORDER BY period DESC
      LIMIT 12
    `,
				params,
			);

			res.json({ revenue, period });
		} catch (error) {
			next(error);
		}
	},
);

// Сезонность
router.get(
	"/seasonality",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			let whereClause = "";
			const params = [];

			if (req.user.role === "operator") {
				whereClause = "WHERE e.operator_id = ?";
				params.push(req.user.id);
			}

			const seasonality = await dbAll(
				`
      SELECT 
        strftime('%m', r.requested_date) as month,
        COUNT(DISTINCT r.id) as request_count,
        SUM(r.people_count) as visitors
      FROM requests r
      LEFT JOIN excursions e ON r.excursion_id = e.id
      ${whereClause}
      GROUP BY month
      ORDER BY month
    `,
				params,
			);

			const monthNames = [
				"Январь",
				"Февраль",
				"Март",
				"Апрель",
				"Май",
				"Июнь",
				"Июль",
				"Август",
				"Сентябрь",
				"Октябрь",
				"Ноябрь",
				"Декабрь",
			];

			const result = seasonality.map((s) => ({
				month: parseInt(s.month),
				month_name: monthNames[parseInt(s.month) - 1] || s.month,
				request_count: s.request_count,
				visitors: s.visitors,
			}));

			res.json({ seasonality: result });
		} catch (error) {
			next(error);
		}
	},
);

// Возрастные группы
router.get(
	"/age-groups",
	authenticate,
	requireRole("operator", "admin"),
	async (req, res, next) => {
		try {
			let whereClause = "";
			const params = [];

			if (req.user.role === "operator") {
				whereClause = "WHERE e.operator_id = ?";
				params.push(req.user.id);
			}

			const ageGroups = await dbAll(
				`
      SELECT v.group_age, COUNT(*) as count, SUM(v.people_count) as visitors
      FROM visits v
      LEFT JOIN excursions e ON v.excursion_id = e.id
      ${whereClause}
      GROUP BY v.group_age
      ORDER BY count DESC
    `,
				params,
			);

			res.json({ age_groups: ageGroups });
		} catch (error) {
			next(error);
		}
	},
);

export default router;
