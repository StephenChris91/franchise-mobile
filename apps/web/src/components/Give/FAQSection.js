"use client";

import React, { useState } from "react";
import { X, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const faqs = [
  {
    question: "How is my donation used?",
    answer:
      "Your donation fuels the mission of The Franchise Church to spread the gospel and make disciples across the world. Every contribution supports ministry programs, church operations, outreach efforts, and special initiatives designed to bring transformation and lasting impact to individuals and communities.",
  },
  {
    question: "Can I choose where my donation goes?",
    answer:
      "Yes! On the Give page, you can specify the purpose of your donation — including rent, building, missions, or tithes.",
  },
  {
    question: "Are there other ways to give besides online?",
    answer:
      "Absolutely. You can give through bank transfers, USSD, cash envelopes at services.",
  },
  {
    question: "Is my payment information secured?",
    answer:
      "We use encrypted payment channels and never store your card details. Your information is safe and handled with care.",
  },
  {
    question: "Can I give to support a specific project or initiative?",
    answer:
      "Yes, simply select the appropriate category while giving, or reach out to our admin team for directed giving.",
  },
  {
    question: "Who do I contact with my questions?",
    answer: "You can contact our admin team through the contact form",
  },
];

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="bg-neutral-900 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">
          FAQs
        </h2>

        <div className="divide-y divide-white/10">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                layout
                initial={false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex justify-between items-start py-6 cursor-pointer"
                >
                  <div className="flex gap-4 items-start text-left">
                    <span className="text-4xl md:text-5xl font-extrabold text-white/10 leading-none mt-1">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <div className="text-white mt-1 cursor-pointer">
                    {isOpen ? (
                      <X className="w-6 h-6" />
                    ) : (
                      <Plus className="w-6 h-6" />
                    )}
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="faq-content"
                      layout
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden pb-6 text-base text-white/90 px-4 md:pl-20"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
