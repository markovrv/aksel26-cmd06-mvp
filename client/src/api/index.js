const API_BASE = "/api";

class ApiClient {
	constructor() {
		this.token = localStorage.getItem("token");
	}

	setToken(token) {
		this.token = token;
		if (token) {
			localStorage.setItem("token", token);
		} else {
			localStorage.removeItem("token");
		}
	}

	async request(endpoint, options = {}) {
		const headers = {
			"Content-Type": "application/json",
			...options.headers,
		};

		if (this.token) {
			headers["Authorization"] = `Bearer ${this.token}`;
		}

		const response = await fetch(`${API_BASE}${endpoint}`, {
			...options,
			headers,
		});

		const data = await response.json();

		if (!response.ok) {
			throw new Error(data.error || "Ошибка запроса");
		}

		return data;
	}

	// Auth
	async login(email, password) {
		const data = await this.request("/auth/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		this.setToken(data.token);
		return data;
	}

	async register(userData) {
		const data = await this.request("/auth/register", {
			method: "POST",
			body: JSON.stringify(userData),
		});
		this.setToken(data.token);
		return data;
	}

	async getMe() {
		return this.request("/auth/me");
	}

	logout() {
		this.setToken(null);
	}

	// Enterprises
	async getEnterprises(params = {}) {
		const query = new URLSearchParams(params).toString();
		return this.request(`/enterprises${query ? "?" + query : ""}`);
	}

	async getEnterprise(id) {
		return this.request(`/enterprises/${id}`);
	}

	async createEnterprise(data) {
		return this.request("/enterprises", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	async updateEnterprise(id, data) {
		return this.request(`/enterprises/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	}

	async deleteEnterprise(id) {
		return this.request(`/enterprises/${id}`, { method: "DELETE" });
	}

	// Excursions
	async getExcursions(params = {}) {
		const query = new URLSearchParams(params).toString();
		return this.request(`/excursions${query ? "?" + query : ""}`);
	}

	async getExcursion(id) {
		return this.request(`/excursions/${id}`);
	}

	async createExcursion(data) {
		return this.request("/excursions", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	async updateExcursion(id, data) {
		return this.request(`/excursions/${id}`, {
			method: "PUT",
			body: JSON.stringify(data),
		});
	}

	async deleteExcursion(id) {
		return this.request(`/excursions/${id}`, { method: "DELETE" });
	}

	// Requests
	async getRequests(params = {}) {
		const query = new URLSearchParams(params).toString();
		return this.request(`/requests${query ? "?" + query : ""}`);
	}

	async getRequest(id) {
		return this.request(`/requests/${id}`);
	}

	async createRequest(data) {
		return this.request("/requests", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	async updateRequestStatus(id, status) {
		return this.request(`/requests/${id}/status`, {
			method: "PATCH",
			body: JSON.stringify({ status }),
		});
	}

	async getAlternatives(requestId) {
		return this.request(`/requests/${requestId}/alternatives`, {
			method: "POST",
		});
	}

	// Documents
	async generateDocument(requestId, type) {
		return this.request("/documents/generate", {
			method: "POST",
			body: JSON.stringify({ request_id: requestId, type }),
		});
	}

	async getDocuments(requestId) {
		return this.request(`/documents/request/${requestId}`);
	}

	async getDocumentHtml(documentId) {
		return this.request(`/documents/${documentId}/html`);
	}

	// Calculations
	async runCalculation(data) {
		return this.request("/calculations/run", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	async getCalculation(id) {
		return this.request(`/calculations/${id}`);
	}

	// Analytics
	async getSummary() {
		return this.request("/analytics/summary");
	}

	async getPopular() {
		return this.request("/analytics/popular");
	}

	async getRevenue(period = "month") {
		return this.request(`/analytics/revenue?period=${period}`);
	}

	async getSeasonality() {
		return this.request("/analytics/seasonality");
	}

	// AI
	async getAIAlternatives(data) {
		return this.request("/ai/alternatives", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}

	async getAIRecommendations(data) {
		return this.request("/ai/recommendations", {
			method: "POST",
			body: JSON.stringify(data),
		});
	}
}

export const api = new ApiClient();
export default api;
