"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "@/lib/actions/auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const schema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    username: z
      .string()
      .min(3, "At least 3 characters")
      .max(30, "At most 30 characters")
      .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, hyphens only"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError("");
    const result = await signupAction(data);
    if (result?.error) {
      setServerError(result.error);
    } else {
      router.push("/auth/pending");
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
      <p className="text-white/50 text-sm mb-8">
        Already have one?{" "}
        <Link href="/auth/login" className="text-[#af601a] hover:underline">
          Sign in
        </Link>
      </p>

      {serverError && (
        <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-500/40 rounded-lg text-red-300 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" error={errors.fullName?.message}>
          <input
            {...register("fullName")}
            placeholder="Ada Okonkwo"
            className={inputClass(!!errors.fullName)}
            autoComplete="name"
          />
        </Field>

        <Field label="Username" error={errors.username?.message}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm select-none">@</span>
            <input
              {...register("username")}
              placeholder="adaokonkwo"
              className={`${inputClass(!!errors.username)} pl-7`}
              autoComplete="username"
            />
          </div>
        </Field>

        <Field label="Email address" error={errors.email?.message}>
          <input
            {...register("email")}
            type="email"
            placeholder="you@example.com"
            className={inputClass(!!errors.email)}
            autoComplete="email"
          />
        </Field>

        <Field label="Password" error={errors.password?.message}>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              className={`${inputClass(!!errors.password)} pr-10`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm password" error={errors.confirmPassword?.message}>
          <div className="relative">
            <input
              {...register("confirmPassword")}
              type={showConfirm ? "text" : "password"}
              placeholder="Repeat your password"
              className={`${inputClass(!!errors.confirmPassword)} pr-10`}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-6 py-3 rounded-lg bg-[#af601a] text-white font-bold text-sm hover:bg-[#c47020] active:scale-[.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 size={16} className="animate-spin" />}
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-xs text-white/30 text-center">
        By signing up you agree to our{" "}
        <Link href="/pages/counselling" className="underline">
          community guidelines
        </Link>
        .
      </p>
    </div>
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
