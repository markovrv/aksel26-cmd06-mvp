import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function RequestPage() {
	const { excursionId } = useParams();
	const navigate = useNavigate();
	const [excursion, setExcursion] = useState(null);
	const [formData, setFormData] = useState({
		requested_date: "",
		requested_time: "",
		people_count: 15,
		contact_phone: "",
		contact_email: "",
		notes: "",
	});
	const [loading, setLoading] = useState(true);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");
	const [alternativesModal, setAlternativesModal] = useState(null);

	useEffect(() => {
		loadData();
	}, [excursionId]);

	const loadData = async () => {
		try {
			const data = await api.getExcursion(excursionId);
			setExcursion(data.excursion);

			// Устанавливаем минимальную дату (завтра)
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			setFormData((prev) => ({
				...prev,
				requested_date: tomorrow.toISOString().split("T")[0],
			}));
		} catch (error) {
			console.error("Error loading excursion:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSubmitting(true);

		try {
			const data = await api.createRequest({
				excursion_id: parseInt(excursionId),
				...formData,
			});

			// Если группа меньше минимума — показываем модалку с альтернативами
			if (data.request.status === "group_not_met") {
				setAlternativesModal({
					requestId: data.request.id,
					alternatives: data.request.alternatives || [],
				});
				return; // не редиректим, пока не закроют модалку
			}

			navigate("/dashboard");
		} catch (err) {
			setError(err.message || "Ошибка при отправке заявки");
		} finally {
			setSubmitting(false);
		}
	};

	if (loading) {
		return (
			<div className="py-12">
				<div className="max-w-2xl mx-auto px-4">
					<div className="animate-pulse space-y-6">
						<div className="h-8 bg-gray-200 rounded w-1/2"></div>
						<div className="h-64 bg-gray-200 rounded"></div>
					</div>
				</div>
			</div>
		);
	}

	if (!excursion) {
		return (
			<div className="py-12">
				<div className="max-w-2xl mx-auto px-4 text-center">
					<h2 className="text-xl font-medium text-text mb-4">
						Экскурсия не найдена
					</h2>
					<Link to="/excursions" className="btn btn-primary">
						Вернуться к каталогу
					</Link>
				</div>
			</div>
		);
	}

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const minDate = tomorrow.toISOString().split("T")[0];

	return (
		<>
			<div className="py-8 md:py-12">
				<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
					{/* Header */}
					<div className="mb-8">
						<h1 className="text-2xl md:text-3xl font-bold text-text mb-2">
							Заявка на экскурсию
						</h1>
						<div className="card p-4 mt-4">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
									<svg
										className="w-8 h-8 text-primary"
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
								<div>
									<h3 className="font-semibold text-text">{excursion.title}</h3>
									<p className="text-sm text-text-muted">
										{excursion.enterprise_name}
									</p>
									<p className="text-sm text-primary font-medium">
										{excursion.base_price} ₽ / чел.
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Form */}
					<div className="card p-6 md:p-8">
						{error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
								{error}
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="grid sm:grid-cols-2 gap-6">
								<div>
									<label className="block text-sm font-medium text-text mb-2">
										Дата экскурсии *
									</label>
									<input
										type="date"
										value={formData.requested_date}
										onChange={(e) =>
											setFormData({ ...formData, requested_date: e.target.value })
										}
										min={minDate}
										className="input"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-2">
										Время
									</label>
									<input
										type="time"
										value={formData.requested_time}
										onChange={(e) =>
											setFormData({ ...formData, requested_time: e.target.value })
										}
										className="input"
									/>
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Количество участников *
								</label>
								<input
									type="number"
									value={formData.people_count}
									onChange={(e) =>
										setFormData({
											...formData,
											people_count: parseInt(e.target.value) || 0,
										})
									}
									min={1}
									max={excursion.group_max || 50}
									className="input"
									required
								/>
								<p className="text-xs text-text-muted mt-1">
									Минимум: {excursion.group_min} человек
								</p>
							</div>

							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Телефон для связи *
								</label>
								<input
									type="tel"
									value={formData.contact_phone}
									onChange={(e) =>
										setFormData({ ...formData, contact_phone: e.target.value })
									}
									placeholder="+7 (999) 123-45-67"
									className="input"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Email *
								</label>
								<input
									type="email"
									value={formData.contact_email}
									onChange={(e) =>
										setFormData({ ...formData, contact_email: e.target.value })
									}
									placeholder="your@email.com"
									className="input"
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium text-text mb-2">
									Комментарий
								</label>
								<textarea
									value={formData.notes}
									onChange={(e) =>
										setFormData({ ...formData, notes: e.target.value })
									}
									rows={4}
									placeholder="Дополнительные пожелания..."
									className="input resize-none"
								/>
							</div>

							{/* Price Summary */}
							<div className="bg-surface-secondary rounded-lg p-4">
								<div className="flex justify-between items-center">
									<span className="text-text-muted">Итого:</span>
									<span className="text-xl font-bold text-primary">
										{formData.people_count * excursion.base_price} ₽
									</span>
								</div>
								<p className="text-xs text-text-muted mt-1">
									{formData.people_count} чел. × {excursion.base_price} ₽
								</p>
							</div>

							<div className="flex gap-4">
								<button
									type="button"
									onClick={() => navigate(-1)}
									className="btn btn-secondary flex-1"
								>
									Назад
								</button>
								<button
									type="submit"
									disabled={submitting}
									className="btn btn-primary flex-1 disabled:opacity-50"
								>
									{submitting ? "Отправка..." : "Отправить заявку"}
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			{/* Модальное окно с альтернативами при недоборе */}
			{alternativesModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6 border-b border-gray-100">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
									<svg className="w-6 h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
								</div>
								<div>
									<h2 className="text-xl font-semibold text-text">
										Группа меньше минимальной
									</h2>
									<p className="text-sm text-text-muted">
										Заявка сохранена со статусом &laquo;Недобор группы&raquo;
									</p>
								</div>
							</div>
						</div>
						<div className="p-6">
							{alternativesModal.alternatives.length > 0 ? (
								<div className="space-y-4">
									<p className="text-sm text-text-muted">
										Предлагаем рассмотреть альтернативные варианты:
									</p>
									{alternativesModal.alternatives.map((alt, idx) => (
										<Link
											key={idx}
											to={`/excursions/${alt.id || alt.excursion_id}`}
											onClick={() => setAlternativesModal(null)}
											className="block p-4 bg-surface-secondary rounded-lg hover:bg-surface-secondary/70 transition-colors"
										>
											<div className="flex items-start gap-3">
												<div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
													<span className="text-xs font-medium text-primary">{idx + 1}</span>
												</div>
												<div>
													<h4 className="font-medium text-text hover:text-primary transition-colors">{alt.title}</h4>
													<p className="text-sm text-text-muted">{alt.enterprise}</p>
													<p className="text-sm text-primary font-medium mt-1">📅 {alt.date}</p>
													<p className="text-sm text-text-muted mt-1">{alt.reason}</p>
												</div>
											</div>
										</Link>
									))}
								</div>
							) : (
								<p className="text-text-muted text-center py-4">
									Альтернативы временно недоступны. Оператор свяжется с вами.
								</p>
							)}
						</div>
						<div className="p-6 border-t border-gray-100 flex gap-3">
							<button
								onClick={() => {
									setAlternativesModal(null);
									navigate("/dashboard");
								}}
								className="btn btn-primary flex-1"
							>
								Перейти к заявкам
							</button>
							<button
								onClick={() => {
									setAlternativesModal(null);
									navigate("/excursions");
								}}
								className="btn btn-secondary flex-1"
							>
								К каталогу
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}