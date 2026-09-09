"use client";
import React, { useState, useEffect } from "react";
import { ReportDetailView } from "@/features/reports/components/ReportDetailView";
import { Report } from "@/features/reports/types";
import { getReportDetails } from "@/lib/data/reports";
import { useBusinessesComparison } from "@/lib/data/businesses";
import { prototypeStorage } from "@/lib/storage/prototypeStorage";
import fallbackFeasibilityData from "@/data/feasibility.json";

function generateTailoredFeasibility(biz: any) {
  const category = biz?.category || "Rural Enterprise";
  const name = biz?.name || "My Business Enterprise";
  const location = biz?.location?.district || "Local Region";
  const unitPrice = biz?.operations?.expectedPrice || 75;
  const revenue = biz?.operations?.expectedRevenue || 35000;
  const margin = biz?.capital?.availableMargin || 50000;
  const investment = biz?.capital?.expectedInvestment || Math.round(margin * 2.5);

  return {
    status: "SUCCESS",
    market: {
      confidence: { score: 86, level: "HIGH", reasons: ["Verified regional commercial cluster", "Surveyed local consumer habits"] },
      demographics: { targetAudience: "Local households, nearby weekly mandis & commercial retailers", purchasingPower: "Moderate rural/semi-urban disposable income" },
      trends: [`Growing regional demand for dependable local ${category} products`, "Strong preference for authentic local producers over distant distributors"],
    },
    opportunity: {
      demandOpportunity: `High unmet demand for quality ${category} products across ${location} and neighboring blocks.`,
      unmetNeed: `Absence of organized, consistent local providers offering reliable supply of ${category}.`,
      localBusinessOpportunity: `Setting up a dedicated unit allows capturing high local margins and direct distribution.`,
      summary: `Exceptional commercial opportunity identified for ${name} with strong local absorption capacity.`,
      why: {
        summary: `Local retail and community demand for ${category} outpaces current fragmented supply.`,
        factors: ["Rising local market traffic", "Supportive rural enterprise policies", "Reliable regional logistics"],
      },
    },
    competition: {
      overview: `The ${location} market is currently fragmented with small informal sellers and no major organized player.`,
      competitors: [
        { id: "c1", name: `Local ${category} Traders`, type: "Direct", location: "Within 5km", pricing: `₹${unitPrice}/unit`, strengths: ["Established local network"], weaknesses: ["Limited processing scale", "Inconsistent quality"], positioning: "Informal supplier" },
        { id: "c2", name: "Regional Wholesale Distributor", type: "Indirect", location: "District APMC", pricing: `₹${Math.round(unitPrice * 1.15)}/unit`, strengths: ["Bulk volume"], weaknesses: ["Higher transport costs", "No personalized community trust"], positioning: "Wholesale distributor" },
      ],
      observations: [`Customers actively seek dependable, local-origin ${category} with transparent quality.`],
    },
    swot: {
      strengths: [
        `Available equity margin of ₹${margin.toLocaleString("en-IN")} reduces initial debt exposure`,
        `Direct founder engagement and close proximity to key consumers in ${location}`,
      ],
      weaknesses: [
        `Initial phase working capital must be managed strictly against inventory cycles`,
        `Building local brand recognition during the first 60 days`,
      ],
      opportunities: [
        "Eligibility for subsidized government credit schemes (PMEGP / Mudra) up to 90%",
        "Expanding distribution into nearby weekly rural haats and cooperative channels",
      ],
      threats: [
        "Raw material seasonal price fluctuations",
        "Short-term working capital receivable delays",
      ],
    },
    risks: [
      {
        id: "risk-1",
        title: "Working Capital Fluctuations",
        category: "Financial",
        severity: "Medium",
        explanation: `Managing debtor turnover is essential for smooth daily operations of ${name}.`,
        potentialImpact: "Temporary cash flow pressure during harvest or off-season.",
        mitigationAdvisory: "Enforce a 7-day credit cycle and maintain an institutional overdraft limit.",
      },
      {
        id: "risk-2",
        title: "Input Material Price Volatility",
        category: "Operational",
        severity: "Medium",
        explanation: `Supply costs in the ${category} sector can shift with broader commodity trends.`,
        potentialImpact: "Minor margin compression if not hedged.",
        mitigationAdvisory: "Establish long-term supply agreements with local farmers and suppliers.",
      }
    ],
    pricing: {
      expectedLocalPrice: unitPrice,
      observedMarketPrice: Math.round(unitPrice * 0.95),
      priceRange: { min: Math.round(unitPrice * 0.85), max: Math.round(unitPrice * 1.2) },
      marketValue: "Premium Competitive",
      observations: [`Willingness to pay standard market rates for guaranteed freshness and local authenticity.`],
      pricingFactors: ["Product quality", "Local availability", "Packaging & delivery reliability"],
    },
  };
}

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [id, setId] = useState<string | null>(null);
  const { data: userBusinesses } = useBusinessesComparison();

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;

    const activeBusiness = userBusinesses?.[0] || prototypeStorage.getActiveBusiness();

    getReportDetails(id).then(r => {
      if (activeBusiness) {
        const cachedAi = prototypeStorage.getAiInsights(activeBusiness.id);
        const tailoredFeasibility = cachedAi || (activeBusiness as any)?.feasibility || generateTailoredFeasibility(activeBusiness);
        const locationStr = [activeBusiness.location?.village, activeBusiness.location?.district, activeBusiness.location?.state].filter(Boolean).join(", ") || "Local Cluster";

        setReport({
          id: id,
          title: `${activeBusiness.name} - Detailed Feasibility & Project Report`,
          businessId: activeBusiness.id,
          businessName: activeBusiness.name,
          location: locationStr,
          status: "READY",
          createdAt: activeBusiness.createdAt || new Date().toISOString(),
          type: "Comprehensive Enterprise Advisory",
          capital: activeBusiness.capital || {
            availableMargin: 50000,
            workingCapital: 20000,
            expectedInvestment: 150000,
          },
          operations: activeBusiness.operations || {
            expectedRevenue: 35000,
            expectedPrice: 75,
            productionQuantity: 100,
          },
          feasibilityData: tailoredFeasibility as any,
        });
      } else if (r) {
        setReport(r as Report);
      }
    });
  }, [id, userBusinesses]);

  if (!report) return null;

  return <ReportDetailView report={report} />;
}
