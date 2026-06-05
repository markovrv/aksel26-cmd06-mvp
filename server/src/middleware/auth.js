import jwt from "jsonwebtoken";
import { dbGet } from "../db/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "industrial-tourism-secret";

export const authenticate = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ error: "Не авторизован" });
		}

		const token = authHeader.split(" ")[1];
		const decoded = jwt.verify(token, JWT_SECRET);

		const user = await dbGet(
			"SELECT * FROM users WHERE id = ? AND status = ?",
			[decoded.userId, "active"],
		);

		if (!user) {
			return res.status(401).json({ error: "Пользователь не найден" });
		}

		req.user = user;
		next();
	} catch (error) {
		if (error.name === "TokenExpiredError") {
			return res.status(401).json({ error: "Токен истёк" });
		}
		return res.status(401).json({ error: "Неверный токен" });
	}
};

export const requireRole = (...roles) => {
	return (req, res, next) => {
		if (!req.user) {
			return res.status(401).json({ error: "Не авторизован" });
		}

		if (!roles.includes(req.user.role)) {
			return res.status(403).json({ error: "Недостаточно прав" });
		}

		next();
	};
};

export const optionalAuth = async (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			const decoded = jwt.verify(token, JWT_SECRET);
			const user = await dbGet(
				"SELECT * FROM users WHERE id = ? AND status = ?",
				[decoded.userId, "active"],
			);
			if (user) {
				req.user = user;
			}
		}

		next();
	} catch {
		next();
	}
};
