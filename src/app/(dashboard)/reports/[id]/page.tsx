"use client";
import React, { useState, useEffect } from "react";
import { ReportDetailView } from "@/features/reports/components/ReportDetailView";
import { Report } from "@/features/reports/types";
import { notFound } from "next/navigation";
import { getReportDetails } from "@/lib/data/reports";
import fallbackFeasibilityData from "@/data/feasibility.json";

export default function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [report, setReport] = useState<Report | null>(null);
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (id) {
      getReportDetails(id).then(r => {
        if (r) {
          const enriched = { ...r };
          if (!enriched.feasibilityData) {
            enriched.feasibilityData = fallbackFeasibilityData;
          }
          setReport(enriched as Report);
        } else {
           setReport({
             id: id,
             title: "Green Valley Enterprise Advisory Report",
             businessId: "123",
             businessName: "Green Valley Dairy",
             status: "READY",
             createdAt: new Date().toISOString(),
             type: "Comprehensive Advisory",
             feasibilityData: fallbackFeasibilityData as any,
           });
        }
      });
    }
  }, [id]);

  if (!report) return null;

  return <ReportDetailView report={report} />;
}
