import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";

const monorepoRoot = path.resolve(
	fileURLToPath(new URL(".", import.meta.url)),
	"../..",
);

interface BuildInfoPayload {
	version: string;
	gitHash: string;
	buildTime: string;
}

// Build metadata inlined into the client/SSR bundles (see build-info.ts).
// Docker/CI builds pass APP_VERSION + GIT_REVISION build args; local dev falls
// back to the repo-root VERSION file and the live git HEAD.
function getBuildInfo(): BuildInfoPayload {
	return {
		version: (() => {
			if (process.env.APP_VERSION) return process.env.APP_VERSION;
			try {
				return readFileSync(
					fileURLToPath(new URL("../../VERSION", import.meta.url)),
					"utf8",
				).trim();
			} catch {
				return "dev";
			}
		})(),
		gitHash: (() => {
			if (process.env.GIT_REVISION) return process.env.GIT_REVISION;
			try {
				return execSync("git rev-parse HEAD", {
					stdio: ["ignore", "pipe", "ignore"],
				})
					.toString()
					.trim();
			} catch {
				return "unknown";
			}
		})(),
		buildTime: new Date().toISOString(),
	};
}

/** Lightweight /version.json for deployed-version polling. */
function versionJsonPlugin(prodInfo: BuildInfoPayload): Plugin {
	const publicDir = fileURLToPath(new URL("public", import.meta.url));
	const payload = `${JSON.stringify(prodInfo)}\n`;

	return {
		name: "version-json",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url?.split("?")[0] !== "/version.json") return next();
				res.setHeader("Content-Type", "application/json; charset=utf-8");
				res.setHeader("Cache-Control", "no-cache");
				res.end(JSON.stringify(getBuildInfo()));
			});
		},
		generateBundle() {
			this.emitFile({
				type: "asset",
				fileName: "version.json",
				source: payload,
			});
		},
		closeBundle() {
			mkdirSync(publicDir, { recursive: true });
			writeFileSync(path.join(publicDir, "version.json"), payload);
		},
	};
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, monorepoRoot, "");
	const coreProxy =
		env.CORE_INTERNAL_URL || "http://core.monosolo.localhost:3001";
	const buildInfo = Object.freeze(getBuildInfo());

	return {
		define: {
			__BUILD_INFO__: JSON.stringify(buildInfo),
		},
		envDir: monorepoRoot,
		server: {
			port: Number(env.WEB_PORT) || 3000,
			// Allow http://web.monosolo.localhost:<port> (and any *.localhost)
			allowedHosts: [".localhost"],
		},
		resolve: {
			tsconfigPaths: true,
			alias: {
				"@": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
			},
		},
		plugins: [
			versionJsonPlugin(buildInfo),
			tailwindcss(),
			tanstackStart({
				srcDirectory: "src",
			}),
			viteReact(),
			nitro({
				// Mode B: same-origin /api → Rails core (Compose service `core`, or local).
				routeRules: {
					"/api/**": { proxy: `${coreProxy}/api/**` },
					"/up": { proxy: `${coreProxy}/up` },
					"/version.json": {
						headers: {
							"Cache-Control": "no-cache",
						},
					},
				},
			}),
		],
	};
});
