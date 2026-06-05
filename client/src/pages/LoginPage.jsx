import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { login } = useAuth();
	const navigate = useNavigate();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await login(email, password);
			navigate("/dashboard");
		} catch (err) {
			setError(err.message || "Ошибка входа");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
			<div className="w-full max-w-md">
				<div className="card p-8">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-text mb-2">
							Вход в систему
						</h1>
						<p className="text-text-muted">
							Войдите в свой аккаунт для продолжения
						</p>
					</div>

					{error && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Email
							</label>
							<input
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="input"
								placeholder="your@email.com"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Пароль
							</label>
							<input
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="input"
								placeholder="••••••••"
								required
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="btn btn-primary w-full py-3 disabled:opacity-50"
						>
							{loading ? "Вход..." : "Войти"}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-text-muted">
							Нет аккаунта?{" "}
							<Link
								to="/register"
								className="text-primary font-medium hover:underline"
							>
								Зарегистрироваться
							</Link>
						</p>
					</div>

					{/* Demo accounts — кликабельные */}
					<div className="mt-8 pt-6 border-t border-gray-100">
						<p className="text-xs text-text-light text-center mb-4">
							Тестовые аккаунты (нажмите для входа):
						</p>
						<div className="grid grid-cols-1 gap-2 text-xs">
							<button
								type="button"
								onClick={async () => {
									setEmail("admin@industrial-tourism.ru");
									setPassword("admin123");
									setLoading(true);
									try {
										await login("admin@industrial-tourism.ru", "admin123");
										navigate("/dashboard");
									} catch (err) {
										setError(err.message || "Ошибка входа");
									} finally {
										setLoading(false);
									}
								}}
								className="w-full p-2 bg-surface-secondary rounded flex justify-between hover:bg-primary/10 transition-colors cursor-pointer text-left"
							>
								<span className="text-text-muted">Админ:</span>
								<span className="text-text">
									admin@industrial-tourism.ru / admin123
								</span>
							</button>
							<button
								type="button"
								onClick={async () => {
									setEmail("operator@promtour.ru");
									setPassword("operator123");
									setLoading(true);
									try {
										await login("operator@promtour.ru", "operator123");
										navigate("/dashboard");
									} catch (err) {
										setError(err.message || "Ошибка входа");
									} finally {
										setLoading(false);
									}
								}}
								className="w-full p-2 bg-surface-secondary rounded flex justify-between hover:bg-primary/10 transition-colors cursor-pointer text-left"
							>
								<span className="text-text-muted">Оператор:</span>
								<span className="text-text">
									operator@promtour.ru / operator123
								</span>
							</button>
							<button
								type="button"
								onClick={async () => {
									setEmail("ivanova@mail.ru");
									setPassword("tourist123");
									setLoading(true);
									try {
										await login("ivanova@mail.ru", "tourist123");
										navigate("/dashboard");
									} catch (err) {
										setError(err.message || "Ошибка входа");
									} finally {
										setLoading(false);
									}
								}}
								className="w-full p-2 bg-surface-secondary rounded flex justify-between hover:bg-primary/10 transition-colors cursor-pointer text-left"
							>
								<span className="text-text-muted">Турист:</span>
								<span className="text-text">ivanova@mail.ru / tourist123</span>
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
