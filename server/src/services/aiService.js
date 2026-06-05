import { dbGet, dbAll, dbRun } from "../db/db.js";

const AI_PROVIDER = process.env.AI_PROVIDER || "mock";

// Mock AI Service (заглушка для MVP)
class AIService {
	async getAlternatives(params, requestId = null) {
		const { excursion_id, requested_date, people_count } = params;

		// Получаем текущую экскурсию
		const excursion = await dbGet(
			`
      SELECT e.*, ent.name as enterprise_name
      FROM excursions e
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      WHERE e.id = ?
    `,
			[excursion_id],
		);

		if (!excursion) {
			return null;
		}

		// Получаем другие экскурсии того же оператора
		const otherExcursions = await dbAll(
			`
      SELECT e.*, ent.name as enterprise_name, ent.group_min,
             (SELECT COUNT(*) FROM requests r WHERE r.excursion_id = e.id AND r.requested_date = ? AND r.status IN ('pending', 'confirmed')) as current_enrolled
      FROM excursions e
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      WHERE e.operator_id = ? AND e.id != ? AND e.status = 'active'
    `,
			[requested_date, excursion.operator_id, excursion_id],
		);

		// Если есть другие экскурсии, предлагаем их
		if (otherExcursions.length > 0) {
			const alternatives = otherExcursions.slice(0, 3).map((exc, idx) => ({
				title: exc.title,
				enterprise: exc.enterprise_name,
				date: requested_date,
				people_count: exc.current_enrolled || 0,
				reason:
					exc.group_min <= (exc.current_enrolled || 0) + people_count
						? `Уже набрано ${exc.current_enrolled || 0} человек, группа может объединиться`
						: `Интересная альтернатива на том же предприятии`,
				priority: idx + 1,
			}));

			// Сохраняем рекомендации
			await this.saveRecommendation(requestId, "alternatives", {
				params,
				alternatives,
			});

			return alternatives;
		}

		// Если других экскурсий нет, предлагаем другую дату
		const alternatives = [
			{
				title: excursion.title,
				enterprise: excursion.enterprise_name,
				date: this.getNextAvailableDate(requested_date),
				people_count: 0,
				reason:
					"Попробуйте перенести на другую дату — так проще набрать группу",
				priority: 1,
			},
			{
				title: excursion.title,
				enterprise: excursion.enterprise_name,
				date: this.getNextAvailableDate(requested_date, 14),
				people_count: 0,
				reason: "Через 2 недели больше шансов собрать полную группу",
				priority: 2,
			},
		];

		await this.saveRecommendation(requestId, "alternatives", {
			params,
			alternatives,
		});

		return alternatives;
	}

	async getRecommendations(params) {
		const { user_id, target_audience, exclude_ids = [] } = params;

		// Получаем историю посещений пользователя
		const visits = await dbAll(
			`
      SELECT v.*, e.title, e.target_audience, ent.name as enterprise_name
      FROM visits v
      LEFT JOIN excursions e ON v.excursion_id = e.id
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      WHERE v.user_id = ? AND v.status = 'completed'
      ORDER BY v.visit_date DESC
      LIMIT 5
    `,
			[user_id],
		);

		// Получаем популярные экскурсии
		let sql = `
      SELECT e.*, ent.name as enterprise_name,
             COUNT(r.id) as request_count
      FROM excursions e
      LEFT JOIN enterprises ent ON e.enterprise_id = ent.id
      LEFT JOIN requests r ON r.excursion_id = e.id
      WHERE e.status = 'active'
    `;

		if (exclude_ids.length > 0) {
			sql += ` AND e.id NOT IN (${exclude_ids.join(",")})`;
		}

		sql += " GROUP BY e.id ORDER BY request_count DESC LIMIT 5";

		const popularExcursions = await dbAll(sql);

		// Формируем рекомендации
		const recommendations = popularExcursions.map((exc, idx) => ({
			title: exc.title,
			enterprise: exc.enterprise_name,
			reason:
				visits.length > 0
					? "Популярно среди тех, кто посещал похожие экскурсии"
					: "Одна из самых популярных экскурсий",
			match_score: Math.max(50, 100 - idx * 15),
		}));

		await this.saveRecommendation(null, "recommendations", {
			user_id,
			recommendations,
		});

		return recommendations;
	}

	async saveRecommendation(requestId, type, data) {
		try {
			await dbRun(
				`
        INSERT INTO ai_recommendations (user_id, request_id, type, input_json, output_json)
        VALUES (?, ?, ?, ?, ?)
      `,
				[
					data.user_id || null,
					requestId,
					type,
					JSON.stringify(data.params || {}),
					JSON.stringify(data.alternatives || data.recommendations || {}),
				],
			);
		} catch (error) {
			console.error("Error saving AI recommendation:", error);
		}
	}

	getNextAvailableDate(fromDate, daysToAdd = 7) {
		const date = new Date(fromDate);
		date.setDate(date.getDate() + daysToAdd);
		return date.toISOString().split("T")[0];
	}
}

// Mock AI провайдер
class MockAIProvider {
	async complete(prompt) {
		// В реальной реализации здесь будет вызов OpenAI/GPT
		// Для MVP возвращаем mock-ответ
		return {
			text: JSON.stringify({
				status: "ok",
				message: "Mock AI response",
			}),
		};
	}
}

const aiService = new AIService();

export default aiService;
