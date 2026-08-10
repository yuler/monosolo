import { apiFetch } from "@/lib/api/client";

export type DevLetter = {
	id: string;
	sent_at: string | null;
	subject: string | null;
	to: string | null;
	from: string | null;
};

export type DevLettersResponse = {
	letters: DevLetter[];
};

export function fetchDevLetters() {
	return apiFetch<DevLettersResponse>("/api/v1/dev/letters", {
		method: "GET",
	});
}
