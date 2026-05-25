/**
 * Shared helpers for the Live Services feature.
 * WAT = UTC+1 (West Africa Time, Lagos).
 */

export const WAT_OFFSET_MS = 60 * 60 * 1000; // UTC+1

/**
 * Given a day-of-week (0=Sun…6=Sat) and time string "HH:MM" in WAT,
 * returns the next UTC Date when that service will occur.
 */
export function nextOccurrence(dayOfWeek: number, scheduledTime: string): Date {
  const [hh, mm] = scheduledTime.split(":").map(Number);
  const now = new Date();
  const nowWAT = new Date(now.getTime() + WAT_OFFSET_MS);

  // Find days until the next occurrence of dayOfWeek
  const currentDay = nowWAT.getUTCDay();
  let daysAhead = (dayOfWeek - currentDay + 7) % 7;

  // If today is the day, check if the time has already passed
  if (daysAhead === 0) {
    const serviceMinutes = hh * 60 + mm;
    const nowMinutes = nowWAT.getUTCHours() * 60 + nowWAT.getUTCMinutes();
    if (nowMinutes >= serviceMinutes) daysAhead = 7; // already past today → next week
  }

  const nextWAT = new Date(
    Date.UTC(
      nowWAT.getUTCFullYear(),
      nowWAT.getUTCMonth(),
      nowWAT.getUTCDate() + daysAhead,
      hh,
      mm,
      0,
      0
    )
  );
  // Convert WAT→UTC by subtracting the offset
  return new Date(nextWAT.getTime() - WAT_OFFSET_MS);
}

/**
 * Returns true if right now falls within a service window
 * (from scheduled_time to scheduled_time + duration_mins) in WAT.
 */
export function isServiceWindow(dayOfWeek: number, scheduledTime: string, durationMins: number): boolean {
  const [hh, mm] = scheduledTime.split(":").map(Number);
  const now = new Date();
  const nowWAT = new Date(now.getTime() + WAT_OFFSET_MS);
  if (nowWAT.getUTCDay() !== dayOfWeek) return false;

  const startMinutes = hh * 60 + mm;
  const endMinutes = startMinutes + durationMins;
  const nowMinutes = nowWAT.getUTCHours() * 60 + nowWAT.getUTCMinutes();
  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
}

/**
 * Returns true if we're within the prayer join window (10 min before → end).
 */
export function isPrayerJoinable(scheduledTime: string, durationMins: number): boolean {
  const [hh, mm] = scheduledTime.split(":").map(Number);
  const now = new Date();
  const nowWAT = new Date(now.getTime() + WAT_OFFSET_MS);
  const startMinutes = hh * 60 + mm;
  const endMinutes = startMinutes + durationMins;
  const nowMinutes = nowWAT.getUTCHours() * 60 + nowWAT.getUTCMinutes();
  return nowMinutes >= startMinutes - 10 && nowMinutes <= endMinutes;
}
