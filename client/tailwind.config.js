/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: "#1E40AF",
					light: "#3B82F6",
					dark: "#1E3A8A",
				},
				secondary: {
					DEFAULT: "#475569",
					light: "#64748B",
					dark: "#334155",
				},
				accent: {
					DEFAULT: "#F59E0B",
					light: "#FBBF24",
					dark: "#D97706",
				},
				surface: {
					DEFAULT: "#FFFFFF",
					secondary: "#F8FAFC",
					tertiary: "#F1F5F9",
				},
				text: {
					DEFAULT: "#1E293B",
					muted: "#64748B",
					light: "#94A3B8",
				},
			},
			fontFamily: {
				sans: ["Inter", "system-ui", "sans-serif"],
				display: ["Inter", "system-ui", "sans-serif"],
			},
		},
	},
	plugins: [],
};
