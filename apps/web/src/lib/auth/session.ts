const SESSION_TOKEN_KEY = "monosolo.session_token";
const PENDING_TOKEN_KEY = "monosolo.pending_authentication_token";

export function getSessionToken(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(SESSION_TOKEN_KEY);
}

export function setSessionToken(token: string): void {
	localStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearSessionToken(): void {
	localStorage.removeItem(SESSION_TOKEN_KEY);
}

export function getPendingAuthenticationToken(): string | null {
	if (typeof window === "undefined") return null;
	return sessionStorage.getItem(PENDING_TOKEN_KEY);
}

export function setPendingAuthenticationToken(token: string): void {
	sessionStorage.setItem(PENDING_TOKEN_KEY, token);
}

export function clearPendingAuthenticationToken(): void {
	sessionStorage.removeItem(PENDING_TOKEN_KEY);
}

export function isSignedIn(): boolean {
	return Boolean(getSessionToken());
}
