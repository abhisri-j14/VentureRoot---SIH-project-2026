import { FeasibilityData } from "@/features/feasibility/types";

export type ReportStatus = "IDLE" | "GENERATING" | "READY" | "FAILED" | "DRAFT";

export interface ReportStage {
  id: string;
  label: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ERROR";
}

export interface Report {
  id: string;
  title: string;
  businessId: string;
  businessName: string;
  location?: string;
  status: ReportStatus;
  createdAt: string;
  type: string;
  
  // Dynamic business financial parameters
  capital?: {
    availableMargin: number;
    workingCapital?: number;
    expectedInvestment: number;
  };
  operations?: {
    expectedRevenue: number;
    expectedPrice?: number;
    productionQuantity?: number;
  };

  // Feasibility dataset
  feasibilityData?: FeasibilityData;
}
