import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath =
	process.env.DB_PATH || path.join(__dirname, "../../../data/base.db");

// Создаём базу данных
const db = new sqlite3.Database(dbPath);

// Promisify методы - результат содержит lastID и changes
const dbRun = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		db.run(sql, params, function (err) {
			if (err) reject(err);
			else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
		});
	});
};

const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));
const dbExec = promisify(db.exec.bind(db));

// Export functions
export { dbRun, dbGet, dbAll, dbExec };

export default db;
