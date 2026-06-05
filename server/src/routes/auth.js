import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbGet, dbRun, dbAll } from "../db/db.js";
import { authenticate } from "../middleware/auth.js";
import { validateRegistration, validateLogin } from "../validators/auth.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "industrial-tourism-secret";

// Регистрация
router.post("/register", async (req, res, next) => {
	try {
		const {
			full_name,
			email,
			password,
			phone,
			role = "tourist",
			company_name,
			company_address,
		} = req.body;

		const errors = validateRegistration(req.body);
		if (errors.length > 0) {
			return res.status(400).json({ error: errors.join(", ") });
		}

		// Проверяем уникальность email
		const existing = await dbGet("SELECT id FROM users WHERE email = ?", [
			email,
		]);
		if (existing) {
			return res
				.status(400)
				.json({ error: "Пользователь с таким email уже существует" });
		}

		// Хешируем пароль
		const password_hash = await bcrypt.hash(password, 10);

		// Создаём пользователя
		const result = await dbRun(
			`
      INSERT INTO users (role, full_name, email, phone, password_hash, company_name, company_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
			[
				role,
				full_name,
				email,
				phone || null,
				password_hash,
				company_name || null,
				company_address || null,
			],
		);

		// Генерируем токен
		const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, {
			expiresIn: "7d",
		});

		res.status(201).json({
			message: "Регистрация успешна",
			token,
			user: {
				id: result.lastInsertRowid,
				role,
				full_name,
				email,
				phone,
				company_name,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Вход
router.post("/login", async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const errors = validateLogin(req.body);
		if (errors.length > 0) {
			return res.status(400).json({ error: errors.join(", ") });
		}

		const user = await dbGet("SELECT * FROM users WHERE email = ?", [email]);
		if (!user) {
			return res.status(401).json({ error: "Неверный email или пароль" });
		}

		if (user.status === "blocked") {
			return res.status(403).json({ error: "Аккаунт заблокирован" });
		}

		const validPassword = await bcrypt.compare(password, user.password_hash);
		if (!validPassword) {
			return res.status(401).json({ error: "Неверный email или пароль" });
		}

		const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
			expiresIn: "7d",
		});

		res.json({
			message: "Вход выполнен",
			token,
			user: {
				id: user.id,
				role: user.role,
				full_name: user.full_name,
				email: user.email,
				phone: user.phone,
				company_name: user.company_name,
			},
		});
	} catch (error) {
		next(error);
	}
});

// Текущий пользователь
router.get("/me", authenticate, async (req, res) => {
	res.json({
		user: {
			id: req.user.id,
			role: req.user.role,
			full_name: req.user.full_name,
			email: req.user.email,
			phone: req.user.phone,
			company_name: req.user.company_name,
			company_address: req.user.company_address,
		},
	});
});

// Выход (просто заглушка на клиенте удаляет токен)
router.post("/logout", authenticate, (req, res) => {
	res.json({ message: "Выход выполнен" });
});

// Получить список всех пользователей (для админа)
router.get("/users", authenticate, async (req, res, next) => {
	try {
		if (req.user.role !== "admin") {
			return res.status(403).json({ error: "Доступно только администраторам" });
		}

		const users = await dbAll(`
      SELECT id, role, full_name, email, phone, company_name, status, created_at
      FROM users
      ORDER BY created_at DESC
    `);

		res.json({ users });
	} catch (error) {
		next(error);
	}
});

export default router;
