"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";

export default function NavbarAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") return <div className="w-8 h-8" />;

  if (!session) {
    return (
      <div className="flex items-center gap-3">
        <Link
          href="/auth/login"
          className="text-sm text-white/70 hover:text-white transition"
        >
          Sign in
        </Link>
        <Link
          href="/auth/signup"
          className="text-sm px-4 py-2 rounded-lg bg-[#af601a] text-white font-medium hover:bg-[#c47020] transition"
        >
          Join
        </Link>
      </div>
    );
  }

  const user = session.user;
  const initials = user.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "ME";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 py-1.5 px-3 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt={user.name ?? ""} className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#af601a]/30 flex items-center justify-center text-[10px] font-bold text-[#af601a]">
            {initials}
          </div>
        )}
        <span className="text-xs text-white/70 hidden sm:block max-w-[100px] truncate">
          {user.name ?? user.email}
        </span>
        <ChevronDown size={12} className="text-white/40" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-[#252525] border border-white/10 rounded-xl shadow-xl py-1 z-50">
          <div className="px-4 py-2 border-b border-white/10 mb-1">
            <p className="text-xs font-medium text-white truncate">{user.name}</p>
            <p className="text-xs text-white/40 truncate">{user.email}</p>
          </div>
          <MenuLink href="/profile" icon={<User size={14} />} onClick={() => setOpen(false)}>
            My profile
          </MenuLink>
          {(user as any).approvalStatus === "approved" && (
            <MenuLink href="/social" icon={<Settings size={14} />} onClick={() => setOpen(false)}>
              Community
            </MenuLink>
          )}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 px-4 py-2 text-sm text-white/70 hover:text-white hover:bg-white/5 transition"
    >
      {icon}
      {children}
    </Link>
  );
}
