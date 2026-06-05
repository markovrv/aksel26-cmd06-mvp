import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
	const [formData, setFormData] = useState({
		full_name: "",
		email: "",
		phone: "",
		password: "",
		confirmPassword: "",
		role: "tourist",
		company_name: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const { register } = useAuth();
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (formData.password !== formData.confirmPassword) {
			setError("Пароли не совпадают");
			return;
		}

		if (formData.password.length < 6) {
			setError("Пароль должен быть минимум 6 символов");
			return;
		}

		setLoading(true);

		try {
			const { confirmPassword, ...registerData } = formData;
			await register(registerData);
			navigate("/dashboard");
		} catch (err) {
			setError(err.message || "Ошибка регистрации");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
			<div className="w-full max-w-md">
				<div className="card p-8">
					<div className="text-center mb-8">
						<h1 className="text-2xl font-bold text-text mb-2">Регистрация</h1>
						<p className="text-text-muted">Создайте новый аккаунт</p>
					</div>

					{error && (
						<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
							{error}
						</div>
					)}

					<form onSubmit={handleSubmit} className="space-y-5">
						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Тип аккаунта
							</label>
							<select
								name="role"
								value={formData.role}
								onChange={handleChange}
								className="input"
							>
								<option value="tourist">Турист</option>
								<option value="operator">Туроператор</option>
							</select>
						</div>

						<div>
							<label className="block text-sm font-medium text-text mb-2">
								{formData.role === "tourist" ? "ФИО" : "Название компании"} *
							</label>
							<input
								type="text"
								name={
									formData.role === "tourist" ? "full_name" : "company_name"
								}
								value={
									formData.role === "tourist"
										? formData.full_name
										: formData.company_name
								}
								onChange={handleChange}
								className="input"
								placeholder={
									formData.role === "tourist"
										? "Иванов Иван Иванович"
										: "ООО «Компания»"
								}
								required
							/>
						</div>

						{formData.role === "tourist" && (
							<div>
								<label className="block text-sm font-medium text-text mb-2">
									ФИО *
								</label>
								<input
									type="text"
									name="full_name"
									value={formData.full_name}
									onChange={handleChange}
									className="input"
									placeholder="Иванов Иван Иванович"
									required
								/>
							</div>
						)}

						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Email *
							</label>
							<input
								type="email"
								name="email"
								value={formData.email}
								onChange={handleChange}
								className="input"
								placeholder="your@email.com"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Телефон
							</label>
							<input
								type="tel"
								name="phone"
								value={formData.phone}
								onChange={handleChange}
								className="input"
								placeholder="+7 (999) 123-45-67"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Пароль *
							</label>
							<input
								type="password"
								name="password"
								value={formData.password}
								onChange={handleChange}
								className="input"
								placeholder="Минимум 6 символов"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-text mb-2">
								Подтверждение пароля *
							</label>
							<input
								type="password"
								name="confirmPassword"
								value={formData.confirmPassword}
								onChange={handleChange}
								className="input"
								placeholder="Повторите пароль"
								required
							/>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="btn btn-primary w-full py-3 disabled:opacity-50"
						>
							{loading ? "Регистрация..." : "Зарегистрироваться"}
						</button>
					</form>

					<div className="mt-6 text-center">
						<p className="text-sm text-text-muted">
							Уже есть аккаунт?{" "}
							<Link
								to="/login"
								className="text-primary font-medium hover:underline"
							>
								Войти
							</Link>
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
