"use client";

import React, { useMemo, useEffect, useState } from "react";

export default function SermonFilters({ allSermons, onFilter }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategories, setActiveCategories] = useState([]);

  // Extract unique categories
  const uniqueCategories = useMemo(() => {
    const allCategories = allSermons.flatMap((s) => s.categories || []);
    return [...new Set(allCategories.map((c) => c.toLowerCase()))];
  }, [allSermons]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleCategory = (category) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  useEffect(() => {
    const filtered = allSermons.filter((sermon) => {
      const matchesTitle = sermon.title
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesCategory =
        activeCategories.length === 0 ||
        sermon.categories?.some((c) =>
          activeCategories.includes(c.toLowerCase())
        );

      return matchesTitle && matchesCategory;
    });

    onFilter(filtered);
  }, [searchTerm, activeCategories, allSermons, onFilter]);

  return (
    <div className="w-full flex flex-col items-center text-center mb-10">
      {/* WATCH tag */}
      <div className="mb-2">
        <span className="px-4 py-1 text-[#af601a] rounded-full bg-gray-100 text-xs font-medium tracking-widest">
          🔵 WATCH
        </span>
      </div>

      {/* Headline */}
      <h2 className="text-3xl sm:text-4xl font-normal tracking-wide mb-2 text-gray-800">
        Latest Sermons
      </h2>

      {/* Subtitle */}
      <p className="text-gray-500 text-sm sm:text-base mb-6">
        Weekly sermons for your progress and joy in the faith
      </p>

      {/* Search Input */}
      <div className="relative w-full max-w-xl mb-6">
        <input
          type="text"
          placeholder="Search by title"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-6 py-3 rounded-full border border-gray-300 focus:ring focus:ring-gold text-sm placeholder:text-gray-400"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-12 top-1/2 -translate-y-1/2 text-black text-sm font-bold"
          >
            &times;
          </button>
        )}
        <span className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm shadow">
          &gt;
        </span>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap justify-center gap-2">
        {uniqueCategories.map((cat) => {
          const isActive = activeCategories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm border transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? "bg-[#af601a] text-gray-800 border-[#af601a]"
                  : "bg-white text-black border-gray-300 hover:border-gold"
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
