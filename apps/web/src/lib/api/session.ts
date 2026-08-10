import { apiFetch } from "@/lib/api/client";

export type StartSessionResponse = {
	/** Still returned for non-browser clients; browsers rely on the pending cookie. */
	pending_authentication_token: string;
	code?: string;
};

export type VerifySessionResponse = {
	/** Still returned for non-browser clients; browsers rely on the session cookie. */
	session_token: string;
};

export type MeResponse = {
	identity: {
		id: string;
		email: string;
		name: string;
		staff: boolean;
	};
	accounts: Array<{
		id: string;
		name: string;
		slug: string;
		personal: boolean;
	}>;
	last_account_slug: string | null;
};

export function startSession(email: string) {
	return apiFetch<StartSessionResponse>("/api/v1/session", {
		method: "POST",
		body: { email },
	});
}

/** Verifies the magic-link code; pending auth comes from the HttpOnly cookie. */
export function verifyMagicLink(code: string) {
	return apiFetch<VerifySessionResponse>("/api/v1/session/magic_link", {
		method: "POST",
		body: { code },
	});
}

export function fetchMe() {
	return apiFetch<MeResponse>("/api/v1/me", {
		method: "GET",
	});
}

/** Ask Core to persist the last-account picker hint cookie. */
export function rememberLastAccount(slug: string) {
	return apiFetch<{ last_account_slug: string }>("/api/v1/me/last_account", {
		method: "PUT",
		body: { slug },
	});
}

export function destroySession() {
	return apiFetch<{ message: string }>("/api/v1/session", {
		method: "DELETE",
	});
}
