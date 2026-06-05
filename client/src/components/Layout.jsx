import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";

export default function Layout({ children }) {
	const { user, logout } = useAuth();
	const location = useLocation();
	const navigate = useNavigate();
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	const handleLogout = () => {
		logout();
		navigate("/");
	};

	const navLinks = [
		{ href: "/", label: "Главная" },
		{ href: "/excursions", label: "Экскурсии" },
	];

	const userLinks = user
		? [
				{
					href: "/dashboard",
					label: "Личный кабинет",
					roles: ["tourist", "operator", "admin"],
				},
				{
					href: "/enterprises",
					label: "Предприятия",
					roles: ["operator", "admin"],
				},
				{
					href: "/analytics",
					label: "Аналитика",
					roles: ["operator", "admin"],
				},
				{
					href: "/profile",
					label: "Профиль",
					roles: ["tourist", "operator", "admin"],
				},
			]
		: [];

	const filteredUserLinks = userLinks.filter(
		(link) => !link.roles || link.roles.includes(user?.role),
	);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Header */}
			<header className="bg-white border-b border-gray-100 sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<Link to="/" className="flex items-center gap-2">
							<div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
								<svg
									className="w-6 h-6 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
									/>
								</svg>
							</div>
							<span className="text-xl font-bold text-primary">
								ТурМенеджер
							</span>
						</Link>

						{/* Desktop Navigation */}
						<nav className="hidden md:flex items-center gap-6">
							{navLinks.map((link) => (
								<Link
									key={link.href}
									to={link.href}
									className={`text-sm font-medium transition-colors ${
										location.pathname === link.href
											? "text-primary"
											: "text-text-muted hover:text-text"
									}`}
								>
									{link.label}
								</Link>
							))}

							{filteredUserLinks.map((link) => (
								<Link
									key={link.href}
									to={link.href}
									className={`text-sm font-medium transition-colors ${
										location.pathname === link.href
											? "text-primary"
											: "text-text-muted hover:text-text"
									}`}
								>
									{link.label}
								</Link>
							))}
						</nav>

						{/* Auth buttons */}
						<div className="flex items-center gap-3">
							{user ? (
								<div className="flex items-center gap-3">
									<span className="text-sm text-text-muted hidden sm:block">
										{user.full_name}
									</span>
									<button
										onClick={handleLogout}
										className="btn btn-secondary text-sm"
									>
										Выйти
									</button>
								</div>
							) : (
								<>
									<Link to="/login" className="btn btn-secondary text-sm">
										Войти
									</Link>
									<Link
										to="/register"
										className="btn btn-primary text-sm hidden sm:flex"
									>
										Регистрация
									</Link>
								</>
							)}

							{/* Mobile menu button */}
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="md:hidden p-2 text-text-muted hover:text-text"
							>
								<svg
									className="w-6 h-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									{mobileMenuOpen ? (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									) : (
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 6h16M4 12h16M4 18h16"
										/>
									)}
								</svg>
							</button>
						</div>
					</div>

					{/* Mobile menu */}
					{mobileMenuOpen && (
						<div className="md:hidden py-4 border-t border-gray-100 animate-fade-in">
							<nav className="flex flex-col gap-2">
								{[...navLinks, ...filteredUserLinks].map((link) => (
									<Link
										key={link.href}
										to={link.href}
										onClick={() => setMobileMenuOpen(false)}
										className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
											location.pathname === link.href
												? "bg-primary/10 text-primary"
												: "text-text-muted hover:bg-gray-50"
										}`}
									>
										{link.label}
									</Link>
								))}
								{!user && (
									<Link
										to="/register"
										onClick={() => setMobileMenuOpen(false)}
										className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white mt-2"
									>
										Регистрация
									</Link>
								)}
							</nav>
						</div>
					)}
				</div>
			</header>

			{/* Main content */}
			<main className="flex-1">{children}</main>

			{/* Footer */}
			<footer className="bg-white border-t border-gray-100 mt-auto">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="flex flex-col md:flex-row items-center justify-between gap-4">
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
								<svg
									className="w-5 h-5 text-white"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
									/>
								</svg>
							</div>
							<span className="text-lg font-bold text-primary">ТурМенеджер</span>
						</div>
						<p className="text-sm text-text-muted">
							ТурМенеджер — Логика профессиональных туров ©{" "}
							{new Date().getFullYear()}
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
