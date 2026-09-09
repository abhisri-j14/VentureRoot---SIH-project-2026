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

import usersData from "@/data/users.json";
import businessesData from "@/data/businesses.json";

function getFallbackProfile() {
  const p = usersData?.profile || {};
  return {
    fullName: p.fullName || usersData?.currentUser?.name || "Ravi Kumar",
    firstName: (p.fullName || usersData?.currentUser?.name || "Ravi").split(" ")[0],
    email: p.email || usersData?.currentUser?.email || "ravi@example.com",
    phone: p.phone || "+91 9876543210",
    location: p.location || {
      state: "Maharashtra",
      district: "Pune",
      block: "Khed",
      village: "Chakan",
    },
    availableCapital: p.financial?.availableCapital ?? 500000,
    income: p.financial?.income ?? 25000,
    businessExperience: p.experience?.businessExperience || "3-5 years",
    skills: p.experience?.skills ? p.experience.skills.split(",").map(s => s.trim()) : ["Agriculture", "Supply Chain"],
    education: p.experience?.education || "B.Com",
  };
}

function getFallbackBusiness(businessId) {
  const b = businessesData?.details || {};
  return {
    id: businessId || b.id || "123",
    name: b.name || "Green Valley Dairy",
    category: {
      name: b.category || "Agriculture & Allied",
      subcategory: b.subcategory || "Dairy Farming",
    },
    description: b.description || "A small-scale commercial dairy farm focusing on high-yield buffalo milk production for local cooperative supply.",
    location: b.location || {
      state: "Maharashtra",
      district: "Pune",
      block: "Khed",
      village: "Chakan",
    },
    availableMargin: b.capital?.availableMargin ?? 150000,
    expectedInvestment: b.capital?.expectedInvestment ?? 800000,
    workingCapital: b.capital?.workingCapital ?? 50000,
    expectedRevenue: b.operations?.expectedRevenue ?? 45000,
    expectedPrice: b.operations?.expectedPrice ?? 55,
    productionQuantity: b.operations?.productionQuantity ?? 30,
    resources: b.resources || {
      land: "0.5 Acre owned",
      equipment: "Basic shed exists",
      existingResources: "Water connection, grid electricity",
    },
    status: b.status || "Ready",
  };
}

function mapBusinessContext(
  business,
  fullLocation
) {
  return {
    id: business.id,
    name: business.name,
    description: business.description,
    category: business.category
      ? {
          id: business.category.id,
          name: business.category.name,
          slug: business.category.slug,
        }
      : null,
    location: fullLocation ? buildLocationResponse(fullLocation) : business.location,
    availableMargin:
      business.availableMargin !== null
        ? Number(business.availableMargin)
        : null,
    existingResources: business.existingResources,
    expectedRevenue:
      business.expectedRevenue !== null
        ? Number(business.expectedRevenue)
        : null,
    status: business.status,
  };
}

function mapProfileContext(profile) {
  if (!profile) {
    return null;
  }

  return {
    fullName: profile.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : profile.fullName,
    firstName: profile.firstName,
    businessExperience: profile.businessExperience,
    availableCapital:
      profile.availableCapital !== null
        ? Number(profile.availableCapital)
        : null,
    income:
      profile.income !== null
        ? Number(profile.income)
        : null,
    skills:
      Array.isArray(profile.skills)
        ? profile.skills
        : typeof profile.skills === "string" ? profile.skills.split(",").map(s => s.trim()) : [],
    education: profile.education,
    location: profile.location || null,
  };
}

export async function loadAiContext({
  userId,
  businessId = null,
}) {
  let profile = null;
  let businessContext = null;

  // 1. Try DB lookup, fall back to complete seed user profile
  try {
    profile = await findProfileByUserId(userId);
  } catch (err) {
    profile = null;
  }

  const resolvedProfile = profile ? mapProfileContext(profile) : getFallbackProfile();

  // 2. Try DB business lookup, fall back to complete seed business data
  if (businessId) {
    try {
      const business = await findBusinessByIdAndUserId({
        businessId,
        userId,
      });

      if (business) {
        let fullLocation = null;
        if (business.locationId) {
          try {
            fullLocation = await findLocationWithParents(business.locationId);
          } catch (e) {
            fullLocation = null;
          }
        }
        businessContext = mapBusinessContext(business, fullLocation);
      }
    } catch (err) {
      businessContext = null;
    }
  }

  // If no DB business was found, provide the fallback business
  if (!businessContext) {
    businessContext = getFallbackBusiness(businessId);
  }

  return {
    profile: resolvedProfile,
    business: businessContext,
  };
}