import {
  findBusinessByIdAndUserId,
} from "@/repositories/business.repository";

import {
  findProfileByUserId,
} from "@/repositories/profile.repository";

import {
  findLocationWithParents,
} from "@/repositories/location.repository";

import {
  buildLocationResponse,
} from "@/utils/location.mapper";

import { userDb, businessDb } from "@/lib/server/jsonDb";

export async function loadFeasibilityData({
  userId,
  businessId,
  clientBusiness,
  clientProfile,
}) {
  let business = null;
  let profile = null;

  // 1. Check client-provided payload first
  if (clientBusiness) {
    business = clientBusiness;
  }
  if (clientProfile) {
    profile = clientProfile;
  }

  // 2. Query JSON Prototype DB
  if (!business && businessId) {
    const jsonBiz = businessDb.getBusinessById(businessId);
    if (jsonBiz) {
      business = {
        id: jsonBiz.id,
        name: jsonBiz.name || jsonBiz.businessName || "My Rural Enterprise",
        description: jsonBiz.description || "Micro-enterprise operations.",
        category: jsonBiz.category,
        subcategory: jsonBiz.subcategory || "",
        location: jsonBiz.location || { state: "Uttar Pradesh", district: "Varanasi" },
        availableMargin: Number(jsonBiz.capital?.availableMargin || 50000),
        expectedInvestment: Number(jsonBiz.capital?.expectedInvestment || 250000),
        workingCapital: Number(jsonBiz.capital?.workingCapital || 25000),
        expectedRevenue: Number(jsonBiz.operations?.expectedRevenue || 30000),
        expectedPrice: Number(jsonBiz.operations?.expectedPrice || 75),
        productionQuantity: Number(jsonBiz.operations?.productionQuantity || 100),
        existingResources: jsonBiz.resources?.existingResources || "Utilities & premises",
        status: jsonBiz.status || "Ready",
      };
    }
  }

  // If still no business and user exists, fetch user's first business
  if (!business && userId) {
    const userBizList = businessDb.getBusinessesByUserId(userId);
    if (userBizList && userBizList.length > 0) {
      const jsonBiz = userBizList[0];
      business = {
        id: jsonBiz.id,
        name: jsonBiz.name || jsonBiz.businessName || "My Rural Enterprise",
        description: jsonBiz.description || "Micro-enterprise operations.",
        category: jsonBiz.category,
        subcategory: jsonBiz.subcategory || "",
        location: jsonBiz.location || { state: "Uttar Pradesh", district: "Varanasi" },
        availableMargin: Number(jsonBiz.capital?.availableMargin || 50000),
        expectedInvestment: Number(jsonBiz.capital?.expectedInvestment || 250000),
        workingCapital: Number(jsonBiz.capital?.workingCapital || 25000),
        expectedRevenue: Number(jsonBiz.operations?.expectedRevenue || 30000),
        expectedPrice: Number(jsonBiz.operations?.expectedPrice || 75),
        productionQuantity: Number(jsonBiz.operations?.productionQuantity || 100),
        existingResources: jsonBiz.resources?.existingResources || "Utilities & premises",
        status: jsonBiz.status || "Ready",
      };
    }
  }

  // 3. Query JSON Profile
  if (!profile && userId) {
    const user = userDb.findUserById(userId);
    if (user) {
      profile = {
        fullName: user.name || user.profile?.fullName || "Entrepreneur",
        availableCapital: Number(user.profile?.financial?.availableCapital || 100000),
        income: Number(user.profile?.financial?.income || 20000),
        businessExperience: user.profile?.experience?.businessExperience || "1-3 years",
        skills: user.profile?.experience?.skills || ["Local Enterprise"],
        education: user.profile?.experience?.education || "Secondary",
      };
    }
  }

  // Default fallback if brand new visitor with no account
  const resolvedBusiness = business || {
    id: businessId || "biz_new",
    name: "Proposed Micro-Enterprise",
    description: "Rural enterprise plan.",
    category: "General Enterprise",
    subcategory: "Local Services",
    location: { state: "Uttar Pradesh", district: "Varanasi" },
    availableMargin: 50000,
    expectedInvestment: 250000,
    workingCapital: 25000,
    expectedRevenue: 30000,
    expectedPrice: 75,
    productionQuantity: 100,
    existingResources: "Local premises & power connection",
    status: "Ready",
  };

  const resolvedProfile = profile || {
    fullName: "Entrepreneur",
    availableCapital: 50000,
    income: 20000,
    businessExperience: "1-2 years",
    skills: ["General Enterprise"],
    education: "Secondary",
  };

  return {
    business: resolvedBusiness,
    profile: resolvedProfile,
  };
}
