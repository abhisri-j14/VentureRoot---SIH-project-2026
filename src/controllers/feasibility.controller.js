import {
  getFeasibilityContext,
  generateFeasibility,
} from "@/services/feasibility.service";


export async function getFeasibilityController(
  user,
  businessId
) {
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

  return {
    message:
      "Feasibility generated successfully",

    data: {
      feasibility,
    },
  };
}