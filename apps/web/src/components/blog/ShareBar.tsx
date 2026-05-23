"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { BsWhatsapp, BsTwitterX, BsFacebook } from "react-icons/bs";

interface ShareBarProps {
  title: string;
  url: string;
}

export default function ShareBar({ title, url }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(title + " " + url)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  const handleShare = async () => {
    // Web Share API on mobile — falls back to WhatsApp
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or not supported — do nothing
      }
    }
    // Fallback: open WhatsApp
    window.open(whatsappUrl, "_blank", "noopener");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Share this post
      </p>

      <div className="flex flex-wrap items-center gap-3">
        {/* WhatsApp — primary, large */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#20bd5a] transition-colors min-h-[44px]"
          aria-label="Share on WhatsApp"
        >
          <BsWhatsapp size={18} />
          WhatsApp
        </a>

        {/* Mobile native share (hidden if Web Share API unavailable — CSS trick) */}
        <button
          onClick={handleShare}
          className="flex md:hidden items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-[#af601a] hover:text-[#af601a] transition-colors min-h-[44px]"
        >
          Share
        </button>

        {/* Twitter/X */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-lg border border-gray-200 p-2.5 text-gray-700 hover:border-black hover:text-black transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Share on X (Twitter)"
        >
          <BsTwitterX size={16} />
        </a>

        {/* Facebook */}
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center rounded-lg border border-gray-200 p-2.5 text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Share on Facebook"
        >
          <BsFacebook size={16} />
        </a>

        {/* Copy link */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-600 hover:border-[#af601a] hover:text-[#af601a] transition-colors min-h-[44px] cursor-pointer"
          aria-label="Copy link"
        >
          {copied ? (
            <>
              <Check size={14} className="text-green-500" />
              <span className="text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Link2 size={14} />
              Copy link
            </>
          )}
        </button>
      </div>
    </div>
  );
}
