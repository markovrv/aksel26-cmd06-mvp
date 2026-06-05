import bcrypt from "bcryptjs";
import { dbRun, dbGet, dbAll } from "./db.js";
import { v4 as uuidv4 } from "uuid";

const seedData = async () => {
	console.log("Заполнение демо-данными...");

	try {
		// Проверяем, есть ли уже данные
		const existingUsers = await dbGet(
			"SELECT COUNT(*) as count FROM users WHERE role = ?",
			["operator"],
		);
		if (existingUsers.count > 0) {
			console.log("Данные уже существуют, пропускаем seed");
			return;
		}

		// Создаём туроператора
		const operatorHash = await bcrypt.hash("operator123", 10);
		const operatorResult = await dbRun(
			`
      INSERT INTO users (role, full_name, email, phone, password_hash, company_name, company_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
			[
				"operator",
				"ООО «ПромТур»",
				"operator@promtour.ru",
				"+7 (922) 111-22-33",
				operatorHash,
				"ООО «ПромТур»",
				"г. Киров, ул. Промышленная, д. 15",
				"active",
			],
		);
		const operatorId = operatorResult.lastInsertRowid;
		console.log("✓ Туроператор создан");

		// Создаём туристов
		const touristHash = await bcrypt.hash("tourist123", 10);
		await dbRun(
			`
      INSERT INTO users (role, full_name, email, phone, password_hash, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
			[
				"tourist",
				"Иванова Мария Сергеевна",
				"ivanova@mail.ru",
				"+7 (999) 888-77-66",
				touristHash,
				"active",
			],
		);
		await dbRun(
			`
      INSERT INTO users (role, full_name, email, phone, password_hash, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
			[
				"tourist",
				"Петров Алексей Викторович",
				"petrov@gmail.com",
				"+7 (888) 777-66-55",
				touristHash,
				"active",
			],
		);
		console.log("✓ Туристы созданы");

		// Создаём предприятия
		const enterprises = [
			{
				name: "АО «Здрава» — Производство майонеза",
				description:
					"Современное производство популярных соусов. Вы увидите полный цикл производства — от отбора сырья до упаковки готового продукта.",
				address: "г. Киров, ул. Производственная, д. 42",
				contacts: "+7 (8332) 55-55-55, info@zdrava.ru",
				access_rules:
					"Обязательна предварительная запись. Группа от 10 человек.",
				group_min: 10,
				group_max: 30,
				ticket_price: 800,
				age_limit: "0+",
				ovz_accessible: 1,
				seasonality: "круглогодично",
			},
			{
				name: "Кировский молочный комбинат",
				description:
					"Крупнейший производитель молочной продукции в регионе. Экскурсия включает посещение цехов и дегустацию.",
				address: "г. Киров, ул. Молочная, д. 8",
				contacts: "+7 (8332) 44-44-44, info@dairy-kirov.ru",
				access_rules:
					"Группы по предварительной записи. С собой иметь сменную обувь.",
				group_min: 10,
				group_max: 40,
				ticket_price: 600,
				age_limit: "6+",
				ovz_accessible: 1,
				seasonality: "круглогодично",
			},
			{
				name: "Кировский электромеханический завод",
				description:
					"Производство электрооборудования для промышленности. Современные технологии и история развития.",
				address: "г. Киров, ул. Заводская, д. 25",
				contacts: "+7 (8332) 33-33-33, info@kemz.ru",
				access_rules:
					"Только для организованных групп. Обязательна каска и светоотражающий жилет.",
				group_min: 12,
				group_max: 25,
				ticket_price: 1000,
				age_limit: "16+",
				ovz_accessible: 0,
				seasonality: "март-ноябрь",
			},
			{
				name: "Кондитерская фабрика «Сластёна»",
				description:
					"Производство кондитерских изделий. Аромат свежей выпечки и сладкие сувениры.",
				address: "г. Киров, ул. Сладкая, д. 3",
				contacts: "+7 (8332) 22-22-22, info@slastyona.ru",
				access_rules:
					"Предварительная запись обязательна. Дети до 14 лет в сопровождении взрослых.",
				group_min: 10,
				group_max: 35,
				ticket_price: 750,
				age_limit: "3+",
				ovz_accessible: 1,
				seasonality: "круглогодично",
			},
			{
				name: "Вятский фанерный комбинат",
				description:
					"Производство фанеры и древесных плит. Экологичное производство и современные технологии.",
				address: "г. Киров, ул. Лесная, д. 17",
				contacts: "+7 (8332) 11-11-11, info@fanera.ru",
				access_rules:
					"Только для групп от 15 человек. Обязательна закрытая обувь.",
				group_min: 15,
				group_max: 30,
				ticket_price: 900,
				age_limit: "12+",
				ovz_accessible: 0,
				seasonality: "круглогодично",
			},
		];

		for (const ent of enterprises) {
			await dbRun(
				`
        INSERT INTO enterprises (name, description, address, contacts, access_rules, group_min, group_max, ticket_price, age_limit, ovz_accessible, seasonality, created_by, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
				[
					ent.name,
					ent.description,
					ent.address,
					ent.contacts,
					ent.access_rules,
					ent.group_min,
					ent.group_max,
					ent.ticket_price,
					ent.age_limit,
					ent.ovz_accessible,
					ent.seasonality,
					operatorId,
					"active",
				],
			);
		}
		console.log("✓ Предприятия созданы");

		// Получаем ID предприятий
		const ents = await dbAll("SELECT id, name FROM enterprises");
		const entMap = {};
		ents.forEach((e) => (entMap[e.name.split(" — ")[0]] = e.id));

		// Создаём экскурсии
		const excursions = [
			{
				enterprise_id: entMap["АО «Здрава»"],
				title: "Секреты производства майонеза",
				short_description:
					"Узнайте, как рождается один из самых популярных соусов России",
				target_audience: "Семейные группы, корпоративы, школьники",
				route_description:
					"Знакомство с историей → Музей предприятия → Производственный цех → Дегустация → Сувениры",
				duration_minutes: 120,
				seasonality: "круглогодично",
				base_price: 800,
				extra_charges: "Дегустационный набор — 200 ₽",
				group_min: 10,
				group_max: 20,
			},
			{
				enterprise_id: entMap["Кировский молочный комбинат"],
				title: "Путь молока от фермы до прилавка",
				short_description:
					"Посмотрите, как производится качественная молочная продукция",
				target_audience: "Семьи с детьми, школьные группы",
				route_description:
					"Приёмное отделение → Основной цех → Упаковочная линия → Лаборатория качества → Дегустация",
				duration_minutes: 90,
				seasonality: "круглогодично",
				base_price: 600,
				extra_charges: "Мини-набор продукции — 150 ₽",
				group_min: 10,
				group_max: 25,
			},
			{
				enterprise_id: entMap["Кир客ский электромеханический завод"],
				title: "Сердце промышленности",
				short_description:
					"Экскурсия на действующее производство электрооборудования",
				target_audience: "Студенты, специалисты, корпоративные группы",
				route_description:
					"Брифинг по технике безопасности → Сборочный цех → Испытательная лаборатория → Выставочный зал",
				duration_minutes: 150,
				seasonality: "март-ноябрь",
				base_price: 1000,
				extra_charges: "СИЗ (каска, жилет) — 100 ₽/чел.",
				group_min: 12,
				group_max: 20,
			},
			{
				enterprise_id: entMap["Кондитерская фабрика «Сластёна»"],
				title: "Сладкое путешествие",
				short_description: "Аромат ванили, хруст печенья и море сладостей",
				target_audience: "Семьи с детьми, сладкоежки всех возрастов",
				route_description:
					"История фабрики → Цех печенья → Цех конфет → Упаковка → Дегустация → Магазин",
				duration_minutes: 100,
				seasonality: "круглогодично",
				base_price: 750,
				extra_charges: "Подарочный набор — 300 ₽",
				group_min: 10,
				group_max: 25,
			},
			{
				enterprise_id: entMap["Вятский фанерный комбинат"],
				title: "Дерево в дело",
				short_description:
					"Как древесина превращается в качественные материалы",
				target_audience: "Школьники, студенты, специалисты лесной отрасли",
				route_description:
					"Лесной двор → Сушка → Лущение → Прессование → Обработка → Склад",
				duration_minutes: 180,
				seasonality: "круглогодично",
				base_price: 900,
				extra_charges: "Образцы продукции — 250 ₽",
				group_min: 15,
				group_max: 25,
			},
		];

		for (const exc of excursions) {
			await dbRun(
				`
        INSERT INTO excursions (enterprise_id, operator_id, title, short_description, target_audience, route_description, duration_minutes, seasonality, base_price, extra_charges, group_min, group_max, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
				[
					exc.enterprise_id,
					operatorId,
					exc.title,
					exc.short_description,
					exc.target_audience,
					exc.route_description,
					exc.duration_minutes,
					exc.seasonality,
					exc.base_price,
					exc.extra_charges,
					exc.group_min,
					exc.group_max,
					"active",
				],
			);
		}
		console.log("✓ Экскурсии созданы");

		// Создаём тестовые заявки
		const excs = await dbAll("SELECT id FROM excursions");
		const tourists = await dbAll("SELECT id FROM users WHERE role = ?", [
			"tourist",
		]);

		if (excs.length > 0 && tourists.length > 0) {
			await dbRun(
				`
        INSERT INTO requests (user_id, excursion_id, requested_date, requested_time, people_count, contact_phone, contact_email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
				[
					tourists[0].id,
					excs[0].id,
					"2026-06-20",
					"10:00",
					15,
					"+7 (999) 888-77-66",
					"ivanova@mail.ru",
					"confirmed",
				],
			);

			await dbRun(
				`
        INSERT INTO requests (user_id, excursion_id, requested_date, requested_time, people_count, contact_phone, contact_email, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
				[
					tourists[1].id,
					excs[1].id,
					"2026-06-25",
					"14:00",
					8,
					"+7 (888) 777-66-55",
					"petrov@gmail.com",
					"group_not_met",
				],
			);
			console.log("✓ Тестовые заявки созданы");
		}

		console.log("\n🎉 Демо-данные загружены!");
		console.log("\nТестовые аккаунты:");
		console.log("  Админ:    admin@industrial-tourism.ru / admin123");
		console.log("  Оператор: operator@promtour.ru / operator123");
		console.log("  Турист:   ivanova@mail.ru / tourist123");
	} catch (error) {
		console.error("Ошибка seed:", error);
		process.exit(1);
	}
};

seedData();
