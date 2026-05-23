"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { updateProfileAction } from "@/lib/actions/profile";
import { Loader2, User, Upload } from "lucide-react";
import type { Profile } from "../../../db/schema";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

const ministries = [
  { value: "none", label: "No ministry" },
  { value: "choir", label: "Choir" },
  { value: "ushers", label: "Ushers" },
  { value: "prayer_team", label: "Prayer Team" },
  { value: "media", label: "Media" },
  { value: "kids", label: "Franchise Kids" },
  { value: "youth", label: "Youth" },
  { value: "adults", label: "Adults" },
  { value: "other", label: "Other" },
] as const;

const schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  bio: z.string().max(500, "Max 500 characters").optional().nullable(),
  ministry: z.enum(["none","choir","ushers","prayer_team","media","kids","youth","adults","other"]),
  phone: z
    .string()
    .regex(/^(\+234|0)[7-9][0-1]\d{8}$/, "Enter a valid Nigerian phone number")
    .optional()
    .nullable()
    .or(z.literal("")),
  whatsappNumber: z
    .string()
    .regex(/^(\+234|0)[7-9][0-1]\d{8}$/, "Enter a valid Nigerian phone number")
    .optional()
    .nullable()
    .or(z.literal("")),
});

type FormData = z.infer<typeof schema>;

export default function ProfileEditForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl ?? "");
  const [photoPreview, setPhotoPreview] = useState(profile.photoUrl ?? "");
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: profile.fullName,
      bio: profile.bio ?? "",
      ministry: profile.ministry,
      phone: profile.phone ?? "",
      whatsappNumber: profile.whatsappNumber ?? "",
    },
  });

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_SIZE_BYTES) {
      setUploadError("Photo must be under 5 MB");
      return;
    }
    setUploadError("");
    setPhotoPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const timestamp = Math.round(Date.now() / 1000);
      const paramsToSign = {
        timestamp,
        folder: "franchise-profiles",
        transformation: "c_fill,g_face,w_400,h_400,r_max",
      };

      const signRes = await fetch("/api/profile/upload-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paramsToSign }),
      });
      const { signature, apiKey } = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", "franchise-profiles");
      formData.append("transformation", "c_fill,g_face,w_400,h_400,r_max");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: "POST", body: formData }
      );
      const uploaded = await uploadRes.json();
      setPhotoUrl(uploaded.secure_url);
    } catch {
      setUploadError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: FormData) {
    setServerError("");
    const result = await updateProfileAction({ ...data, photoUrl: photoUrl || null });
    if (result?.error) {
      setServerError(result.error);
    } else {
      router.push("/profile");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Photo upload */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative group"
          disabled={uploading}
        >
          {photoPreview ? (
            <Image
              src={photoPreview}
              alt="Profile photo"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover group-hover:opacity-80 transition"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-[#af601a] transition">
              <User size={40} className="text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/50">
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-white" />
            ) : (
              <Upload size={20} className="text-white" />
            )}
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
        <p className="text-xs text-white/30">Click to upload · Max 5 MB</p>
        {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
      </div>

      {serverError && (
        <div className="px-4 py-3 bg-red-900/40 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {serverError}
        </div>
      )}

      <Field label="Full name" error={errors.fullName?.message}>
        <input
          {...register("fullName")}
          className={inputClass(!!errors.fullName)}
          placeholder="Ada Okonkwo"
        />
      </Field>

      <Field label={`Bio (${bioLength}/500)`} error={errors.bio?.message}>
        <textarea
          {...register("bio", { onChange: (e) => setBioLength(e.target.value.length) })}
          rows={4}
          placeholder="Tell the community a bit about yourself…"
          className={`${inputClass(!!errors.bio)} resize-none`}
        />
      </Field>

      <Field label="Ministry" error={undefined}>
        <select {...register("ministry")} className={inputClass(false)}>
          {ministries.map((m) => (
            <option key={m.value} value={m.value} className="bg-[#1b1b1b]">
              {m.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Phone (optional)" error={errors.phone?.message}>
        <input
          {...register("phone")}
          className={inputClass(!!errors.phone)}
          placeholder="+2348012345678 or 08012345678"
          type="tel"
        />
      </Field>

      <Field label="WhatsApp (optional)" error={errors.whatsappNumber?.message}>
        <input
          {...register("whatsappNumber")}
          className={inputClass(!!errors.whatsappNumber)}
          placeholder="+2348012345678 or 08012345678"
          type="tel"
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting || uploading}
          className="flex-1 py-3 rounded-lg bg-[#af601a] text-white font-bold text-sm hover:bg-[#c47020] active:scale-[.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
        <Link
          href="/profile"
          className="px-5 py-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-medium hover:bg-white/10 transition flex items-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-white/70 font-medium">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-3 rounded-lg bg-white/5 border ${
    hasError ? "border-red-500/60" : "border-white/10"
  } text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#af601a] transition`;
}
