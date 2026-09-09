"use client";
import { useState, useEffect, useCallback } from "react";
import { DATA_SOURCE } from "./source";
import reportsData from "@/data/reports.json";
import { reportApi } from "@/features/reports/api/reportApi";
import { prototypeStorage } from "@/lib/storage/prototypeStorage";

function buildUserReport(biz: any) {
  if (!biz) return null;
  const cachedAi = prototypeStorage.getAiInsights(biz.id);
  const locationStr = [biz.location?.village, biz.location?.district, biz.location?.state].filter(Boolean).join(", ") || "Local Cluster";

  return {
    id: `rep-${biz.id}`,
    title: `${biz.name} - Detailed Feasibility & Project Report`,
    businessId: biz.id,
    businessName: biz.name,
    location: locationStr,
    status: "READY",
    createdAt: biz.createdAt || new Date().toISOString(),
    type: "Comprehensive Enterprise Advisory",
    capital: biz.capital || {
      availableMargin: 50000,
      workingCapital: 20000,
      expectedInvestment: 150000,
    },
    operations: biz.operations || {
      expectedRevenue: 35000,
      expectedPrice: 75,
      productionQuantity: 100,
    },
    feasibilityData: cachedAi || (biz as any).feasibility || null,
  };
}

export const useReports = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadReports = useCallback(() => {
    const activeBiz = prototypeStorage.getActiveBusiness() || prototypeStorage.getBusinesses()[0];
    const userReport = buildUserReport(activeBiz);

    const baseList = reportsData || [];
    if (userReport) {
      // Remove any duplicate matching ID and place active user's report at the top
      const filtered = baseList.filter((r) => r.id !== userReport.id && r.businessId !== activeBiz.id);
      setData([userReport, ...filtered]);
    } else {
      setData(baseList);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadReports();

    if (typeof window !== "undefined") {
      const handleUpdate = () => loadReports();
      window.addEventListener("ventureroot_business_updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      return () => {
        window.removeEventListener("ventureroot_business_updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  }, [loadReports]);

  return { data, isLoading, error, refresh: loadReports };
};

export const useReportDetails = (id: string) => {
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    getReportDetails(id)
      .then((report) => {
        setData(report);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err);
        setIsLoading(false);
      });
  }, [id]);

  return { data, isLoading, error };
};

export const getReportDetails = async (id: string): Promise<any | null> => {
  const activeBiz = prototypeStorage.getActiveBusiness() || prototypeStorage.getBusinesses()[0];
  const userReport = buildUserReport(activeBiz);

  // If requested ID matches active business or starts with rep-activeBiz
  if (userReport && (id === userReport.id || id === activeBiz?.id || id === `rep-${activeBiz?.id}`)) {
    return userReport;
  }

  // If looking for a static report ID
  const found = reportsData.find((r) => r.id === id);
  if (found) {
    // If active user business exists, dynamically enrich the report with active business identity
    if (activeBiz) {
      return {
        ...found,
        title: `${activeBiz.name} - Detailed Feasibility & Project Report`,
        businessName: activeBiz.name,
        businessId: activeBiz.id,
        location: [activeBiz.location?.district, activeBiz.location?.state].filter(Boolean).join(", ") || found.location,
        capital: activeBiz.capital,
        operations: activeBiz.operations,
        feasibilityData: userReport?.feasibilityData || (activeBiz as any).feasibility || found.feasibilityData,
      };
    }
    return found;
  }

  // Fallback to active user's report
  if (userReport) {
    return userReport;
  }

  return reportsData[0] || null;
};
