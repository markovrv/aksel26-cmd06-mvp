export const errorHandler = (err, req, res, next) => {
	console.error("Error:", err);

	if (err.type === "validation") {
		return res.status(400).json({
			error: "Ошибка валидации",
			details: err.errors,
		});
	}

	if (err.type === "not_found") {
		return res.status(404).json({
			error: err.message || "Ресурс не найден",
		});
	}

	if (err.type === "forbidden") {
		return res.status(403).json({
			error: err.message || "Доступ запрещён",
		});
	}

	res.status(500).json({
		error: "Внутренняя ошибка сервера",
	});
};

export const notFoundHandler = (req, res) => {
	res.status(404).json({
		error: "Эндпоинт не найден",
	});
};
