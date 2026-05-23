"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { forgotPasswordAction } from "@/lib/actions/auth";
import { Loader2, CheckCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await forgotPasswordAction(data.email);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#af601a]/20 mb-6">
          <CheckCircle className="text-[#af601a]" size={32} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Check your inbox</h1>
        <p className="text-white/60 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
          If that email is registered, we&apos;ve sent a password reset link. Check your
          spam folder if you don&apos;t see it.
        </p>
        <Link
          href="/auth/login"
          className="text-[#af601a] text-sm hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Forgot password</h1>
      <p className="text-white/50 text-sm mb-8">
        Enter your email and we&apos;ll send a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/70 font-medium">Email address</label>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={`w-full px-3 py-3 rounded-lg bg-white/5 border ${
              errors.email ? "border-red-500/60" : "border-white/10"
            } text-white placeholder-white/25 text-sm focus:outline-none focus:border-[#af601a] transition`}
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 py-3 rounded-lg bg-[#af601a] text-white font-bold text-sm hover:bg-[#c47020] active:scale-[.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="mt-6 text-center">
        <Link href="/auth/login" className="text-sm text-white/40 hover:text-white/60">
          Back to login
        </Link>
      </p>
    </div>
  );
}
