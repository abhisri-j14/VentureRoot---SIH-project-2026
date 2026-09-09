"use client";
import React, { useState, useEffect } from "react";
import { ReportDetailView } from "@/features/reports/components/ReportDetailView";
import { Report } from "@/features/reports/types";
import { getReportDetails } from "@/lib/data/reports";
import { useBusinessesComparison } from "@/lib/data/businesses";
import fallbackFeasibilityData from "@/data/feasibility.json";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [id, setId] = useState<string | null>(null);
  const { data: userBusinesses } = useBusinessesComparison();
  const activeBusiness = userBusinesses?.[0];

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) {
      getReportDetails(id).then(r => {
        if (r) {
          const enriched = { ...r };
          if (activeBusiness?.name && (!enriched.businessName || enriched.businessName.includes("Green Valley"))) {
            enriched.businessName = activeBusiness.name;
            enriched.title = `${activeBusiness.name} Comprehensive Advisory Report`;
          }
          if (!enriched.feasibilityData) {
            enriched.feasibilityData = (activeBusiness as any)?.feasibility || fallbackFeasibilityData;
          }
          setReport(enriched as Report);
        } else {
          const bizName = activeBusiness?.name || "Rural Enterprise";
          const bizId = activeBusiness?.id || "biz_101";
          setReport({
            id: id,
            title: `${bizName} Feasibility & Enterprise Advisory Report`,
            businessId: bizId,
            businessName: bizName,
            location: [activeBusiness?.location?.district, activeBusiness?.location?.state].filter(Boolean).join(", ") || "Local Cluster",
            status: "READY",
            createdAt: new Date().toISOString(),
            type: "Comprehensive Advisory",
            feasibilityData: ((activeBusiness as any)?.feasibility || fallbackFeasibilityData) as any,
          });
        }
      });
    }
  }, [id, activeBusiness]);

  if (!report) return null;

  return <ReportDetailView report={report} />;
}
