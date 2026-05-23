-- Migration: Add sermons table (replacing Supabase)
-- Phase M1: Supabase removal — sermons metadata now lives in Neon

CREATE TABLE IF NOT EXISTS "sermons" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"speaker" text NOT NULL DEFAULT '',
	"date" text NOT NULL,
	"duration" integer NOT NULL DEFAULT 0,
	"audio_url" text NOT NULL,
	"thumbnail" text NOT NULL DEFAULT '/assets/sermon-fallback.jpg',
	"categories" jsonb NOT NULL DEFAULT '[]',
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "sermons_date_idx" ON "sermons" USING btree ("date");
