// Валидация данных

const phoneRegex =
	/^(\+7|8)?[\s-]?\(?[0-9]{3}\)?[\s-]?[0-9]{3}[\s-]?[0-9]{2}[\s-]?[0-9]{2}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistration = (data) => {
	const errors = [];

	if (!data.full_name || data.full_name.trim().length < 2) {
		errors.push("Имя должно содержать минимум 2 символа");
	}

	if (!data.email || !emailRegex.test(data.email)) {
		errors.push("Некорректный email");
	}

	if (!data.password || data.password.length < 6) {
		errors.push("Пароль должен содержать минимум 6 символов");
	}

	if (data.phone && !phoneRegex.test(data.phone.replace(/\s/g, ""))) {
		errors.push("Некорректный номер телефона");
	}

	if (data.role === "operator") {
		if (!data.company_name) {
			errors.push("Название компании обязательно для оператора");
		}
	}

	return errors;
};

export const validateLogin = (data) => {
	const errors = [];

	if (!data.email) {
		errors.push("Email обязателен");
	}

	if (!data.password) {
		errors.push("Пароль обязателен");
	}

	return errors;
};

export const validateEnterprise = (data) => {
	const errors = [];

	if (!data.name || data.name.trim().length < 2) {
		errors.push("Название обязательно");
	}

	if (!data.address) {
		errors.push("Адрес обязателен");
	}

	if (data.group_min && data.group_max && data.group_min > data.group_max) {
		errors.push("Минимальный размер группы не может быть больше максимального");
	}

	if (data.ticket_price && data.ticket_price < 0) {
		errors.push("Стоимость не может быть отрицательной");
	}

	return errors;
};

export const validateExcursion = (data) => {
	const errors = [];

	if (!data.title || data.title.trim().length < 2) {
		errors.push("Название экскурсии обязательно");
	}

	if (!data.enterprise_id) {
		errors.push("Выберите предприятие");
	}

	if (!data.base_price || data.base_price <= 0) {
		errors.push("Укажите стоимость");
	}

	if (data.group_min && data.group_max && data.group_min > data.group_max) {
		errors.push("Минимальный размер группы не может быть больше максимального");
	}

	if (data.duration_minutes && data.duration_minutes <= 0) {
		errors.push("Продолжительность должна быть положительной");
	}

	return errors;
};

export const validateRequest = (data) => {
	const errors = [];
	const today = new Date().toISOString().split("T")[0];

	if (!data.excursion_id) {
		errors.push("Выберите экскурсию");
	}

	if (!data.requested_date) {
		errors.push("Укажите дату");
	} else if (data.requested_date < today) {
		errors.push("Дата не может быть в прошлом");
	}

	if (!data.people_count || data.people_count < 1) {
		errors.push("Укажите количество участников");
	}

	if (
		data.contact_phone &&
		!phoneRegex.test(data.contact_phone.replace(/\s/g, ""))
	) {
		errors.push("Некорректный номер телефона");
	}

	if (data.contact_email && !emailRegex.test(data.contact_email)) {
		errors.push("Некорректный email");
	}

	return errors;
};

export const validateCalculation = (data) => {
	const errors = [];

	if (!data.excursion_id) {
		errors.push("Выберите экскурсию");
	}

	if (!data.people_count || data.people_count < 1) {
		errors.push("Укажите количество человек");
	}

	if (data.guide_cost && data.guide_cost < 0) {
		errors.push("Стоимость гида не может быть отрицательной");
	}

	if (data.transport_cost && data.transport_cost < 0) {
		errors.push("Стоимость транспорта не может быть отрицательной");
	}

	return errors;
};
