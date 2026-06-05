import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";

export default function EnterprisesPage() {
	const { user } = useAuth();
	const [enterprises, setEnterprises] = useState([]);
	const [loading, setLoading] = useState(true);

	const isOperatorOrAdmin = user && (user.role === "operator" || user.role === "admin");
	const [showModal, setShowModal] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState(null);
	const [formData, setFormData] = useState({
		name: "",
		description: "",
		address: "",
		contacts: "",
		access_rules: "",
		group_min: 10,
		group_max: 50,
		ticket_price: 0,
		age_limit: "",
		ovz_accessible: false,
		seasonality: "",
		photos: "",
	});

	const isAdmin = user?.role === "admin";

	useEffect(() => {
		loadEnterprises();
	}, []);

	const loadEnterprises = async () => {
		try {
			const data = await api.getEnterprises();
			setEnterprises(data.enterprises || []);
		} catch (error) {
			console.error("Error loading enterprises:", error);
		} finally {
			setLoading(false);
		}
	};

	const resetForm = () => {
		setFormData({
			name: "",
			description: "",
			address: "",
			contacts: "",
			access_rules: "",
			group_min: 10,
			group_max: 50,
			ticket_price: 0,
			age_limit: "",
			ovz_accessible: false,
			seasonality: "",
			photos: "",
		});
		setEditingId(null);
	};

	const openEdit = async (id) => {
		try {
			const data = await api.getEnterprise(id);
			const ent = data.enterprise;
			setFormData({
				name: ent.name || "",
				description: ent.description || "",
				address: ent.address || "",
				contacts: ent.contacts || "",
				access_rules: ent.access_rules || "",
				group_min: ent.group_min || 10,
				group_max: ent.group_max || 50,
				ticket_price: ent.ticket_price || 0,
				age_limit: ent.age_limit || "",
				ovz_accessible: ent.ovz_accessible === 1 || ent.ovz_accessible === true,
				seasonality: ent.seasonality || "",
				photos: ent.photos || "",
			});
			setEditingId(id);
			setShowModal(true);
		} catch (error) {
			console.error("Error loading enterprise:", error);
		}
	};

	const handleDelete = async (id) => {
		try {
			await api.deleteEnterprise(id);
			setDeleteConfirm(null);
			loadEnterprises();
		} catch (error) {
			console.error("Error deleting enterprise:", error);
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			if (editingId) {
				await api.updateEnterprise(editingId, formData);
			} else {
				await api.createEnterprise(formData);
			}
			setShowModal(false);
			resetForm();
			loadEnterprises();
		} catch (error) {
			console.error("Error saving enterprise:", error);
		}
	};

	const EnterpriseImage = ({ ent, className = "h-40" }) => {
		if (ent.photos) {
			return (
				<img
					src={ent.photos}
					alt={ent.name}
					className={`w-full object-cover ${className}`}
					onError={(e) => {
						e.target.style.display = "none";
						e.target.nextSibling.style.display = "flex";
					}}
				/>
			);
		}
		return (
			<div className={`${className} bg-gradient-to-br from-primary/20 to-secondary/10 flex items-center justify-center`}>
				<svg
					className="w-16 h-16 text-primary/30"
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
		);
	};

	return (
		<div className="py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold text-text mb-2">Предприятия</h1>
						<p className="text-text-muted">
							Управление площадками для экскурсий
						</p>
					</div>
					<button
						onClick={() => setShowModal(true)}
						className="btn btn-primary"
					>
						+ Добавить предприятие
					</button>
				</div>

				{/* Grid */}
				{loading ? (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{[1, 2, 3].map((i) => (
							<div key={i} className="card animate-pulse">
								<div className="h-40 bg-gray-200"></div>
								<div className="p-4 space-y-2">
									<div className="h-5 bg-gray-200 rounded w-3/4"></div>
									<div className="h-4 bg-gray-200 rounded w-1/2"></div>
								</div>
							</div>
						))}
					</div>
				) : enterprises.length > 0 ? (
					<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
						{enterprises.map((ent) => (
							<div key={ent.id} className="card-hover flex flex-col justify-between">
								<EnterpriseImage ent={ent} />
								<div className="p-4 flex-1">
									<h3 className="font-semibold text-text mb-1 line-clamp-1">
										{ent.name}
									</h3>
									<p className="text-sm text-text-muted mb-2 line-clamp-1">
										{ent.address}
									</p>
									<div className="flex items-center justify-between text-sm">
										{isOperatorOrAdmin && (
											<span className="text-primary font-medium">
												{ent.ticket_price} ₽
											</span>
										)}
										{!isOperatorOrAdmin && (
											<span className="text-primary font-medium">
												от {ent.group_min} чел.
											</span>
										)}
										<span className="text-text-light">
											группа {ent.group_min}-{ent.group_max}
										</span>
									</div>
									{ent.ovz_accessible === 1 && (
										<div className="mt-2 text-xs text-green-600">
											♿ Доступно для ОВЗ
										</div>
									)}
								</div>
								<div className="px-4 pb-4 flex w-full justify-between gap-2 border-t border-gray-100 pt-3">
									<button
										onClick={(e) => { e.preventDefault(); openEdit(ent.id); }}
										className="text-sm text-primary hover:text-primary-dark font-medium"
									>
										✏️ Редактировать
									</button>
									<button
										onClick={(e) => { e.preventDefault(); setDeleteConfirm(ent.id); }}
										className="text-sm text-red-500 hover:text-red-700 font-medium"
									>
										🗑️ Удалить
									</button>
								</div>
							</div>
						))}
					</div>
				) : (
					<div className="card p-12 text-center">
						<h3 className="text-lg font-medium text-text mb-2">
							Нет предприятий
						</h3>
						<p className="text-text-muted">Добавьте первое предприятие</p>
					</div>
				)}

			{/* Modal создания/редактирования */}
			{showModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
						<div className="p-6 border-b border-gray-100 flex items-center justify-between">
							<h2 className="text-xl font-semibold text-text">
								{editingId ? "Редактировать предприятие" : "Новое предприятие"}
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
									value={formData.name}
									onChange={(e) =>
										setFormData({ ...formData, name: e.target.value })
									}
									className="input"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-text mb-1">
									Ссылка на фото
								</label>
								<input
									type="url"
									value={formData.photos}
									onChange={(e) =>
										setFormData({ ...formData, photos: e.target.value })
									}
									placeholder="https://example.com/image.jpg"
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
									Адрес *
								</label>
								<input
									type="text"
									value={formData.address}
									onChange={(e) =>
										setFormData({ ...formData, address: e.target.value })
									}
									className="input"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-text mb-1">
									Описание
								</label>
								<textarea
									value={formData.description}
									onChange={(e) =>
										setFormData({ ...formData, description: e.target.value })
									}
									rows={3}
									className="input resize-none"
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Мин. группа
									</label>
									<input
										type="number"
										value={formData.group_min}
										onChange={(e) =>
											setFormData({
												...formData,
												group_min: parseInt(e.target.value),
											})
										}
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
										onChange={(e) =>
											setFormData({
												...formData,
												group_max: parseInt(e.target.value),
											})
										}
										className="input"
									/>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Стоимость билета
									</label>
									<input
										type="number"
										value={formData.ticket_price}
										onChange={(e) =>
											setFormData({
												...formData,
												ticket_price: parseInt(e.target.value),
											})
										}
										className="input"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-text mb-1">
										Возрастное ограничение
									</label>
									<input
										type="text"
										value={formData.age_limit}
										onChange={(e) =>
											setFormData({ ...formData, age_limit: e.target.value })
										}
										placeholder="6+"
										className="input"
									/>
								</div>
							</div>
							<div className="flex items-center gap-2">
								<input
									type="checkbox"
									id="ovz"
									checked={formData.ovz_accessible}
									onChange={(e) =>
										setFormData({
											...formData,
											ovz_accessible: e.target.checked,
										})
									}
									className="w-4 h-4"
								/>
								<label htmlFor="ovz" className="text-sm text-text">
									Доступно для людей с ОВЗ
								</label>
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
							<h3 className="text-lg font-semibold text-text mb-2">Удалить предприятие?</h3>
							<p className="text-sm text-text-muted mb-6">
								Это действие нельзя отменить. Все связанные экскурсии останутся в системе.
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