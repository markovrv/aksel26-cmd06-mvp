import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";

export default function ExcursionDetailPage() {
	const { id } = useParams();
	const { user } = useAuth();
	const navigate = useNavigate();
	const [excursion, setExcursion] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadExcursion();
	}, [id]);

	const loadExcursion = async () => {
		try {
			const data = await api.getExcursion(id);
			setExcursion(data.excursion);
		} catch (error) {
			console.error("Error loading excursion:", error);
			navigate("/excursions");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="animate-pulse space-y-6">
						<div className="h-64 bg-gray-200 rounded-xl"></div>
						<div className="h-8 bg-gray-200 rounded w-1/3"></div>
						<div className="h-4 bg-gray-200 rounded w-2/3"></div>
					</div>
				</div>
			</div>
		);
	}

	if (!excursion) {
		return null;
	}

	return (
		<div className="py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Breadcrumb */}
				<nav className="mb-6">
					<ol className="flex items-center gap-2 text-sm">
						<li>
							<Link to="/" className="text-text-muted hover:text-primary">
								Главная
							</Link>
						</li>
						<li className="text-text-light">/</li>
						<li>
							<Link
								to="/excursions"
								className="text-text-muted hover:text-primary"
							>
								Экскурсии
							</Link>
						</li>
						<li className="text-text-light">/</li>
						<li className="text-text">{excursion.title}</li>
					</ol>
				</nav>

				<div className="grid lg:grid-cols-3 gap-8">
					{/* Main Content */}
					<div className="lg:col-span-2 space-y-6">
						{/* Hero */}
						<div className="card overflow-hidden">
							{excursion.photos ? (
								<img
									src={excursion.photos}
									alt={excursion.title}
									className="w-full h-64 md:h-80 object-cover"
									onError={(e) => {
										e.target.style.display = "none";
										e.target.nextSibling.style.display = "flex";
									}}
								/>
							) : null}
							<div className={`${excursion.photos ? 'hidden' : 'flex'} h-64 md:h-80 bg-gradient-to-br from-primary/20 to-accent/10 items-center justify-center`}>
								<svg
									className="w-32 h-32 text-primary/30"
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

						{/* Info */}
						<div className="card p-6">
							<h1 className="text-2xl md:text-3xl font-bold text-text mb-2">
								{excursion.title}
							</h1>
							<p className="text-lg text-primary font-medium mb-4">
								{excursion.enterprise_name}
							</p>
							<p className="text-text-muted mb-6">
								{excursion.short_description}
							</p>

							<div className="grid sm:grid-cols-2 gap-4 mb-6">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
										<svg
											className="w-5 h-5 text-primary"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
									</div>
									<div>
										<div className="text-sm text-text-muted">
											Продолжительность
										</div>
										<div className="font-medium">
											{excursion.duration_minutes} минут
										</div>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
										<svg
											className="w-5 h-5 text-primary"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
									</div>
									<div>
										<div className="text-sm text-text-muted">Размер группы</div>
										<div className="font-medium">
											{excursion.group_min} - {excursion.group_max} человек
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* Route */}
						{excursion.route_description && (
							<div className="card p-6">
								<h2 className="text-lg font-semibold text-text mb-4">
									Маршрут экскурсии
								</h2>
								<div className="space-y-3">
									{excursion.route_description.split("→").map((step, idx) => (
										<div key={idx} className="flex items-start gap-3">
											<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
												<span className="text-sm font-medium text-primary">
													{idx + 1}
												</span>
											</div>
											<p className="text-text-muted pt-1">{step.trim()}</p>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Target Audience */}
						{excursion.target_audience && (
							<div className="card p-6">
								<h2 className="text-lg font-semibold text-text mb-4">
									Целевая аудитория
								</h2>
								<p className="text-text-muted">{excursion.target_audience}</p>
							</div>
						)}

						{/* Extra Charges */}
						{excursion.extra_charges && (
							<div className="card p-6 border-accent/30 bg-accent/5">
								<h2 className="text-lg font-semibold text-text mb-2">
									Дополнительные услуги
								</h2>
								<p className="text-text-muted">{excursion.extra_charges}</p>
							</div>
						)}
					</div>

					{/* Sidebar */}
					<div className="lg:col-span-1">
						<div className="card p-6 sticky top-24">
							<div className="text-center mb-6">
								<div className="text-3xl font-bold text-primary mb-1">
									{excursion.base_price} ₽
								</div>
								<div className="text-sm text-text-muted">
									за одного участника
								</div>
							</div>

							<div className="space-y-4 mb-6 text-sm">
								<div className="flex justify-between">
									<span className="text-text-muted">Продолжительность</span>
									<span className="font-medium">
										{excursion.duration_minutes} мин
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted">Мин. группа</span>
									<span className="font-medium">
										{excursion.group_min} чел.
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-text-muted">Макс. группа</span>
									<span className="font-medium">
										{excursion.group_max} чел.
									</span>
								</div>
								{excursion.seasonality && (
									<div className="flex justify-between">
										<span className="text-text-muted">Сезонность</span>
										<span className="font-medium">{excursion.seasonality}</span>
									</div>
								)}
							</div>

							{user ? (
								<Link
									to={`/request/${excursion.id}`}
									className="btn btn-primary w-full py-3 text-center block"
								>
									Оставить заявку
								</Link>
							) : (
								<Link
									to="/login"
									className="btn btn-primary w-full py-3 text-center block"
								>
									Войти, чтобы подать заявку
								</Link>
							)}

							<p className="text-xs text-text-light text-center mt-4">
								Нажимая кнопку, вы перейдёте к форме заявки
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
