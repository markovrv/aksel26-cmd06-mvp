import { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			setLoading(false);
			return;
		}

		try {
			const data = await api.getMe();
			setUser(data.user);
		} catch {
			localStorage.removeItem("token");
		} finally {
			setLoading(false);
		}
	};

	const login = async (email, password) => {
		const data = await api.login(email, password);
		setUser(data.user);
		return data;
	};

	const register = async (userData) => {
		const data = await api.register(userData);
		setUser(data.user);
		return data;
	};

	const logout = () => {
		api.logout();
		setUser(null);
	};

	return (
		<AuthContext.Provider
			value={{ user, loading, login, register, logout, checkAuth }}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
