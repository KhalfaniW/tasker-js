import esbuild from "esbuild";
import { replace } from "esbuild-plugin-replace";
import { networkInterfaces } from "os";

const baseIP =
  Object.entries(networkInterfaces())
    .flatMap(([_, interfaces]) => interfaces)
    .filter((net) => net.family === "IPv4" && !net.internal)
    .map((net) => `${net.address}`)[0] || "localhost";

console.log("baseIP", baseIP);
async function build() {
  try {
    await esbuild.build({
      entryPoints: ["./src/client"],
      bundle: true,
      outfile: "build/bundle.js",
      platform: "browser",
      format: "iife",
      external: ["node-fetch", "eventsource"], // Keep these external to prevent bundling
      banner: {
        js: `globalThis.baseUrl = "http://${baseIP}";
          const flash = console.log;
          const vibrate = () => {};
          const exit = () => {};`,
      },
    });
    console.log("Build completed successfully.");
  } catch (error) {
    console.error("Build failed:", error);
  }
}

build();
