import express from "express";
import cors from "cors";
import { config } from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Загрузка переменных окружения
config();

// Импорт маршрутов
import authRoutes from "./routes/auth.js";
import enterprisesRoutes from "./routes/enterprises.js";
import excursionsRoutes from "./routes/excursions.js";
import requestsRoutes from "./routes/requests.js";
import documentsRoutes from "./routes/documents.js";
import calculationsRoutes from "./routes/calculations.js";
import analyticsRoutes from "./routes/analytics.js";
import aiRoutes from "./routes/ai.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статические файлы для storage
app.use("/storage", express.static(path.join(__dirname, "../storage")));

// API маршруты
app.use("/api/auth", authRoutes);
app.use("/api/enterprises", enterprisesRoutes);
app.use("/api/excursions", excursionsRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/calculations", calculationsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (req, res) => {
	res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// SPA fallback (для production)
const clientDistPath = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientDistPath)) {
	app.use(express.static(clientDistPath));
	app.get("*", (req, res) => {
		if (!req.path.startsWith("/api")) {
			res.sendFile(path.join(clientDistPath, "index.html"));
		}
	});
}

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Запуск сервера
app.listen(PORT, () => {
	console.log(`
╔════════════════════════════════════════════════════════════════╗
║     ТурМенеджер — Промышленный туризм                   ║
║     Сервер запущен на http://localhost:${PORT}             ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;
