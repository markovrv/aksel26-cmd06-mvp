import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";

export default function ExcursionsPage() {
	const { user } = useAuth();
	const [excursions, setExcursions] = useState([]);
	const [enterprises, setEnterprises] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [filter, setFilter] = useState({});
	const [showModal, setShowModal] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [formData, setFormData] = useState({
		title: "",
		short_description: "",
		enterprise_id: "",
		target_audience: "",
		route_description: "",
		duration_minutes: 120,
		base_price: 1000,
		extra_charges: "",
		group_min: 10,
		group_max: 20,
		seasonality: "",
		photos: "",
	});

	const canManage = user && (user.role === "operator" || user.role === "admin");
	const isAdmin = user?.role === "admin";
	const [routeSteps, setRouteSteps] = useState([""]);

	useEffect(() => {
		loadExcursions();
	}, [filter]);

	useEffect(() => {
		if (canManage) loadEnterprises();
	}, [canManage]);

	const loadExcursions = async () => {
		setLoading(true);
		try {
			const params = { status: "active" };
			if (search) params.search = search;
			if (filter.target_audience) params.target_audience = filter.target_audience;
			const data = await api.getExcursions(params);
			setExcursions(data.excursions || []);
		} catch (error) {
			console.error("Error loading excursions:", error);
		} finally {
			setLoading(false);
		}
	};

	const loadEnterprises = async () => {
		try {
			const data = await api.getEnterprises();
			setEnterprises(data.enterprises || []);
		} catch (error) {
			console.error("Error loading enterprises:", error);
		}
	};

	const handleSearch = (e) => {
		e.preventDefault();
		loadExcursions();
	};

	const resetForm = () => {
		setFormData({
			title: "",
			short_description: "",
			enterprise_id: "",
			target_audience: "",
			route_description: "",
			duration_minutes: 120,
			base_price: 1000,
			extra_charges: "",
			group_min: 10,
			group_max: 20,
			seasonality: "",
			photos: "",
		});
		setRouteSteps([""]);
		setEditingId(null);
	};

	const openCreate = () => {
		resetForm();
		setShowModal(true);
	};

	const openEdit = async (id) => {
		try {
			const data = await api.getExcursion(id);
			const exc = data.excursion;
			setFormData({
				title: exc.title || "",
				short_description: exc.short_description || "",
				enterprise_id: exc.enterprise_id?.toString() || "",
				target_audience: exc.target_audience || "",
				route_description: exc.route_description || "",
				duration_minutes: exc.duration_minutes || 120,
				base_price: exc.base_price || 1000,
				extra_charges: exc.extra_charges || "",
				group_min: exc.group_min || 10,
				group_max: exc.group_max || 20,
				seasonality: exc.seasonality || "",
				photos: exc.photos || "",
			});
			// Разделяем маршрут на шаги
			const steps = exc.route_description
				? exc.route_description.split("→").map((s) => s.trim())
				: [""];
			setRouteSteps(steps.length > 0 ? steps : [""]);
			setEditingId(id);
			setShowModal(true);
		} catch (error) {
			console.error("Error loading excursion:", error);
		}
	};

	const handleDelete = async (id) => {
		try {
			await api.deleteExcursion(id);
			setDeleteConfirm(null);
			loadExcursions();
		} catch (error) {
			console.error("Error deleting excursion:", error);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		// Собираем шаги в строку через →
		const routeDescription = routeSteps
			.filter((s) => s.trim() !== "")
			.join(" → ");
		try {
			const payload = {
				...formData,
				route_description: routeDescription,
				enterprise_id: parseInt(formData.enterprise_id),
				duration_minutes: parseInt(formData.duration_minutes),
				base_price: parseInt(formData.base_price),
				group_min: parseInt(formData.group_min),
				group_max: parseInt(formData.group_max),
			};
			if (editingId) {
				await api.updateExcursion(editingId, payload);
			} else {
				await api.createExcursion(payload);
			}
			setShowModal(false);
			resetForm();
			loadExcursions();
		} catch (error) {
			console.error("Error saving excursion:", error);
		}
	};

	// Функции для управления шагами маршрута
	const [dragIdx, setDragIdx] = useState(null);
	const [dragOverIdx, setDragOverIdx] = useState(null);

	const addRouteStep = () => {
		setRouteSteps([...routeSteps, ""]);
	};

	const removeRouteStep = (idx) => {
		if (routeSteps.length <= 1) return;
		setRouteSteps(routeSteps.filter((_, i) => i !== idx));
	};

	const updateRouteStep = (idx, value) => {
		const newSteps = [...routeSteps];
		newSteps[idx] = value;
		setRouteSteps(newSteps);
	};

	const handleDragStart = (idx) => {
		setDragIdx(idx);
	};

	const handleDragOver = (e, idx) => {
		e.preventDefault();
		setDragOverIdx(idx);
	};

	const handleDragLeave = () => {
		setDragOverIdx(null);
	};

	const handleDrop = (idx) => {
		if (dragIdx === null || dragIdx === idx) {
			setDragIdx(null);
			setDragOverIdx(null);
			return;
		}
		const newSteps = [...routeSteps];
		const [moved] = newSteps.splice(dragIdx, 1);
		newSteps.splice(idx, 0, moved);
		setRouteSteps(newSteps);
		setDragIdx(null);
		setDragOverIdx(null);
	};

	const handleDragEnd = () => {
		setDragIdx(null);
		setDragOverIdx(null);
	};

	const canEditDelete = (exc) => {
		if (isAdmin) return true;
		if (user?.role === "operator" && exc.operator_id === user.id) return true;
		return false;
	};

	const targetAudiences = [
		"Семейные группы",
		"Корпоративы",
		"Школьники",
		"Студенты",
	];

	return (
		<div className="py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="flex flex-wrap items-start justify-between gap-4 mb-8">
					<div>
						<h1 className="text-3xl md:text-4xl font-bold text-text mb-2">
							Каталог экскурсий
						</h1>
						<p className="text-text-muted">
							{canManage
								? "Управляйте экскурсиями или выберите для просмотра"
								: "Выберите интересующую экскурсию и оставьте заявку"}
						</p>
					</div>
					{canManage && (
						<button onClick={openCreate} className="btn btn-primary">
							+ Добавить экскурсию
						</button>
					)}
				</div>

				{/* Filters */}
				<div className="card p-4 mb-8">
					<form onSubmit={handleSearch} className="flex flex-wrap gap-4">
						<div className="flex-1 min-w-[200px]">
							<input
								type="text"
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Поиск по названию..."
								className="input"
							/>
						</div>
						<select
							value={filter.target_audience || ""}
							onChange={(e) =>
								setFilter({ ...filter, target_audience: e.target.value })
							}
							className="input w-auto"
						>
							<option value="">Все категории</option>
							{targetAudiences.map((aud) => (
								<option key={aud} value={aud}>
									{aud}
								</option>
							))}
						</select>
						<button type="submit" className="btn btn-primary">
							Найти
						</button>
					</form>
				</div>

				{/* Excursions Grid */}
				{loading ? (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div key={i} className="card animate-pulse">
								<div className="h-48 bg-gray-200"></div>
								<div className="p-5 space-y-3">
									<div className="h-5 bg-gray-200 rounded w-3/4"></div>
									<div className="h-4 bg-gray-200 rounded w-1/2"></div>
									<div className="h-4 bg-gray-200 rounded w-full"></div>
								</div>
							</div>
						))}
					</div>
				) : excursions.length > 0 ? (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{excursions.map((excursion) => (
							<div key={excursion.id} className="card-hover group flex flex-col justify-between">
								<Link
									to={`/excursions/${excursion.id}`}
									className="block"
								>
									<div className="h-48 relative overflow-hidden">
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
										<div className={`${excursion.photos ? 'hidden' : 'flex'} h-full bg-gradient-to-br from-primary/20 to-accent/10 items-center justify-center`}>
											<svg
												className="w-20 h-20 text-primary/30"
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
										<div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium text-primary">
											{excursion.duration_minutes} мин
										</div>
									</div>
									<div className="p-5 flex-1">
										<h3 className="text-lg font-semibold text-text mb-1 group-hover:text-primary transition-colors line-clamp-1">
											{excursion.title}
										</h3>
										<p className="text-sm text-text-muted mb-3 line-clamp-1">
											{excursion.enterprise_name}
										</p>
										<p className="text-sm text-text-muted mb-4 line-clamp-2">
											{excursion.short_description}
										</p>
										<div className="flex items-center justify-between pt-4 border-t border-gray-100">
											<div>
												<span className="text-2xl font-bold text-primary">
													{excursion.base_price} ₽
												</span>
												<span className="text-sm text-text-muted"> / чел.</span>
											</div>
											<div className="text-right">
												<div className="text-xs text-text-light">
													группа {excursion.group_min}-{excursion.group_max} чел.
												</div>
											</div>
										</div>
									</div>
								</Link>
								{/* Кнопки управления для оператора/админа */}
								{canEditDelete(excursion) && (
									<div className="px-5 pb-4 flex w-full justify-between gap-2 border-t border-gray-100 pt-3 mt-0">
										<button
											onClick={(e) => { e.preventDefault(); openEdit(excursion.id); }}
											className="text-sm text-primary hover:text-primary-dark font-medium"
										>
											✏️ Редактировать
										</button>
										<button
											onClick={(e) => { e.preventDefault(); setDeleteConfirm(excursion.id); }}
											className="text-sm text-red-500 hover:text-red-700 font-medium"
										>
											🗑️ Удалить
										</button>
									</div>
								)}
							</div>
						))}
					</div>
				) : (
					<div className="text-center py-16 bg-surface-secondary rounded-xl">
						<svg
							className="w-20 h-20 text-text-light mx-auto mb-4"
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
						<h3 className="text-xl font-medium text-text mb-2">
							Экскурсии не найдены
						</h3>
						<p className="text-text-muted">
							Попробуйте изменить параметры поиска
						</p>
					</div>
				)}

				{/* Modal создания/редактирования */}
				{showModal && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
							<div className="p-6 border-b border-gray-100 flex items-center justify-between">
								<h2 className="text-xl font-semibold text-text">
									{editingId ? "Редактировать экскурсию" : "Новая экскурсия"}
								</h2>
								<button
									onClick={() => { setShowModal(false); resetForm(); }}
									className="text-text-muted hover:text-text"
								>
									✕
								</button>
							</div>
							<form onSubmit={handleSubmit} className="p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Название *
									</label>
									<input
										type="text"
										value={formData.title}
										onChange={(e) => setFormData({ ...formData, title: e.target.value })}
										className="input"
										required
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Предприятие *
									</label>
									<select
										value={formData.enterprise_id}
										onChange={(e) => setFormData({ ...formData, enterprise_id: e.target.value })}
										className="input"
										required
									>
										<option value="">Выберите предприятие</option>
										{enterprises.map((ent) => (
											<option key={ent.id} value={ent.id}>
												{ent.name} — {ent.address}
											</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Краткое описание
									</label>
									<textarea
										value={formData.short_description}
										onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
										rows={3}
										className="input resize-none"
									/>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-text mb-1">
											Цена (₽/чел) *
										</label>
										<input
											type="number"
											value={formData.base_price}
											onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
											min={0}
											className="input"
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-text mb-1">
											Длительность (мин) *
										</label>
										<input
											type="number"
											value={formData.duration_minutes}
											onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
											min={1}
											className="input"
											required
										/>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-text mb-1">
											Мин. группа
										</label>
										<input
											type="number"
											value={formData.group_min}
											onChange={(e) => setFormData({ ...formData, group_min: e.target.value })}
											min={1}
											className="input"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-text mb-1">
											Макс. группа
										</label>
										<input
											type="number"
											value={formData.group_max}
											onChange={(e) => setFormData({ ...formData, group_max: e.target.value })}
											min={1}
											className="input"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Целевая аудитория
									</label>
									<select
										value={formData.target_audience}
										onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
										className="input"
									>
										<option value="">Выберите аудиторию</option>
										{targetAudiences.map((aud) => (
											<option key={aud} value={aud}>{aud}</option>
										))}
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-2">
										Маршрут экскурсии
									</label>
									<p className="text-xs text-text-muted mb-3">
										Добавьте пункты маршрута по порядку. Перетащите за ручку ⋮⋮ чтобы переместить.
									</p>
									<div className="space-y-1">
										{routeSteps.map((step, idx) => {
											const isDragging = dragIdx === idx;
											const isDragOver = dragOverIdx === idx;
											return (
												<div
													key={idx}
													draggable
													onDragStart={() => handleDragStart(idx)}
													onDragOver={(e) => handleDragOver(e, idx)}
													onDragLeave={handleDragLeave}
													onDrop={() => handleDrop(idx)}
													onDragEnd={handleDragEnd}
													className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-150 cursor-default ${
														isDragging
															? "opacity-50 bg-primary/5 scale-[0.98]"
															: isDragOver
																? "bg-primary/10 ring-2 ring-primary/30 shadow-sm scale-[1.01]"
																: "hover:bg-gray-50"
													}`}
												>
													<div
														className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing select-none flex-shrink-0 px-1.5 py-1 rounded hover:bg-primary/10 transition-colors"
														title="Перетащите для перемещения"
													>
														<svg className="w-3.5 h-3.5 text-text-light" fill="currentColor" viewBox="0 0 16 16">
															<circle cx="5" cy="3" r="1.5" />
															<circle cx="11" cy="3" r="1.5" />
															<circle cx="5" cy="8" r="1.5" />
															<circle cx="11" cy="8" r="1.5" />
															<circle cx="5" cy="13" r="1.5" />
															<circle cx="11" cy="13" r="1.5" />
														</svg>
														<span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
															<span className="text-xs font-medium text-primary">{idx + 1}</span>
														</span>
													</div>
													<input
														type="text"
														value={step}
														onChange={(e) => updateRouteStep(idx, e.target.value)}
														placeholder={`Название пункта ${idx + 1}`}
														className="input flex-1 text-sm"
													/>
													<button
														type="button"
														onClick={() => removeRouteStep(idx)}
														disabled={routeSteps.length <= 1}
														className="p-1.5 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0"
														title="Удалить пункт"
													>
														<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
															<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
														</svg>
													</button>
												</div>
											);
										})}
									</div>
									<button
										type="button"
										onClick={addRouteStep}
										className="mt-2 text-sm text-primary hover:text-primary-dark font-medium flex items-center gap-1"
									>
										<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
										</svg>
										Добавить пункт маршрута
									</button>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Дополнительные услуги
									</label>
									<textarea
										value={formData.extra_charges}
										onChange={(e) => setFormData({ ...formData, extra_charges: e.target.value })}
										rows={2}
										placeholder="Обед, трансфер, мастер-класс..."
										className="input resize-none"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Ссылка на фото
									</label>
									<input
										type="url"
										value={formData.photos}
										onChange={(e) => setFormData({ ...formData, photos: e.target.value })}
										placeholder="https://example.com/excursion.jpg"
										className="input"
									/>
									{formData.photos && (
										<div className="mt-2 w-32 h-20 rounded overflow-hidden bg-gray-100">
											<img
												src={formData.photos}
												alt="preview"
												className="w-full h-full object-cover"
												onError={(e) => { e.target.style.display = "none"; }}
											/>
										</div>
									)}
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Сезонность
									</label>
									<input
										type="text"
										value={formData.seasonality}
										onChange={(e) => setFormData({ ...formData, seasonality: e.target.value })}
										placeholder="круглый год"
										className="input"
									/>
								</div>
								<div className="flex gap-4 pt-4">
									<button
										type="button"
										onClick={() => { setShowModal(false); resetForm(); }}
										className="btn btn-secondary flex-1"
									>
										Отмена
									</button>
									<button type="submit" className="btn btn-primary flex-1">
										{editingId ? "Сохранить" : "Создать"}
									</button>
								</div>
							</form>
						</div>
					</div>
				)}

				{/* Модалка подтверждения удаления */}
				{deleteConfirm && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
						<div className="bg-white rounded-xl max-w-md w-full">
							<div className="p-6 text-center">
								<div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
									<svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
									</svg>
								</div>
								<h3 className="text-lg font-semibold text-text mb-2">Удалить экскурсию?</h3>
								<p className="text-sm text-text-muted mb-6">
									Это действие нельзя отменить. Связанные заявки останутся в системе.
								</p>
								<div className="flex gap-3">
									<button
										onClick={() => setDeleteConfirm(null)}
										className="btn btn-secondary flex-1"
									>
										Отмена
									</button>
									<button
										onClick={() => handleDelete(deleteConfirm)}
										className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
									>
										Удалить
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}