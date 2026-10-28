import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export function LoadingBar() {
	const isBusy = useRouterState({
		select: (s) => s.isLoading || s.matches.some((m) => Boolean(m.isFetching)),
	});

	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (isBusy) {
			setVisible(true);
		} else {
			const timer = setTimeout(() => setVisible(false), 250);
			return () => clearTimeout(timer);
		}
	}, [isBusy]);

	if (!visible) return null;

	return (
		<div
			aria-hidden="true"
			className={`fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-line/20 overflow-hidden pointer-events-none transition-opacity duration-200 ${
				isBusy ? "opacity-100" : "opacity-0"
			}`}
		>
			<div className="h-full w-full animate-loading-bar bg-gradient-to-r from-transparent via-ink to-transparent" />
		</div>
	);
}
