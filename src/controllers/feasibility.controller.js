import {
  getFeasibilityContext,
  generateFeasibility,
} from "@/services/feasibility.service";

import { businessDb } from "@/lib/server/jsonDb";

export async function getFeasibilityController(
  user,
  businessId
) {
  // Check if already stored in JSON DB
  const existingBiz = businessDb.getBusinessById(businessId);
  if (existingBiz?.feasibility) {
    return {
      message: "Feasibility context fetched successfully",
      data: {
        feasibility: existingBiz.feasibility,
      },
    };
  }

  const feasibility =
    await getFeasibilityContext({
      userId: user.id,
      businessId,
    });

  return {
    message:
      "Feasibility context fetched successfully",

    data: {
      feasibility,
    },
  };
}


export async function generateFeasibilityController(
  user,
  businessId,
  payload = {}
) {
  const feasibility =
    await generateFeasibility({
      userId: user.id,
      businessId,
      clientBusiness: payload.business,
      clientProfile: payload.profile,
    });

  // Persist into user's business record in JSON DB
  if (businessId && feasibility) {
    try {
      await businessDb.saveFeasibility(businessId, feasibility);
    } catch (e) {
      console.warn("Could not persist feasibility to JSON DB:", e?.message);
    }
  }

  return {
    message:
      "Feasibility generated successfully",

    data: {
      feasibility,
    },
  };
}
