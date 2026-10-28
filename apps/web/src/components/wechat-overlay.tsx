import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Also matches WeCom (UA contains both "wxwork" and "MicroMessenger"); passkeys fail there too.
function isWeChat() {
	if (typeof navigator === "undefined") return false;
	return /MicroMessenger/i.test(navigator.userAgent);
}

async function copyText(text: string) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch {
		const textarea = document.createElement("textarea");
		textarea.value = text;
		textarea.setAttribute("readonly", "");
		textarea.style.position = "fixed";
		textarea.style.opacity = "0";
		document.body.appendChild(textarea);
		textarea.select();
		// iOS Safari ignores select() on its own.
		textarea.setSelectionRange(0, text.length);
		let ok = false;
		try {
			ok = document.execCommand("copy");
		} catch {
			ok = false;
		}
		document.body.removeChild(textarea);
		return ok;
	}
}

// WeChat's in-app browser lacks Passkey/WebAuthn, so ask users to open
// the site in a standard browser. Detected client-side only to keep SSR
// output identical and avoid hydration mismatches.
const DISMISS_KEY = "monosolo:wechat-overlay-dismissed";

export function WeChatOverlay() {
	const [show, setShow] = useState(false);
	const [url, setUrl] = useState("");
	const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
	const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
	const copyRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		let dismissed = false;
		try {
			dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
		} catch {}
		setShow(isWeChat() && !dismissed);
		setUrl(window.location.href);
		return () => clearTimeout(timerRef.current);
	}, []);

	// Lock page scroll while shown (released on dismiss/unmount) and focus the primary action.
	useEffect(() => {
		if (!show) return;
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";
		copyRef.current?.focus();
		return () => {
			document.body.style.overflow = overflow;
		};
	}, [show]);

	if (!show) return null;

	async function handleCopy() {
		clearTimeout(timerRef.current);
		if (await copyText(url)) {
			setStatus("copied");
			timerRef.current = setTimeout(() => setStatus("idle"), 2000);
		} else {
			setStatus("failed");
		}
	}

	function handleContinue() {
		try {
			sessionStorage.setItem(DISMISS_KEY, "1");
		} catch {}
		setShow(false);
	}

	return (
		<div
			role="dialog"
			aria-modal="true"
			aria-labelledby="wechat-overlay-title"
			aria-describedby="wechat-overlay-desc"
			className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-ground/75 px-8 text-center text-ink backdrop-blur-sm"
		>
			<ArrowUpRight
				aria-hidden="true"
				className="absolute top-4 right-4 size-10 animate-pulse"
			/>
			<h2
				id="wechat-overlay-title"
				className="max-w-sm font-heading text-xl font-semibold tracking-tight text-balance"
			>
				为了更好的使用体验，请在 Chrome、Safari 等浏览器中打开
			</h2>
			<p id="wechat-overlay-desc" className="mt-3 text-sm">
				点击右上角「···」，选择「在浏览器打开」
			</p>
			<p className="mt-4 max-w-sm break-all text-xs opacity-70 select-all [-webkit-user-select:all]">
				{url}
			</p>
			<div className="mt-6 flex w-full max-w-sm gap-3">
				<button
					ref={copyRef}
					type="button"
					onClick={handleCopy}
					className="inline-flex h-11 flex-1 items-center justify-center bg-solid px-4 text-sm font-medium text-solid-ink transition-opacity hover:opacity-80 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
				>
					{status === "copied" ? "已复制" : "复制链接"}
				</button>
				<button
					type="button"
					onClick={handleContinue}
					className="inline-flex h-11 flex-1 items-center justify-center border border-ink px-4 text-sm font-medium transition-opacity hover:opacity-80 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
				>
					继续浏览
				</button>
			</div>
			{status === "failed" ? (
				<output className="mt-3 block text-sm">请长按上方链接复制</output>
			) : null}
		</div>
	);
}
