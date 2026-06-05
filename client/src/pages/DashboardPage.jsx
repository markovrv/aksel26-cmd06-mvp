import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import api from "../api";

export default function DashboardPage() {
	const { user } = useAuth();
	const [requests, setRequests] = useState([]);
	const [excursions, setExcursions] = useState([]);
	const [stats, setStats] = useState(null);
	const [loading, setLoading] = useState(true);
	const [activeTab, setActiveTab] = useState("requests");
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [documents, setDocuments] = useState([]);
	const [docLoading, setDocLoading] = useState(false);
	const [docMessage, setDocMessage] = useState("");
	const [calcModal, setCalcModal] = useState(false);
	const [calcForm, setCalcForm] = useState({
		excursion_id: "",
		people_count: 10,
		guide_cost: 2500,
		transport_cost: 0,
		enterprise_fee: 0,
	});
	const [calcResult, setCalcResult] = useState(null);
	const [calcLoading, setCalcLoading] = useState(false);
	const [calcAutoFee, setCalcAutoFee] = useState(true);
	const [calcManualFee, setCalcManualFee] = useState(false);
	const [enterpriseTicketPrice, setEnterpriseTicketPrice] = useState(0);
	const [calcOverheadPercent, setCalcOverheadPercent] = useState(15);
	const [calcOverheadAuto, setCalcOverheadAuto] = useState(true);
	const [calcEditExcursion, setCalcEditExcursion] = useState(null);
	const [calcEditForm, setCalcEditForm] = useState(null);
	const [calcEditSaving, setCalcEditSaving] = useState(false);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			const [requestsData, excursionsData] = await Promise.all([
				api.getRequests(),
				user.role !== "tourist"
					? api.getExcursions()
					: Promise.resolve({ excursions: [] }),
			]);

			setRequests(requestsData.requests || []);
			setExcursions(excursionsData.excursions || []);

			if (user.role !== "tourist") {
				try {
					const statsData = await api.getSummary();
					setStats(statsData.summary);
				} catch (e) {
					console.error("Error loading stats:", e);
				}
			}
		} catch (error) {
			console.error("Error loading data:", error);
		} finally {
			setLoading(false);
		}
	};

	const generateDoc = async (requestId, type) => {
		setDocLoading(true);
		setDocMessage("");
		try {
			const data = await api.generateDocument(requestId, type);
			const typeLabels = { contract: "Договор", invoice: "Счёт", act: "Акт" };

			// Получаем HTML документа и открываем в скрытом iframe для печати
			const docId = data.document.id;
			const docHtmlData = await api.getDocumentHtml(docId);
			const htmlContent = docHtmlData.document.generated_text;

			// Создаём скрытый iframe, загружаем HTML и вызываем печать
			const iframe = document.createElement("iframe");
			iframe.style.position = "fixed";
			iframe.style.top = "-9999px";
			iframe.style.left = "-9999px";
			iframe.style.width = "1px";
			iframe.style.height = "1px";
			iframe.style.opacity = "0";
			iframe.style.pointerEvents = "none";
			iframe.srcdoc = htmlContent;
			document.body.appendChild(iframe);

			iframe.onload = () => {
				setTimeout(() => {
					try {
						iframe.contentWindow.focus();
						iframe.contentWindow.print();
					} catch (e) {
						console.error("Print error:", e);
					}
					// Удаляем iframe после использования
					setTimeout(() => {
						document.body.removeChild(iframe);
					}, 1000);
				}, 300);
			};

			setDocMessage(`✅ ${typeLabels[type] || type} сгенерирован. Откроется диалог печати → выберите "Сохранить как PDF"`);
			loadData();
		} catch (err) {
			setDocMessage(`❌ Ошибка: ${err.message}`);
		} finally {
			setDocLoading(false);
		}
	};

	const viewDocs = async (requestId) => {
		try {
			const data = await api.getDocuments(requestId);
			setDocuments(data.documents || []);
			setSelectedRequest(requestId);
		} catch (err) {
			setDocMessage(`❌ Ошибка загрузки документов: ${err.message}`);
		}
	};

	const handleExcursionChange = async (excursionId) => {
		if (!excursionId) {
			setCalcForm(prev => ({ ...prev, excursion_id: "" }));
			setEnterpriseTicketPrice(0);
			return;
		}
		try {
			const data = await api.getExcursion(excursionId);
			const price = data.excursion.enterprise_ticket_price || 0;
			setEnterpriseTicketPrice(price);
			// Определяем, активен ли авторасчёт прямо сейчас
			const autoActive = !calcManualFee;
			setCalcForm(prev => {
				const count = parseInt(prev.people_count) || 10;
				return {
					...prev,
					excursion_id: excursionId,
					enterprise_fee: autoActive ? price * count : prev.enterprise_fee,
				};
			});
			if (autoActive) {
				setCalcAutoFee(true);
			}
		} catch (e) {
			console.error("Error loading excursion:", e);
		}
	};

	const handlePeopleCountChange = (val) => {
		setCalcForm(prev => ({ ...prev, people_count: val }));
		if (calcAutoFee && enterpriseTicketPrice > 0) {
			const count = parseInt(val) || 0;
			setCalcForm(prev => ({ ...prev, enterprise_fee: enterpriseTicketPrice * count }));
		}
	};

	const handleFeeManualChange = (val) => {
		setCalcAutoFee(false);
		setCalcManualFee(true);
		setCalcForm(prev => ({ ...prev, enterprise_fee: val }));
	};

	const enableAutoFee = () => {
		setCalcAutoFee(true);
		setCalcManualFee(false);
		const count = parseInt(calcForm.people_count) || 10;
		setCalcForm(prev => ({ ...prev, enterprise_fee: enterpriseTicketPrice * count }));
	};

	const openCalcEdit = async () => {
		const id = calcForm.excursion_id;
		if (!id) return;
		try {
			const data = await api.getExcursion(id);
			const exc = data.excursion;
			setCalcEditForm({
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
			setCalcEditExcursion(id);
		} catch (e) {
			console.error("Error loading excursion:", e);
		}
	};

	const handleCalcEditSave = async (e) => {
		e.preventDefault();
		if (!calcEditExcursion || !calcEditForm) return;
		setCalcEditSaving(true);
		try {
			await api.updateExcursion(calcEditExcursion, {
				...calcEditForm,
				enterprise_id: parseInt(calcEditForm.enterprise_id),
				duration_minutes: parseInt(calcEditForm.duration_minutes),
				base_price: parseInt(calcEditForm.base_price),
				group_min: parseInt(calcEditForm.group_min),
				group_max: parseInt(calcEditForm.group_max),
			});
			setCalcEditExcursion(null);
			setCalcEditForm(null);
			loadData();
			// Перезагружаем данные экскурсии для калькулятора
			handleExcursionChange(calcForm.excursion_id);
		} catch (e) {
			console.error("Error saving excursion:", e);
		} finally {
			setCalcEditSaving(false);
		}
	};

	const handleCalc = async (e) => {
		e.preventDefault();
		setCalcLoading(true);
		setCalcResult(null);
		try {
			const data = await api.runCalculation({
				...calcForm,
				excursion_id: parseInt(calcForm.excursion_id),
				people_count: parseInt(calcForm.people_count),
				guide_cost: parseInt(calcForm.guide_cost) || 0,
				transport_cost: parseInt(calcForm.transport_cost) || 0,
				enterprise_fee: parseInt(calcForm.enterprise_fee) || 0,
				overhead_percent: calcOverheadAuto ? undefined : parseInt(calcOverheadPercent),
			});
			setCalcResult(data.calculation);
		} catch (err) {
			setDocMessage(`❌ Ошибка расчёта: ${err.message}`);
		} finally {
			setCalcLoading(false);
		}
	};

	const getStatusBadge = (status) => {
		const badges = {
			pending: { label: "Ожидает", class: "bg-yellow-100 text-yellow-800" },
			confirmed: {
				label: "Подтверждена",
				class: "bg-green-100 text-green-800",
			},
			cancelled: { label: "Отменена", class: "bg-red-100 text-red-800" },
			group_not_met: {
				label: "Недобор",
				class: "bg-orange-100 text-orange-800",
			},
			completed: { label: "Завершена", class: "bg-blue-100 text-blue-800" },
		};
		const badge = badges[status] || badges.pending;
		return (
			<span
				className={`px-2 py-1 text-xs font-medium rounded-full ${badge.class}`}
			>
				{badge.label}
			</span>
		);
	};

	const isOperator = user?.role === "operator" || user?.role === "admin";

	return (
		<div className="py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-text mb-2">
						{isOperator ? "Панель управления" : "Мои заявки"}
					</h1>
					<p className="text-text-muted">
						{isOperator
							? "Управляйте экскурсиями и отслеживайте заявки"
							: "Просматривайте статус ваших заявок"}
					</p>
				</div>

				{/* Сообщение о документе */}
				{docMessage && (
					<div className="mb-6 p-4 bg-surface-secondary rounded-lg text-sm text-text border border-gray-200">
						{docMessage}
						<button
							onClick={() => setDocMessage("")}
							className="ml-4 text-text-muted hover:text-text"
						>
							✕
						</button>
					</div>
				)}

				{/* Stats for Operators */}
				{isOperator && stats && (
					<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
						<div className="card p-5">
							<div className="text-2xl font-bold text-primary mb-1">
								{stats.total_requests || 0}
							</div>
							<div className="text-sm text-text-muted">Всего заявок</div>
						</div>
						<div className="card p-5">
							<div className="text-2xl font-bold text-green-600 mb-1">
								{stats.confirmed || 0}
							</div>
							<div className="text-sm text-text-muted">Подтверждённых</div>
						</div>
						<div className="card p-5">
							<div className="text-2xl font-bold text-orange-600 mb-1">
								{stats.group_not_met || 0}
							</div>
							<div className="text-sm text-text-muted">Недобор группы</div>
						</div>
						<div className="card p-5">
							<div className="text-2xl font-bold text-accent mb-1">
								{stats.total_revenue
									? `${(stats.total_revenue / 1000).toFixed(1)}к`
									: 0}{" "}
								₽
							</div>
							<div className="text-sm text-text-muted">Доход</div>
						</div>
					</div>
				)}

				{/* Tabs for Operators */}
				{isOperator && (
					<div className="flex gap-2 mb-6 border-b border-gray-200">
						<button
							onClick={() => setActiveTab("requests")}
							className={`pb-3 px-1 text-sm font-medium transition-colors ${
								activeTab === "requests"
									? "text-primary border-b-2 border-primary"
									: "text-text-muted hover:text-text"
							}`}
						>
							Заявки ({requests.length})
						</button>
						<button
							onClick={() => setActiveTab("excursions")}
							className={`pb-3 px-1 text-sm font-medium transition-colors ${
								activeTab === "excursions"
									? "text-primary border-b-2 border-primary"
									: "text-text-muted hover:text-text"
							}`}
						>
							Мои экскурсии ({excursions.length})
						</button>
						<button
							onClick={() => setActiveTab("calculations")}
							className={`pb-3 px-1 text-sm font-medium transition-colors ${
								activeTab === "calculations"
									? "text-primary border-b-2 border-primary"
									: "text-text-muted hover:text-text"
							}`}
						>
							Рентабельность
						</button>
					</div>
				)}

				{/* Content */}
				{loading ? (
					<div className="space-y-4">
						{[1, 2, 3].map((i) => (
							<div key={i} className="card p-6 animate-pulse">
								<div className="h-4 bg-gray-200 rounded w-1/4 mb-3"></div>
								<div className="h-3 bg-gray-200 rounded w-1/2"></div>
							</div>
						))}
					</div>
				) : (
					<>
						{/* Requests List */}
						{(!isOperator || activeTab === "requests") && (
							<div className="space-y-4">
								{requests.length > 0 ? (
									requests.map((request) => (
										<div key={request.id} className="card p-5">
											<div className="flex flex-wrap items-start justify-between gap-4">
												<div className="flex-1 min-w-[200px]">
													<div className="flex items-center gap-3 mb-2">
														<Link
															to={`/excursions/${request.excursion_id}`}
															className="font-semibold text-text hover:text-primary transition-colors"
														>
															{request.excursion_title}
														</Link>
														{getStatusBadge(request.status)}
													</div>
													<p className="text-sm text-text-muted mb-1">
														{request.enterprise_name}
													</p>
													<div className="flex flex-wrap gap-4 text-sm text-text-muted">
														<span>
															📅{" "}
															{new Date(
																request.requested_date,
															).toLocaleDateString("ru-RU")}
														</span>
														<span>👥 {request.people_count} чел.</span>
														<span>
															💰 {request.base_price * request.people_count} ₽
														</span>
													</div>
												</div>

												<div className="flex flex-wrap gap-2">
													{/* Кнопки подтверждения/отмены для оператора */}
													{isOperator && request.status === "pending" && (
														<>
															<button
																onClick={async () => {
																	await api.updateRequestStatus(
																		request.id,
																		"confirmed",
																	);
																	loadData();
																}}
																className="btn btn-primary text-sm py-1.5"
															>
																Подтвердить
															</button>
															<button
																onClick={async () => {
																	await api.updateRequestStatus(
																		request.id,
																		"cancelled",
																	);
																	loadData();
																}}
																className="btn btn-secondary text-sm py-1.5"
															>
																Отменить
															</button>
														</>
													)}

													{/* Кнопки генерации документов для оператора */}
													{isOperator && (request.status === "confirmed" || request.status === "group_not_met") && (
														<>
															<button
																onClick={() => generateDoc(request.id, "contract")}
																disabled={docLoading}
																className="btn btn-primary text-xs py-1.5 px-2 disabled:opacity-50"
															>
																📄 Договор
															</button>
															<button
																onClick={() => generateDoc(request.id, "invoice")}
																disabled={docLoading}
																className="btn btn-primary text-xs py-1.5 px-2 disabled:opacity-50"
															>
																🧾 Счёт
															</button>
															<button
																onClick={() => generateDoc(request.id, "act")}
																disabled={docLoading}
																className="btn btn-primary text-xs py-1.5 px-2 disabled:opacity-50"
															>
																📋 Акт
															</button>
															<button
																onClick={() => viewDocs(request.id)}
																className="btn btn-secondary text-xs py-1.5 px-2"
															>
																📁 Документы
															</button>
														</>
													)}
												</div>
											</div>

												{/* Список документов для выбранной заявки */}
											{selectedRequest === request.id && documents.length > 0 && (
												<div className="mt-4 p-4 bg-surface-secondary rounded-lg">
													<h4 className="text-sm font-medium text-text mb-3">Сгенерированные документы:</h4>
													<div className="space-y-2">
														{documents.map((doc) => (
															<div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded border border-gray-200">
																<div>
																	<span className="text-sm font-medium text-text">
																		{doc.type === "contract" ? "📄 Договор" : doc.type === "invoice" ? "🧾 Счёт" : "📋 Акт"}
																	</span>
																	<span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
																		doc.status === "generated" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
																	}`}>
																		{doc.status === "generated" ? "Сгенерирован" : "Черновик"}
																	</span>
																</div>
																<div className="flex gap-2">
																	<button
																		onClick={async () => {
																			try {
																				const docHtmlData = await api.getDocumentHtml(doc.id);
																				const htmlContent = docHtmlData.document.generated_text;
																				const iframe = document.createElement("iframe");
																				iframe.style.position = "fixed";
																				iframe.style.top = "-9999px";
																				iframe.style.left = "-9999px";
																				iframe.style.width = "1px";
																				iframe.style.height = "1px";
																				iframe.style.opacity = "0";
																				iframe.style.pointerEvents = "none";
																				iframe.srcdoc = htmlContent;
																				document.body.appendChild(iframe);
																				iframe.onload = () => {
																					setTimeout(() => {
																						try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch (e) { console.error(e); }
																						setTimeout(() => document.body.removeChild(iframe), 1000);
																					}, 300);
																				};
																			} catch (err) {
																				setDocMessage(`❌ Ошибка загрузки: ${err.message}`);
																			}
																		}}
																		className="text-xs text-primary hover:text-primary-dark font-medium"
																	>
																		PDF
																	</button>
																</div>
															</div>
														))}
													</div>
												</div>
											)}
										</div>
									))
								) : (
									<div className="card p-12 text-center">
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
										<h3 className="text-lg font-medium text-text mb-2">
											Заявок пока нет
										</h3>
										<p className="text-text-muted mb-4">
											{isOperator
												? "Заявки от туристов появятся здесь"
												: "Выберите экскурсию и оставьте заявку"}
										</p>
										{!isOperator && (
											<Link to="/excursions" className="btn btn-primary">
												Выбрать экскурсию
											</Link>
										)}
									</div>
								)}
							</div>
						)}

						{/* Excursions List for Operators */}
						{isOperator && activeTab === "excursions" && (
							<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
								{excursions.length > 0 ? (
									excursions.map((excursion) => (
										<Link
											key={excursion.id}
											to={`/excursions/${excursion.id}`}
											className="card-hover group"
										>
											<div className="h-32 overflow-hidden">
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
														className="w-12 h-12 text-primary/30"
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
												<h3 className="font-semibold text-text group-hover:text-primary transition-colors line-clamp-1">
													{excursion.title}
												</h3>
												<p className="text-sm text-text-muted line-clamp-1">
													{excursion.enterprise_name}
												</p>
												<div className="mt-2 flex justify-between text-sm">
													<span className="text-primary font-medium">
														{excursion.base_price} ₽
													</span>
													<span className="text-text-light">
														{excursion.duration_minutes} мин
													</span>
												</div>
											</div>
										</Link>
									))
								) : (
									<div className="col-span-full card p-12 text-center">
										<h3 className="text-lg font-medium text-text mb-2">
											Нет экскурсий
										</h3>
										<p className="text-text-muted">
											Скоро здесь появятся ваши экскурсии
										</p>
									</div>
								)}
							</div>
						)}

						{/* Калькулятор рентабельности для оператора */}
						{isOperator && activeTab === "calculations" && (
							<div className="grid lg:grid-cols-2 gap-8">
								<div className="card p-6">
									<h2 className="text-lg font-semibold text-text mb-4">
										Расчёт рентабельности экскурсии
									</h2>
										<form onSubmit={handleCalc} className="space-y-4">
											<div>
												<label className="block text-sm font-medium text-text mb-1">
													Экскурсия *
												</label>
												<div className="flex gap-2">
													<select
														value={calcForm.excursion_id}
														onChange={(e) => handleExcursionChange(e.target.value)}
														className="input flex-1"
														required
													>
														<option value="">Выберите экскурсию</option>
														{excursions.map((exc) => (
															<option key={exc.id} value={exc.id}>
																{exc.title} — {exc.base_price} ₽/чел
															</option>
														))}
													</select>
													{calcForm.excursion_id && (
														<button
															type="button"
															onClick={openCalcEdit}
															className="btn btn-secondary px-3"
															title="Изменить экскурсию"
														>
															<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
															</svg>
														</button>
													)}
												</div>
												{enterpriseTicketPrice > 0 && (
													<p className="text-xs text-text-muted mt-1">
														Стоимость входного билета предприятия: {enterpriseTicketPrice} ₽/чел
													</p>
												)}
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-text mb-1">
														Количество человек
													</label>
													<input
														type="number"
														value={calcForm.people_count}
														onChange={(e) => handlePeopleCountChange(e.target.value)}
														min={1}
														className="input"
														required
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-text mb-1">
														Стоимость гида (группа)
													</label>
													<input
														type="number"
														value={calcForm.guide_cost}
														onChange={(e) => setCalcForm({ ...calcForm, guide_cost: e.target.value })}
														min={0}
														className="input"
													/>
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div>
													<label className="block text-sm font-medium text-text mb-1">
														Транспорт (₽)
													</label>
													<input
														type="number"
														value={calcForm.transport_cost}
														onChange={(e) => setCalcForm({ ...calcForm, transport_cost: e.target.value })}
														min={0}
														className="input"
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-text mb-1">
														Сбор предприятия (₽)
													</label>
													<div className="relative">
														<input
															type="number"
															value={calcForm.enterprise_fee}
															onChange={(e) => handleFeeManualChange(e.target.value)}
															min={0}
															className={`input pr-8 ${calcManualFee ? 'border-amber-400 bg-amber-50' : ''}`}
														/>
														{!calcAutoFee && (
															<button
																type="button"
																onClick={enableAutoFee}
																className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary-dark font-medium px-1.5 py-0.5 rounded bg-white/80 hover:bg-white"
																title="Включить авторасчёт из стоимости билета предприятия"
															>
																↺
															</button>
														)}
													</div>
													{calcAutoFee && enterpriseTicketPrice > 0 && (
														<p className="text-xs text-green-600 mt-1">
															✓ Авторасчёт: {enterpriseTicketPrice} ₽ × {calcForm.people_count} чел.
														</p>
													)}
													{calcManualFee && (
														<p className="text-xs text-amber-600 mt-1">
															Введено вручную
														</p>
													)}
												</div>
											</div>
											<div>
												<label className="block text-sm font-medium text-text mb-1">
													Накладные расходы (%)
												</label>
												<div className="relative">
													<input
														type="number"
														value={calcOverheadPercent}
														onChange={(e) => { setCalcOverheadPercent(e.target.value); setCalcOverheadAuto(false); }}
														min={0}
														max={100}
														className={`input pr-8 ${!calcOverheadAuto ? 'border-amber-400 bg-amber-50' : ''}`}
													/>
													{!calcOverheadAuto && (
														<button
															type="button"
															onClick={() => { setCalcOverheadPercent(15); setCalcOverheadAuto(true); }}
															className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-primary hover:text-primary-dark font-medium px-1.5 py-0.5 rounded bg-white/80 hover:bg-white"
															title="Вернуть авторасчёт (15%)"
														>
															↺
														</button>
													)}
												</div>
												{calcOverheadAuto && (
													<p className="text-xs text-green-600 mt-1">✓ Стандартные 15%</p>
												)}
												{!calcOverheadAuto && (
													<p className="text-xs text-amber-600 mt-1">Введено вручную</p>
												)}
											</div>
										<button
											type="submit"
											disabled={calcLoading}
											className="btn btn-primary w-full disabled:opacity-50"
										>
											{calcLoading ? "Расчёт..." : "Рассчитать"}
										</button>
										</form>
								</div>

								{/* Модалка редактирования экскурсии из калькулятора */}
								{calcEditExcursion && calcEditForm && (
									<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
										<div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
											<div className="p-6 border-b border-gray-100 flex items-center justify-between">
												<h2 className="text-xl font-semibold text-text">Редактировать экскурсию</h2>
												<button
													onClick={() => { setCalcEditExcursion(null); setCalcEditForm(null); }}
													className="text-text-muted hover:text-text"
												>
													✕
												</button>
											</div>
											<form onSubmit={handleCalcEditSave} className="p-6 space-y-4">
												<div>
													<label className="block text-sm font-medium text-text mb-1">Название *</label>
													<input
														type="text"
														value={calcEditForm.title}
														onChange={(e) => setCalcEditForm({ ...calcEditForm, title: e.target.value })}
														className="input"
														required
													/>
												</div>
												<div>
													<label className="block text-sm font-medium text-text mb-1">Краткое описание</label>
													<textarea
														value={calcEditForm.short_description}
														onChange={(e) => setCalcEditForm({ ...calcEditForm, short_description: e.target.value })}
														rows={3}
														className="input resize-none"
													/>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-medium text-text mb-1">Цена (₽/чел) *</label>
														<input
															type="number"
															value={calcEditForm.base_price}
															onChange={(e) => setCalcEditForm({ ...calcEditForm, base_price: e.target.value })}
															min={0}
															className="input"
															required
														/>
													</div>
													<div>
														<label className="block text-sm font-medium text-text mb-1">Длительность (мин) *</label>
														<input
															type="number"
															value={calcEditForm.duration_minutes}
															onChange={(e) => setCalcEditForm({ ...calcEditForm, duration_minutes: e.target.value })}
															min={1}
															className="input"
															required
														/>
													</div>
												</div>
												<div className="grid grid-cols-2 gap-4">
													<div>
														<label className="block text-sm font-medium text-text mb-1">Мин. группа</label>
														<input
															type="number"
															value={calcEditForm.group_min}
															onChange={(e) => setCalcEditForm({ ...calcEditForm, group_min: e.target.value })}
															min={1}
															className="input"
														/>
													</div>
													<div>
														<label className="block text-sm font-medium text-text mb-1">Макс. группа</label>
														<input
															type="number"
															value={calcEditForm.group_max}
															onChange={(e) => setCalcEditForm({ ...calcEditForm, group_max: e.target.value })}
															min={1}
															className="input"
														/>
													</div>
												</div>
												<div>
													<label className="block text-sm font-medium text-text mb-1">Ссылка на фото</label>
													<input
														type="url"
														value={calcEditForm.photos}
														onChange={(e) => setCalcEditForm({ ...calcEditForm, photos: e.target.value })}
														placeholder="https://example.com/excursion.jpg"
														className="input"
													/>
													{calcEditForm.photos && (
														<div className="mt-2 w-32 h-20 rounded overflow-hidden bg-gray-100">
															<img src={calcEditForm.photos} alt="preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
														</div>
													)}
												</div>
												<div>
													<label className="block text-sm font-medium text-text mb-1">Сезонность</label>
													<input
														type="text"
														value={calcEditForm.seasonality}
														onChange={(e) => setCalcEditForm({ ...calcEditForm, seasonality: e.target.value })}
														placeholder="круглый год"
														className="input"
													/>
												</div>
												<div className="flex gap-4 pt-4">
													<button
														type="button"
														onClick={() => { setCalcEditExcursion(null); setCalcEditForm(null); }}
														className="btn btn-secondary flex-1"
													>
														Отмена
													</button>
													<button type="submit" disabled={calcEditSaving} className="btn btn-primary flex-1">
														{calcEditSaving ? "Сохранение..." : "Сохранить"}
													</button>
												</div>
											</form>
										</div>
									</div>
								)}

								{/* Результат расчёта */}
								{calcResult && (
									<div className="card p-6">
										<h2 className="text-lg font-semibold text-text mb-4">
											Результат расчёта
										</h2>
										<div className="space-y-4">
											<div className="text-center">
												<div className="text-sm text-text-muted">Экскурсия</div>
												<div className="font-semibold text-text">
													{calcResult.excursion_title}
												</div>
											</div>
											<div className="grid grid-cols-2 gap-4">
												<div className="p-4 bg-green-50 rounded-lg text-center">
													<div className="text-2xl font-bold text-green-600">
														{calcResult.revenue.toLocaleString()} ₽
													</div>
													<div className="text-xs text-text-muted mt-1">Выручка</div>
												</div>
												<div className="p-4 bg-blue-50 rounded-lg text-center">
													<div className="text-2xl font-bold text-blue-600">
														{calcResult.profit.toLocaleString()} ₽
													</div>
													<div className="text-xs text-text-muted mt-1">Прибыль</div>
												</div>
											</div>
											<div className="p-4 bg-surface-secondary rounded-lg">
												<div className="flex justify-between items-center">
													<span className="text-text-muted">Рентабельность</span>
													<span className={`text-xl font-bold ${
														parseFloat(calcResult.profitability) > 0
															? "text-green-600"
															: "text-red-600"
													}`}>
														{calcResult.profitability}%
													</span>
												</div>
											</div>
											<div className="space-y-2 text-sm">
												<div className="flex justify-between">
													<span className="text-text-muted">Затраты на гида</span>
													<span className="font-medium">{calcResult.costs.guide.toLocaleString()} ₽</span>
												</div>
												<div className="flex justify-between">
													<span className="text-text-muted">Транспорт</span>
													<span className="font-medium">{calcResult.costs.transport.toLocaleString()} ₽</span>
												</div>
												<div className="flex justify-between">
													<span className="text-text-muted">Сбор предприятия</span>
													<span className="font-medium">{calcResult.costs.enterprise.toLocaleString()} ₽</span>
												</div>
												<div className="flex justify-between">
													<span className="text-text-muted flex items-center gap-1">
														Накладные ({calcResult.details.overhead_percent}%)
														<span className="relative group inline-flex">
															<svg className="w-3.5 h-3.5 text-text-light cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
																<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
															</svg>
															<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 text-center z-10">
																Накладные (косвенные) расходы: аренда офиса, связь, ПО, маркетинг, зарплата менеджеров. Рассчитываются как процент от суммы прямых затрат.
																<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
															</div>
														</span>
													</span>
													<span className="font-medium">{calcResult.costs.overhead.toLocaleString()} ₽</span>
												</div>
												<div className="flex justify-between border-t border-gray-200 pt-2">
													<span className="font-medium text-text">Всего затрат</span>
													<span className="font-bold text-text">{calcResult.costs.total.toLocaleString()} ₽</span>
												</div>
											</div>
											<button
												onClick={() => setCalcResult(null)}
												className="btn btn-secondary w-full text-sm"
											>
												Новый расчёт
											</button>
										</div>
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}