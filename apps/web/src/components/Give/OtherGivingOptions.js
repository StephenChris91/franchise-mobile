"use client";

import React from "react";
import { HiClipboardCopy } from "react-icons/hi";

const OtherGivingOptions = () => {
  const otherAccounts = [
    {
      bank: "Stanbic",
      accountNumber: "0064035065",
    },
    {
      bank: "Moniepoint",
      accountNumber: "4664390779",
    },
  ];

  return (
    <section className="py-12 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
        {/* 🇳🇬 Other Nigerian Accounts */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Other Accounts 🇳🇬
          </h3>
          <ul className="space-y-4">
            {otherAccounts.map((acc, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-4 py-3 border rounded-md bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {acc.bank}
                  </p>
                  <p className="text-sm text-gray-800">{acc.accountNumber}</p>
                </div>
                <button
                  className="text-gray-500 hover:text-black cursor-pointer"
                  onClick={() =>
                    navigator.clipboard.writeText(acc.accountNumber)
                  }
                  title="Copy Account Number"
                >
                  <HiClipboardCopy className="text-xl" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 🌍 PayPal Section */}
        <div className="bg-white p-6 rounded-lg shadow flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Give via PayPal 🌍
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Give securely from anywhere in the world using PayPal balance,
              credit/debit cards, or bank accounts.
            </p>
          </div>
          <button
            onClick={() => window.open("https://paypal.com", "_blank")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 px-6 rounded-md mt-auto cursor-pointer transition"
          >
            GIVE NOW →
          </button>
        </div>
      </div>
    </section>
  );
};

export default OtherGivingOptions;
