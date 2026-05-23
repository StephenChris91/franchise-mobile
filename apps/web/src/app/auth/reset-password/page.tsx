"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/lib/actions/auth";
import { Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Suspense } from "react";

const schema = z
  .object({
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    const result = await resetPasswordAction({ ...data, token });
    if (result?.error) {
      setServerError(result.error);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 text-sm mb-4">Invalid or missing reset token.</p>
        <Link href="/auth/forgot-password" className="text-[#af601a] hover:underline text-sm">
          Request a new link
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#af601a]/20 mb-6">
          <CheckCircle className="text-[#af601a]" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Password updated</h1>
        <p className="text-white/60 text-sm">Redirecting you to login…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Set new password</h1>
      <p className="text-white/50 text-sm mb-8">Choose a strong password for your account.</p>

      {serverError && (
        <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/70 font-medium">New password</label>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              className={`w-full px-3 py-3 rounded-lg bg-white/5 border ${errors.password ? "border-red-500/60" : "border-white/10"} text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#af601a] transition pr-10`}
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60" tabIndex={-1}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/70 font-medium">Confirm new password</label>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              autoComplete="new-password"
              className={`w-full px-3 py-3 rounded-lg bg-white/5 border ${errors.confirmPassword ? "border-red-500/60" : "border-white/10"} text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#af601a] transition pr-10`}
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60" tabIndex={-1}>
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 rounded-lg bg-[#af601a] text-white font-bold text-sm hover:bg-[#c47020] active:scale-[.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
