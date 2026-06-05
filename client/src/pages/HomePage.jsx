import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function HomePage() {
	const [excursions, setExcursions] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadExcursions();
	}, []);

	const loadExcursions = async () => {
		try {
			const data = await api.getExcursions({ status: "active" });
			setExcursions(data.excursions?.slice(0, 4) || []);
		} catch (error) {
			console.error("Error loading excursions:", error);
		} finally {
			setLoading(false);
		}
	};

	const [activeRoleTab, setActiveRoleTab] = useState("tourist");

	const roles = [
		{ key: "tourist", label: "Туристам", color: "accent", icon: "🧳" },
		{ key: "operator", label: "Туроператорам", color: "primary", icon: "🎯" },
		{ key: "admin", label: "Администраторам", color: "green", icon: "⚙️" },
	];

	const roleFeatures = {
		tourist: {
			title: "Для туристов и организаторов групп",
			subtitle: "Удобный поиск, онлайн-заявки и полная информация о каждом предприятии",
			items: [
				{
					icon: "🏭",
					title: "Каталог промышленных предприятий",
					desc: "Изучайте действующие заводы, фабрики и производства с подробным описанием: вид деятельности, доступность для групп, требования к посетителям, контакты.",
				},
				{
					icon: "📋",
					title: "Мгновенная подача заявки",
					desc: "Заполните короткую форму — дата, время, количество человек — и ваша заявка сразу попадает туроператору. Отслеживайте статус в личном кабинете.",
				},
				{
					icon: "🔄",
					title: "Альтернативные варианты",
					desc: "Если группа меньше минимальной — система автоматически предложит похожие экскурсии на те же даты. Вы не останетесь без тура.",
				},
				{
					icon: "📱",
					title: "Вся история в одном месте",
					desc: "Личный кабинет хранит все ваши заявки — активные, подтверждённые, завершённые. Просматривайте детали и статусы когда угодно.",
				},
			],
		},
		operator: {
			title: "Для туроператоров и турагентов",
			subtitle: "Полный цикл управления турами: от заявки до закрывающих документов",
			items: [
				{
					icon: "🏢",
					title: "CRUD управление предприятиями",
					desc: "Создавайте новые предприятия в каталоге: название, адрес, контакты, правила доступа, ограничения по группам. Редактировать и удалять можно только свои предприятия.",
				},
				{
					icon: "📦",
					title: "CRUD управление экскурсиями",
					desc: "Создавайте экскурсионные маршруты на базе любых предприятий каталога: цена, длительность, описание, мин/макс группы. Редактировать и удалять можно только свои экскурсии.",
				},
				{
					icon: "✅",
					title: "Панель управления заявками",
					desc: "Все заявки в едином списке с фильтрацией по статусу. Подтверждайте, отменяйте, переводите в «Недобор» — один клик меняет статус. Видите историю по каждой заявке.",
				},
				{
					icon: "📄",
					title: "Генерация документов в PDF",
					desc: "Создавайте Договор, Счёт и Акт выполненных работ прямо из карточки заявки. HTML-шаблоны с форматированием для печати — экспорт в PDF одним нажатием.",
				},
				{
					icon: "💰",
					title: "Калькулятор рентабельности",
					desc: "Рассчитывайте экономику тура: стоимость гида, транспорт, сбор предприятия, накладные расходы. Система считает выручку, прибыль и рентабельность в процентах.",
				},
				{
					icon: "📊",
					title: "Дашборд с аналитикой",
					desc: "Сводка на главном экране: всего заявок, подтверждённых, недобор, общий доход. Отдельная страница аналитики с популярными направлениями, сезонностью и графиком выручки.",
				},
			],
		},
		admin: {
			title: "Для администраторов платформы",
			subtitle: "Полный контроль над пользователями, предприятиями и экскурсиями",
			items: [
				{
					icon: "👥",
					title: "Управление пользователями",
					desc: "Просмотр всех зарегистрированных пользователей. Назначение ролей: турист, оператор, администратор. Контроль доступа к разделам платформы.",
				},
				{
					icon: "🏗️",
					title: "Полный доступ к предприятиям",
					desc: "Создание и редактирование любых предприятий в системе. Просмотр статистики по предприятиям: сколько экскурсий, сколько заявок, популярность.",
				},
				{
					icon: "🗺️",
					title: "Модерация экскурсий",
					desc: "Доступ ко всем экскурсиям всех операторов. Возможность скрыть или деактивировать экскурсию. Контроль качества контента.",
				},
				{
					icon: "📈",
					title: "Расширенная аналитика",
					desc: "Сводная статистика по всей платформе: общее количество заявок, подтверждённых туров, доход в разрезе операторов, сезонность спроса, популярность направлений.",
				},
			],
		},
	};

	return (
		<div>
			{/* Hero Section */}
			<section className="relative bg-primary text-white overflow-hidden">
				{/* Фоновое изображение */}
				<div className="absolute inset-0">
					<picture>
						<source srcSet="/hero.webp" type="image/webp" />
						<img
							src="/hero.web.jpg"
							alt="Промышленный туризм"
							className="w-full h-full object-cover"
							loading="eager"
						/>
					</picture>
				</div>
				<div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
					<div className="max-w-3xl">
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
							Логика профессиональных туров
							<span className="block text-accent">
								инструмент для туроператоров
							</span>
						</h1>
						<p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl">
							Специализированная платформа для организации экскурсий на
							промышленные предприятия. Автоматизация заявок, расчёт
							рентабельности, аналитика.
						</p>
						<div className="flex flex-wrap gap-4">
							<Link
								to="/excursions"
								className="btn btn-accent text-lg px-8 py-3"
							>
								Каталог экскурсий
							</Link>
							<Link
								to="/register"
								className="btn bg-white/10 backdrop-blur text-white hover:bg-white/20 text-lg px-8 py-3"
							>
								Регистрация
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Возможности платформы — по ролям */}
			<section className="py-16 md:py-24 bg-gradient-to-b from-white to-surface-secondary">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Заголовок секции */}
					<div className="text-center mb-12">
						<div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/5 rounded-full mb-6">
							<span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
							<span className="text-sm font-medium text-primary">Возможности платформы</span>
						</div>
						<h2 className="text-3xl md:text-5xl font-bold text-text mb-4">
							Инструменты для каждого участника
						</h2>
						<p className="text-text-muted max-w-2xl mx-auto text-lg">
							Платформа объединяет туристов, туроператоров и администраторов. У каждой роли — свой набор возможностей и интерфейс.
						</p>
					</div>

					{/* Табы ролей */}
					<div className="flex flex-wrap justify-center gap-3 mb-12">
						{roles.map((role) => {
							const isActive = activeRoleTab === role.key;
							const colorMap = {
								accent: isActive ? "bg-accent text-white" : "bg-white text-text-muted hover:bg-accent/10",
								primary: isActive ? "bg-primary text-white" : "bg-white text-text-muted hover:bg-primary/10",
								green: isActive ? "bg-green-600 text-white" : "bg-white text-text-muted hover:bg-green-50",
							};
							return (
								<button
									key={role.key}
									onClick={() => setActiveRoleTab(role.key)}
									className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-base transition-all duration-200 shadow-sm hover:shadow-md ${colorMap[role.color]}`}
								>
									<span className="text-xl">{role.icon}</span>
									{role.label}
								</button>
							);
						})}
					</div>

					{/* Контент активной роли с фоновой подложкой */}
					<div
						key={activeRoleTab}
						className={`rounded-2xl p-8 md:p-10 ${
							activeRoleTab === "tourist"
								? "role-bg-tourist"
								: activeRoleTab === "operator"
									? "role-bg-operator"
									: "role-bg-admin"
						}`}
					>
						<div className="text-center mb-10">
							<h3 className="text-2xl md:text-3xl font-bold text-text mb-3">
								{roleFeatures[activeRoleTab].title}
							</h3>
							<p className="text-text-muted text-lg">
								{roleFeatures[activeRoleTab].subtitle}
							</p>
						</div>

						<div className="grid md:grid-cols-2 gap-6">
							{roleFeatures[activeRoleTab].items.map((item, idx) => (
								<div
									key={idx}
									className="role-content-card group"
								>
									<div className="flex gap-4">
										<div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform text-2xl">
											{item.icon}
										</div>
										<div>
											<h4 className="font-semibold text-text mb-2 group-hover:text-primary transition-colors">
												{item.title}
											</h4>
											<p className="text-sm text-text-muted leading-relaxed">
												{item.desc}
											</p>
										</div>
									</div>
								</div>
							))}
						</div>

						{/* CTA внутри секции */}
						<div className="mt-10 text-center">
							<Link
								to={activeRoleTab === "tourist" ? "/excursions" : "/register"}
								className="btn btn-primary text-lg px-8 py-3"
							>
								{activeRoleTab === "tourist"
									? "Перейти к каталогу"
									: activeRoleTab === "operator"
										? "Зарегистрироваться как туроператор"
										: "Панель управления"}
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Popular Excursions */}
			<section className="py-16 md:py-24">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between mb-8">
						<div>
							<h2 className="text-3xl md:text-4xl font-bold text-text mb-2">
								Каталог экскурсий
							</h2>
							<p className="text-text-muted">
								Актуальные маршруты на промышленные предприятия
							</p>
						</div>
						<Link to="/excursions" className="btn btn-outline hidden sm:flex">
							Все экскурсии
						</Link>
					</div>

					{loading ? (
						<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="card animate-pulse">
									<div className="h-48 bg-gray-200"></div>
									<div className="p-4 space-y-3">
										<div className="h-4 bg-gray-200 rounded w-3/4"></div>
										<div className="h-3 bg-gray-200 rounded w-1/2"></div>
									</div>
								</div>
							))}
						</div>
					) : excursions.length > 0 ? (
						<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
							{excursions.map((excursion) => (
								<Link
									key={excursion.id}
									to={`/excursions/${excursion.id}`}
									className="card-hover group"
								>
									<div className="h-48 overflow-hidden">
										{excursion.photos ? (
											<img
												src={excursion.photos}
												alt={excursion.title}
												className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
												onError={(e) => {
													e.target.style.display = "none";
													e.target.nextSibling.style.display = "flex";
												}}
											/>
										) : null}
										<div className={`${excursion.photos ? 'hidden' : 'flex'} h-full bg-gradient-to-br from-primary/20 to-primary/5 items-center justify-center`}>
											<svg
												className="w-16 h-16 text-primary/30 group-hover:scale-110 transition-transform"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={1.5}
													d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
												/>
											</svg>
										</div>
									</div>
									<div className="p-4">
										<h3 className="font-semibold text-text mb-1 line-clamp-1 group-hover:text-primary transition-colors">
											{excursion.title}
										</h3>
										<p className="text-sm text-text-muted mb-3 line-clamp-1">
											{excursion.enterprise_name}
										</p>
										<div className="flex items-center justify-between">
											<span className="text-lg font-bold text-primary">
												от {excursion.base_price} ₽
											</span>
											<span className="text-xs text-text-light">
												{excursion.duration_minutes} мин
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
					) : (
						<div className="text-center py-12 bg-surface-secondary rounded-xl">
							<svg
								className="w-16 h-16 text-text-light mx-auto mb-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={1.5}
									d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
								/>
							</svg>
							<p className="text-text-muted">Экскурсии скоро появятся</p>
						</div>
					)}

					<div className="text-center mt-8 sm:hidden">
						<Link to="/excursions" className="btn btn-outline">
							Все экскурсии
						</Link>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 md:py-24 bg-primary">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Готовы организовать экскурсию?
					</h2>
					<p className="text-white/80 mb-8 max-w-2xl mx-auto">
						Зарегистрируйтесь как туроператор и начните добавлять свои экскурсии
						уже сегодня
					</p>
					<Link
						to="/register"
						className="btn bg-white text-primary hover:bg-gray-100 text-lg px-8 py-3"
					>
						Начать бесплатно
					</Link>
				</div>
			</section>
		</div>
	);
}
