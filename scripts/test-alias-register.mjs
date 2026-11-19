import { register } from "node:module";

// Lets node:test load the app's `@/` imports. Pass this file with --import.
register("./test-alias-hook.mjs", import.meta.url);
