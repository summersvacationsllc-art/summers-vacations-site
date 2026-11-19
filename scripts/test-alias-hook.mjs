import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const file = path.extname(rel) ? rel : `${rel}.ts`;
    return {
      url: pathToFileURL(path.join(root, "src", file)).href,
      shortCircuit: true,
    };
  }
  // next/server is CommonJS without an exports map. Node ESM needs the .js file.
  if (specifier === "next/server") return nextResolve("next/server.js", context);
  // Node's ESM loader does not add .ts. Existing tests import extensionless files.
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && !path.extname(specifier)) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      return nextResolve(specifier, context);
    }
  }
  return nextResolve(specifier, context);
}
