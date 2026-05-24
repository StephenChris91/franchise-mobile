import { NextRequest } from "next/server";
import { ok } from "@/lib/api/middleware";

// Bump these when releasing a new build that requires a client update.
const CURRENT_VERSION = "1.0.0";
const MINIMUM_VERSION = "1.0.0"; // clients below this version are forced to update

function parseVersion(v: string): [number, number, number] {
  const parts = v.split(".").map(Number);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

function isAtLeast(version: string, minimum: string): boolean {
  const [mj, mn, pt] = parseVersion(version);
  const [rmj, rmn, rpt] = parseVersion(minimum);
  if (mj !== rmj) return mj > rmj;
  if (mn !== rmn) return mn > rmn;
  return pt >= rpt;
}

export async function GET(req: NextRequest) {
  const clientVersion = new URL(req.url).searchParams.get("v") ?? "0.0.0";

  const isForced = !isAtLeast(clientVersion, MINIMUM_VERSION);
  const hasUpdate = !isAtLeast(clientVersion, CURRENT_VERSION);

  return ok({
    currentVersion: CURRENT_VERSION,
    minimumVersion: MINIMUM_VERSION,
    clientVersion,
    updateAvailable: hasUpdate,
    updateRequired: isForced,
    storeUrl: {
      ios: "https://apps.apple.com/app/franchise-church/id0000000000",
      android: "https://play.google.com/store/apps/details?id=com.thefranchiselagos.app",
    },
    message: isForced
      ? "A required update is available. Please update to continue using the app."
      : hasUpdate
      ? "A new version of the app is available."
      : null,
  });
}
