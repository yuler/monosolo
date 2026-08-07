import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

const monorepoRoot = path.resolve(
	fileURLToPath(new URL(".", import.meta.url)),
	"../..",
);

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, monorepoRoot, "");

	return {
		envDir: monorepoRoot,
		resolve: {
			tsconfigPaths: true,
			alias: {
				"@": path.resolve(fileURLToPath(new URL(".", import.meta.url)), "src"),
			},
		},
		server: {
			port: Number(env.WEB_PORT) || 3000,
			// Allow http://web.monosolo.localhost:<port> (and any *.localhost)
			allowedHosts: [".localhost"],
		},
		plugins: [
			devtools({ removeDevtoolsOnBuild: true }),
			tailwindcss(),
			tanstackRouter({ target: "react", autoCodeSplitting: true }),
			viteReact(),
		],
	};
});
