"use client";

import React, { useState } from "react";
import { ChatWindow } from "@/features/advisor/components/ChatWindow";
import { Sparkles } from "lucide-react";

export default function AdvisorPage() {
  const [activePrompt, setActivePrompt] = useState<string | null>(null);

  const prompts = [
    "Should I start this business here in my village?",
    "What are my biggest local risks and mitigation steps?",
    "How can I improve my market reach and customer base?",
    "Which government subsidy scheme (PMEGP, MUDRA) suits me best?",
  ];

  return (
    <div className="w-full h-full p-4 md:p-6 lg:p-8 flex flex-col gap-6 pb-8">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-[22px] font-bold text-[#242424] tracking-tight leading-tight">
            VentureRoot AI Advisor
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-[#1E6702]/10 text-[#1E6702] px-2.5 py-1 rounded-full">
            <Sparkles className="w-3 h-3" /> Gemini 2.5 Flash
          </span>
        </div>
        <p className="font-sans text-[14px] text-slate-500 font-medium mt-0.5">
          Ask about your business viability, local market competition, financing options, or next steps.
        </p>
      </div>

      <div className="hidden md:flex gap-3 overflow-x-auto pb-2">
        {prompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => setActivePrompt(prompt)}
            className="whitespace-nowrap px-4 py-2 rounded-full border border-slate-200 bg-white font-sans text-[14px] font-medium text-secondary-muted hover:border-[#1E6702] hover:text-[#1E6702] hover:bg-[#1E6702]/10 transition-colors shadow-xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <ChatWindow
          externalPrompt={activePrompt}
          onClearPrompt={() => setActivePrompt(null)}
        />
      </div>
    </div>
  );
}
