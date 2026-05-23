/**
 * next-auth v5 beta handler for Next.js 15 App Router.
 * The explicit wrapper is needed because next-auth's `AppRouteHandlers`
 * type does not include the context parameter that Next.js 15 passes to
 * route handlers with dynamic segments, causing a generated-type mismatch.
 */
import { handlers } from "../../../../../auth";
import type { NextRequest } from "next/server";

export const GET = (req: NextRequest) => handlers.GET(req);
export const POST = (req: NextRequest) => handlers.POST(req);
