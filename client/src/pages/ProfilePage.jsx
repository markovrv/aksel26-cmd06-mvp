import { useAuth } from "../contexts/AuthContext";

export default function ProfilePage() {
	const { user } = useAuth();

	const roleLabels = {
		tourist: "Турист",
		operator: "Туроператор",
		admin: "Администратор",
	};

	return (
		<div className="py-8 md:py-12">
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-text mb-2">Профиль</h1>
					<p className="text-text-muted">Ваша личная информация</p>
				</div>

				<div className="card">
					{/* Avatar */}
					<div className="p-6 border-b border-gray-100 bg-surface-secondary">
						<div className="flex items-center gap-4">
							<div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-3xl font-bold text-white">
								{user?.full_name?.charAt(0) ||
									user?.company_name?.charAt(0) ||
									"U"}
							</div>
							<div>
								<h2 className="text-xl font-semibold text-text">
									{user?.full_name || user?.company_name}
								</h2>
								<span className="inline-block mt-1 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
									{roleLabels[user?.role] || user?.role}
								</span>
							</div>
						</div>
					</div>

					{/* Info */}
					<div className="p-6 space-y-4">
						<div className="grid sm:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm text-text-muted mb-1">
									Email
								</label>
								<div className="font-medium text-text">{user?.email}</div>
							</div>
							<div>
								<label className="block text-sm text-text-muted mb-1">
									Телефон
								</label>
								<div className="font-medium text-text">
									{user?.phone || "—"}
								</div>
							</div>
						</div>

						{user?.company_name && (
							<>
								<div>
									<label className="block text-sm text-text-muted mb-1">
										Компания
									</label>
									<div className="font-medium text-text">
										{user.company_name}
									</div>
								</div>
								<div>
									<label className="block text-sm text-text-muted mb-1">
										Адрес компании
									</label>
									<div className="font-medium text-text">
										{user.company_address || "—"}
									</div>
								</div>
							</>
						)}
					</div>

					{/* Actions */}
					<div className="p-6 border-t border-gray-100 bg-surface-secondary">
						<p className="text-sm text-text-muted text-center">
							Для изменения данных обратитесь к администратору
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
