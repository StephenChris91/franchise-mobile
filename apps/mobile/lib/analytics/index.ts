/**
 * Lightweight analytics abstraction.
 * Logs events in dev, ready to forward to PostHog / Amplitude in production.
 *
 * Usage:
 *   analytics.track("post_created", { postType: "prayer" });
 *   analytics.screen("EventDetail", { slug: "christmas-service" });
 */

const IS_DEV = process.env.NODE_ENV !== "production";

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
}

function log(type: string, name: string, props?: Record<string, unknown>) {
  if (IS_DEV) {
    console.log(`[analytics:${type}]`, name, props ?? "");
  }
  // TODO: forward to PostHog / Amplitude in production
  // Example:
  // if (!IS_DEV) {
  //   posthog.capture(name, props);
  // }
}

export const analytics = {
  /** Track a user action or event */
  track(name: string, properties?: Record<string, unknown>) {
    log("event", name, properties);
  },

  /** Track a screen view */
  screen(screenName: string, properties?: Record<string, unknown>) {
    log("screen", screenName, properties);
  },

  /** Identify the current user (call after login) */
  identify(userId: string, traits?: Record<string, unknown>) {
    log("identify", userId, traits);
  },

  /** Reset identity (call on logout) */
  reset() {
    log("reset", "logout");
  },
};
