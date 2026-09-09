"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/features/i18n/hooks/useTranslation";
import { RoadmapTimeline } from "@/features/roadmap/components/RoadmapTimeline";
import { Roadmap, ActionItem } from "@/features/roadmap/types";
import { MapPin, Briefcase, ArrowLeft, FileText, CheckCircle2, Sparkles, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import apiClient from "@/lib/api/client";
import { useBusinessDetails } from "@/lib/data/businesses";

export default function ActionRoadmapPage() {
  const { t } = useTranslation();
  const params = useParams();
  const businessId = params.id as string;
  const { data: business } = useBusinessDetails(businessId);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  const loadRoadmap = async (forceRegenerate = false) => {
    if (forceRegenerate) {
      setIsGenerating(true);
    } else {
      setIsLoading(true);
    }

    try {
      const res: any = await apiClient.post("/ai/roadmap/generate", {
        businessId,
        forceRegenerate,
      });

      const roadmapData = res?.data?.data?.roadmap || res?.data?.roadmap;
      if (roadmapData && Array.isArray(roadmapData.actions)) {
        setRoadmap(roadmapData);
        setIsAiGenerated(true);
      }
    } catch (err) {
      console.warn("Could not fetch AI roadmap, falling back to heuristic plan:", err);
      // Fallback structured roadmap
      setRoadmap({
        id: "fallback_rm",
        businessId,
        businessName: business?.name || "Local Enterprise",
        location: [business?.location?.district, business?.location?.state].filter(Boolean).join(", ") || "Local Cluster",
        actions: [
          {
            id: "act-1",
            order: 1,
            title: "Detailed Project Report (DPR) & Subsidy Application",
            description: "Prepare project cost breakdown and file for PMEGP / MUDRA credit-linked subsidy.",
            whatToDo: "Submit online DPR via District Industries Centre (DIC) portal.",
            expectedOutcome: "Application reference number and subsidy eligibility sanction.",
            timeframe: "Weeks 1-3",
            priority: "HIGH",
            category: "FINANCE",
            status: "IN_PROGRESS",
          },
          {
            id: "act-2",
            order: 2,
            title: "Udyam Registration & Trade Permissions",
            description: "Complete statutory MSME registration and local panchayat trade clearance.",
            whatToDo: "Register on udyamregistration.gov.in using Aadhaar and PAN.",
            expectedOutcome: "Udyam Certificate for priority sector lending benefits.",
            timeframe: "Weeks 4-5",
            priority: "HIGH",
            category: "COMPLIANCE",
            status: "NOT_STARTED",
          },
          {
            id: "act-3",
            order: 3,
            title: "Machinery Sourcing & Equipment Procurement",
            description: "Procure verified machinery with 3 formal vendor quotations.",
            whatToDo: "Obtain vendor quotes matching bank disbursement terms.",
            expectedOutcome: "Delivery and installation of primary processing equipment.",
            timeframe: "Weeks 6-9",
            priority: "HIGH",
            category: "OPERATIONS",
            status: "NOT_STARTED",
          },
          {
            id: "act-4",
            order: 4,
            title: "Raw Material Buffer & Vendor Agreements",
            description: "Secure reliable raw material suppliers with 30-day minimum stock.",
            whatToDo: "Partner with local cooperative or regional suppliers for input consistency.",
            expectedOutcome: "Input supply contracts signed.",
            timeframe: "Weeks 10-11",
            priority: "MEDIUM",
            category: "SUPPLY",
            status: "NOT_STARTED",
          },
          {
            id: "act-5",
            order: 5,
            title: "Trial Run & Local Quality Validation",
            description: "Produce initial sample batch and validate with 10 community buyers.",
            whatToDo: "Calibrate equipment settings and packaging presentation.",
            expectedOutcome: "Approved quality benchmark for retail launch.",
            timeframe: "Weeks 12-13",
            priority: "MEDIUM",
            category: "OPERATIONS",
            status: "NOT_STARTED",
          },
          {
            id: "act-6",
            order: 6,
            title: "Commercial Launch & Local Retail Distribution",
            description: "Launch direct retail sales across local market counters.",
            whatToDo: "Begin cash-and-carry distribution with local shopkeepers.",
            expectedOutcome: "First monthly recurring revenue stream.",
            timeframe: "Week 14+",
            priority: "HIGH",
            category: "MARKET",
            status: "NOT_STARTED",
          },
        ],
      });
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      loadRoadmap(false);
    }
  }, [businessId]);

  const activeActions = roadmap?.actions || [];
  const totalActions = activeActions.length;
  const completedActions = activeActions.filter((a) => a.status === "COMPLETED").length;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  const displayBizName = business?.name || roadmap?.businessName || "My Venture Plan";
  const displayLocation = [business?.location?.village, business?.location?.district, business?.location?.state].filter(Boolean).join(", ") || roadmap?.location || "Local District";

  return (
    <div className="w-full min-h-screen bg-[#f4fce8]">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col py-8 px-6 md:px-10 lg:px-14">
        {/* Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            href={`/business/${businessId}`}
            className="inline-flex items-center gap-2 font-sans text-[14px] font-medium text-secondary-muted hover:text-secondary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("finance.backToBusiness") || "Back to Business Details"}
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadRoadmap(true)}
              disabled={isGenerating || isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E6702] hover:bg-[#164e01] text-white font-medium rounded-xl transition-all shadow-sm font-sans text-[13px] disabled:opacity-60"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Steps...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Regenerate with Gemini AI</span>
                </>
              )}
            </button>

            <Link
              href={`/reports/rep-101`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-secondary font-medium rounded-xl hover:bg-slate-50 transition-colors shadow-sm font-sans text-[13px]"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              {t("roadmap.viewReport") || "View Advisory Report"}
            </Link>
          </div>
        </div>

        {/* Header Context */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 mb-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-sans text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-700" />
                  Gemini Action Engine
                </span>
                <span className="font-sans text-[11px] font-semibold text-slate-500">
                  Tailored to your capital & statutory timeline
                </span>
              </div>
              <h1 className="font-heading text-[28px] sm:text-[32px] md:text-[36px] font-bold text-[#301608] leading-tight mb-3">
                {t("roadmap.title") || "Action Roadmap"}
              </h1>
              <p className="font-sans text-[15px] text-secondary-muted max-w-2xl leading-relaxed">
                Step-by-step milestones to take <strong className="text-slate-800">{displayBizName}</strong> from ideation through regulatory clearances, bank DPR submission, and commercial launch.
              </p>

              <div className="flex flex-wrap items-center gap-5 mt-6 font-sans text-[14px] font-medium text-secondary">
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <Briefcase className="w-4 h-4 text-[#1E6702]" />
                  <span className="font-bold text-slate-900">{displayBizName}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-500" />
                  <span className="text-slate-700">{displayLocation}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 min-w-[220px] shrink-0 shadow-inner">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span className="font-sans text-[14px] font-bold text-secondary">
                  {t("roadmap.progress") || "Milestones Complete"}
                </span>
              </div>
              <div className="font-sans text-[32px] font-bold text-[#1E6702] mb-2">
                {progressPercent}%
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#1E6702] h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="font-sans text-[12px] text-secondary-muted mt-2">
                {completedActions} of {totalActions} {t("roadmap.tasksCompleted") || "tasks completed"}
              </p>
            </div>
          </div>
        </div>

        {/* Timeline view */}
        {isLoading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-[#1E6702] border-t-transparent rounded-full animate-spin" />
            <p className="font-sans text-sm text-slate-500 font-medium">Generating your custom roadmap...</p>
          </div>
        ) : (
          <RoadmapTimeline actions={activeActions} />
        )}
      </div>
    </div>
  );
}
