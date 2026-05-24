const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("path");

const projectRoot = __dirname;
// The monorepo root is two levels up from apps/mobile
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// ── Monorepo support ──────────────────────────────────────────────────────────

// 1. Watch all workspace packages so Metro picks up changes in real time
config.watchFolders = [workspaceRoot];

// 2. Tell Metro where to look for node_modules (project root + workspace root)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Prevent Metro from resolving multiple copies of the same package
//    (e.g. two copies of react from web + mobile node_modules)
config.resolver.disableHierarchicalLookup = true;

// 4. Enable package exports resolution so Metro can resolve subpath imports like
//    "semver/functions/satisfies" (used by react-native-reanimated).
//    This is safe with metro@0.83.3 — metro-cache@0.83.3 has a complete exports map.
//    Workspace packages (@franchise/*) have no "exports" field so they fall back to "main".
config.resolver.unstable_enablePackageExports = true;

// ── NativeWind ────────────────────────────────────────────────────────────────
module.exports = withNativeWind(config, { input: "./global.css" });
