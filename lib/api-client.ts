/**
 * Client-side API utility for making authenticated requests to the backend.
 * Reads the auth_token cookie set at login and passes it as a Bearer token.
 */

function getCookie(name: string): string | null {
	if (typeof document === "undefined") return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; ${name}=`);
	if (parts.length === 2) return parts.pop()!.split(";").shift() || null;
	return null;
}

export async function apiRequest<T = any>(
	url: string,
	options: RequestInit = {},
): Promise<T> {
	const token = getCookie("auth_token");

	const headers: Record<string, string> = {
		"Content-Type": "application/json",
		...(options.headers as Record<string, string>),
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(url, { ...options, headers });

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.error || `Request failed: ${response.status}`);
	}

	return response.json();
}

export const api = {
	get: <T = any>(url: string) => apiRequest<T>(url, { method: "GET" }),
	post: <T = any>(url: string, data: unknown) =>
		apiRequest<T>(url, { method: "POST", body: JSON.stringify(data) }),
	put: <T = any>(url: string, data: unknown) =>
		apiRequest<T>(url, { method: "PUT", body: JSON.stringify(data) }),
	patch: <T = any>(url: string, data: unknown) =>
		apiRequest<T>(url, { method: "PATCH", body: JSON.stringify(data) }),
	delete: <T = any>(url: string) => apiRequest<T>(url, { method: "DELETE" }),
};
