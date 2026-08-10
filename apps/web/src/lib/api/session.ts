import { apiFetch } from "@/lib/api/client";

export type StartSessionResponse = {
	pending_authentication_token: string;
	code?: string;
};

export type VerifySessionResponse = {
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
};

export function startSession(email: string) {
	return apiFetch<StartSessionResponse>("/api/v1/session", {
		method: "POST",
		body: { email },
	});
}

export function verifyMagicLink(
	code: string,
	pendingAuthenticationToken: string,
) {
	return apiFetch<VerifySessionResponse>("/api/v1/session/magic_link", {
		method: "POST",
		body: {
			code,
			pending_authentication_token: pendingAuthenticationToken,
		},
	});
}

export function fetchMe() {
	return apiFetch<MeResponse>("/api/v1/me", {
		method: "GET",
		auth: true,
	});
}

export function destroySession() {
	return apiFetch<{ message: string }>("/api/v1/session", {
		method: "DELETE",
		auth: true,
	});
}
