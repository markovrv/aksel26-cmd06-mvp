import express from "express";
import { authenticate } from "../middleware/auth.js";
import aiService from "../services/aiService.js";

const router = express.Router();

// Альтернативы при недоборе группы
router.post("/alternatives", authenticate, async (req, res, next) => {
	try {
		const { excursion_id, requested_date, people_count, current_request_id } =
			req.body;

		if (!excursion_id || !requested_date || !people_count) {
			return res
				.status(400)
				.json({ error: "Укажите ID экскурсии, дату и количество человек" });
		}

		const alternatives = await aiService.getAlternatives(
			{
				excursion_id,
				requested_date,
				people_count,
			},
			current_request_id,
		);

		res.json({ alternatives });
	} catch (error) {
		next(error);
	}
});

// Рекомендации для пользователя
router.post("/recommendations", authenticate, async (req, res, next) => {
	try {
		const { target_audience, exclude_ids = [] } = req.body;

		const recommendations = await aiService.getRecommendations({
			user_id: req.user.id,
			target_audience,
			exclude_ids,
		});

		res.json({ recommendations });
	} catch (error) {
		next(error);
	}
});

export default router;
