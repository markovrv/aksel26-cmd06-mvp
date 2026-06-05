import { useState, useEffect } from "react";
import api from "../api";

export default function AnalyticsPage() {
	const [summary, setSummary] = useState(null);
	const [popular, setPopular] = useState([]);
	const [seasonality, setSeasonality] = useState([]);
	const [revenue, setRevenue] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		setLoading(true);
		try {
			const [summaryData, popularData, seasonalityData, revenueData] =
				await Promise.all([
					api.getSummary().catch(() => ({ summary: null })),
					api.getPopular().catch(() => ({ popular: [] })),
					api.getSeasonality().catch(() => ({ seasonality: [] })),
					api.getRevenue("month").catch(() => ({ revenue: [] })),
				]);

			setSummary(summaryData.summary);
			setPopular(popularData.popular || []);
			setSeasonality(seasonalityData.seasonality || []);
			setRevenue(revenueData.revenue || []);
		} catch (error) {
			console.error("Error loading analytics:", error);
		} finally {
			setLoading(false);
		}
	};

	const maxVisitors = Math.max(...seasonality.map((s) => s.visitors || 0), 1);

	return (
		<div className="py-8 md:py-12">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-text mb-2">Аналитика</h1>
					<p className="text-text-muted">
						Статистика и показатели вашей работы
					</p>
				</div>

				{loading ? (
					<div className="space-y-6">
						<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
							{[1, 2, 3, 4].map((i) => (
								<div key={i} className="card p-6 animate-pulse">
									<div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
									<div className="h-4 bg-gray-200 rounded w-3/4"></div>
								</div>
							))}
						</div>
					</div>
				) : (
					<div className="space-y-8">
						{/* Summary Stats */}
						<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
							<div className="card p-6">
								<div className="text-3xl font-bold text-primary mb-1">
									{summary?.total_requests || 0}
								</div>
								<div className="text-sm text-text-muted">Всего заявок</div>
							</div>
							<div className="card p-6">
								<div className="text-3xl font-bold text-green-600 mb-1">
									{summary?.confirmed || 0}
								</div>
								<div className="text-sm text-text-muted">Подтверждено</div>
							</div>
							<div className="card p-6">
								<div className="text-3xl font-bold text-orange-600 mb-1">
									{summary?.group_not_met || 0}
								</div>
								<div className="text-sm text-text-muted">Недобор группы</div>
							</div>
							<div className="card p-6">
								<div className="text-3xl font-bold text-accent mb-1">
									{summary?.total_revenue
										? `${(summary.total_revenue / 1000).toFixed(1)}к`
										: 0}{" "}
									₽
								</div>
								<div className="text-sm text-text-muted">Общий доход</div>
							</div>
						</div>

						{/* Seasonality Chart */}
						<div className="card p-6">
							<h2 className="text-lg font-semibold text-text mb-6">
								Посещаемость по месяцам
							</h2>
							{seasonality.length > 0 ? (
								<div className="flex items-end gap-2 h-48">
									{seasonality.map((item, idx) => (
										<div
											key={idx}
											className="flex-1 flex flex-col items-center gap-2"
										>
											<div
												className="w-full bg-primary/20 rounded-t relative"
												style={{
													height: `${(item.visitors / maxVisitors) * 100}%`,
													minHeight: item.visitors > 0 ? "4px" : "0",
												}}
											>
												<div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium text-text">
													{item.visitors}
												</div>
											</div>
											<span className="text-xs text-text-muted">
												{item.month_name?.slice(0, 3)}
											</span>
										</div>
									))}
								</div>
							) : (
								<p className="text-center text-text-muted py-8">
									Нет данных о посещаемости
								</p>
							)}
						</div>

						{/* Popular Excursions */}
						<div className="card p-6">
							<h2 className="text-lg font-semibold text-text mb-4">
								Популярные экскурсии
							</h2>
							{popular.length > 0 ? (
								<div className="space-y-4">
									{popular.map((item, idx) => (
										<div
											key={item.id}
											className="flex items-center gap-4 p-3 bg-surface-secondary rounded-lg"
										>
											<div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
												{idx + 1}
											</div>
											<div className="flex-1 min-w-0">
												<div className="font-medium text-text truncate">
													{item.title}
												</div>
												<div className="text-sm text-text-muted">
													{item.enterprise_name}
												</div>
											</div>
											<div className="text-right">
												<div className="font-medium text-text">
													{item.request_count} заявок
												</div>
												<div className="text-sm text-text-muted">
													{item.total_visitors || 0} чел.
												</div>
											</div>
										</div>
									))}
								</div>
							) : (
								<p className="text-center text-text-muted py-8">
									Нет данных о популярности
								</p>
							)}
						</div>

						{/* Revenue Table */}
						<div className="card p-6">
							<h2 className="text-lg font-semibold text-text mb-4">
								Доход по месяцам
							</h2>
							{revenue.length > 0 ? (
								<div className="overflow-x-auto">
									<table className="w-full">
										<thead>
											<tr className="border-b border-gray-200">
												<th className="text-left py-3 px-4 text-sm font-medium text-text-muted">
													Период
												</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
													Заявок
												</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
													Посетителей
												</th>
												<th className="text-right py-3 px-4 text-sm font-medium text-text-muted">
													Доход
												</th>
											</tr>
										</thead>
										<tbody>
											{revenue.map((item, idx) => (
												<tr key={idx} className="border-b border-gray-100">
													<td className="py-3 px-4 text-text">{item.period}</td>
													<td className="py-3 px-4 text-right text-text">
														{item.request_count}
													</td>
													<td className="py-3 px-4 text-right text-text">
														{item.visitors}
													</td>
													<td className="py-3 px-4 text-right font-medium text-primary">
														{item.revenue?.toLocaleString() || 0} ₽
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<p className="text-center text-text-muted py-8">
									Нет данных о доходах
								</p>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
