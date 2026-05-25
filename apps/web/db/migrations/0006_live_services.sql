-- Migration: Phase M4.5 — Live Services
-- Tables: livestreams, live_chat_messages, service_reminders, prayer_commitments

-- Enums
CREATE TYPE "service_type" AS ENUM ('sunday_youtube', 'wednesday_youtube', 'friday_zoom');
CREATE TYPE "live_platform" AS ENUM ('youtube', 'zoom');
CREATE TYPE "livestream_status" AS ENUM ('scheduled', 'live', 'ended');
CREATE TYPE "chat_reaction_type" AS ENUM ('amen', 'praying', 'love', 'fire', 'receiving');

-- Livestreams (recurring schedule entries)
CREATE TABLE IF NOT EXISTS "livestreams" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "service_type" "service_type" NOT NULL,
  "platform" "live_platform" NOT NULL,
  "youtube_channel_id" text,
  "youtube_video_id" text,
  "zoom_meeting_id" text,
  "zoom_passcode" text,
  "day_of_week" integer NOT NULL,
  "scheduled_time" text NOT NULL,
  "duration_mins" integer DEFAULT 90 NOT NULL,
  "status" "livestream_status" DEFAULT 'scheduled' NOT NULL,
  "started_at" timestamp,
  "ended_at" timestamp,
  "replay_url" text,
  "prayer_focus" text,
  "prayer_verse" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "livestreams_service_type_idx" ON "livestreams" ("service_type");

-- Live chat messages
CREATE TABLE IF NOT EXISTS "live_chat_messages" (
  "id" text PRIMARY KEY NOT NULL,
  "livestream_id" text NOT NULL REFERENCES "livestreams"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "reaction_type" "chat_reaction_type",
  "is_pinned" boolean DEFAULT false NOT NULL,
  "is_hidden" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "live_chat_livestream_idx" ON "live_chat_messages" ("livestream_id");
CREATE INDEX IF NOT EXISTS "live_chat_created_idx" ON "live_chat_messages" ("created_at");

-- Service reminders (per user, per service type)
CREATE TABLE IF NOT EXISTS "service_reminders" (
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "service_type" "service_type" NOT NULL,
  "minutes_before" integer DEFAULT 15 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  PRIMARY KEY ("user_id", "service_type")
);
CREATE INDEX IF NOT EXISTS "service_reminders_user_idx" ON "service_reminders" ("user_id");

-- Prayer commitments (who's joining Friday prayer)
CREATE TABLE IF NOT EXISTS "prayer_commitments" (
  "livestream_id" text NOT NULL REFERENCES "livestreams"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "committed_at" timestamp DEFAULT now() NOT NULL,
  PRIMARY KEY ("livestream_id", "user_id")
);
CREATE INDEX IF NOT EXISTS "prayer_commitments_livestream_idx" ON "prayer_commitments" ("livestream_id");
