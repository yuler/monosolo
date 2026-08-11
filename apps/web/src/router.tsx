import { createRouter } from "@tanstack/react-router";

import { NotFound } from "@/components/not-found";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
	const router = createRouter({
		routeTree,
		defaultPreload: "intent",
		// Reuse preloaded beforeLoad/loader data briefly so hover→click is not a second fetch.
		defaultPreloadStaleTime: 30_000,
		defaultStaleTime: 30_000,
		defaultNotFoundComponent: NotFound,
		scrollRestoration: true,
	});

	return router;
}

declare module "@tanstack/react-router" {
	interface Register {
		router: ReturnType<typeof getRouter>;
	}
}
