import { dbExec } from "./db.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";
import { dbRun, dbGet } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function initDatabase() {
	console.log("Инициализация базы данных...");

	try {
		// Читаем и выполняем схему
		const schema = readFileSync(join(__dirname, "schema.sql"), "utf-8");
		await dbExec(schema);
		console.log("✓ Таблицы созданы");

		// Создаём админа если его нет
		const existingAdmin = await dbGet("SELECT id FROM users WHERE role = ?", [
			"admin",
		]);

		if (!existingAdmin) {
			const passwordHash = await bcrypt.hash(
				process.env.ADMIN_PASSWORD || "admin123",
				10,
			);
			await dbRun(
				`
        INSERT INTO users (role, full_name, email, phone, password_hash, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
				[
					"admin",
					"Администратор",
					"admin@industrial-tourism.ru",
					"+7 (800) 123-45-67",
					passwordHash,
					"active",
				],
			);
			console.log("✓ Администратор создан");
		}

		console.log("База данных готова!");
	} catch (error) {
		console.error("Ошибка инициализации:", error);
		process.exit(1);
	}
}

initDatabase();
