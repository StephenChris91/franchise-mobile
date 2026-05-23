"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CounsellingForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      alert("✅ Your message has been sent successfully!");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      alert(`❌ Failed to submit: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "rounded-sm border-gray-300 bg-gray-50 text-gray-900 focus-visible:ring-[#af601a]";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-2xl mx-auto text-gray-800">
        Counselling <span className="text-[#af601a]">Form</span>
      </h1>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name" className="text-gray-800">Full Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
          value={form.name}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email" className="text-gray-800">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="john@example.com"
          value={form.email}
          onChange={handleChange}
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone" className="text-gray-800">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="+234 812 345 6789"
          value={form.phone}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="subject" className="text-gray-800">Subject</Label>
        <Input
          id="subject"
          name="subject"
          placeholder="e.g. Marriage, Depression, Spiritual Growth"
          value={form.subject}
          onChange={handleChange}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="message" className="text-gray-800">Message</Label>
        <Textarea
          id="message"
          name="message"
          placeholder="What do you need counselling about? Please share in detail."
          rows={5}
          value={form.message}
          onChange={handleChange}
          required
          className={`${inputClass} resize-none`}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        variant="secondary"
        className="w-full cursor-pointer"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Submitting…
          </>
        ) : (
          "Submit Request"
        )}
      </Button>
    </form>
  );
}
