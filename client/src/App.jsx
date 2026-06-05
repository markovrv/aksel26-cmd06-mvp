import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Layout
import Layout from "./components/Layout";

// Pages
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ExcursionsPage from "./pages/ExcursionsPage";
import ExcursionDetailPage from "./pages/ExcursionDetailPage";
import RequestPage from "./pages/RequestPage";
import DashboardPage from "./pages/DashboardPage";
import EnterprisesPage from "./pages/EnterprisesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }) {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-surface-secondary">
				<div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
			</div>
		);
	}

	if (!user) {
		return <Navigate to="/login" replace />;
	}

	if (allowedRoles && !allowedRoles.includes(user.role)) {
		return <Navigate to="/" replace />;
	}

	return children;
}

function AppRoutes() {
	const { user } = useAuth();

	return (
		<Routes>
			{/* Public routes */}
			<Route
				path="/"
				element={
					<Layout>
						<HomePage />
					</Layout>
				}
			/>
			<Route
				path="/login"
				element={
					user ? (
						<Navigate to="/dashboard" replace />
					) : (
						<Layout>
							<LoginPage />
						</Layout>
					)
				}
			/>
			<Route
				path="/register"
				element={
					user ? (
						<Navigate to="/dashboard" replace />
					) : (
						<Layout>
							<RegisterPage />
						</Layout>
					)
				}
			/>
			<Route
				path="/excursions"
				element={
					<Layout>
						<ExcursionsPage />
					</Layout>
				}
			/>
			<Route
				path="/excursions/:id"
				element={
					<Layout>
						<ExcursionDetailPage />
					</Layout>
				}
			/>

			{/* Protected routes for tourists */}
			<Route
				path="/request/:excursionId"
				element={
					<ProtectedRoute allowedRoles={["tourist", "operator", "admin"]}>
						<Layout>
							<RequestPage />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<Layout>
							<DashboardPage />
						</Layout>
					</ProtectedRoute>
				}
			/>

			{/* Protected routes for operators */}
			<Route
				path="/enterprises"
				element={
					<ProtectedRoute allowedRoles={["operator", "admin"]}>
						<Layout>
							<EnterprisesPage />
						</Layout>
					</ProtectedRoute>
				}
			/>
			<Route
				path="/analytics"
				element={
					<ProtectedRoute allowedRoles={["operator", "admin"]}>
						<Layout>
							<AnalyticsPage />
						</Layout>
					</ProtectedRoute>
				}
			/>

			{/* Profile - for all authenticated users */}
			<Route
				path="/profile"
				element={
					<ProtectedRoute>
						<Layout>
							<ProfilePage />
						</Layout>
					</ProtectedRoute>
				}
			/>

			{/* Fallback */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
}

export default function App() {
	return (
		<BrowserRouter>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</BrowserRouter>
	);
}
