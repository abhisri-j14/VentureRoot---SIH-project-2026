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
    fullName: p.fullName || "Ravi Kumar",
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
    description: b.description || "Small-scale commercial dairy farm focusing on high-yield milk production.",
    category: {
      id: "cat_agri",
      name: b.category || "Agriculture & Allied",
      slug: "agriculture-allied",
      subcategory: b.subcategory || "Dairy Farming",
    },
    location: b.location || {
      state: "Maharashtra",
      district: "Pune",
      block: "Khed",
    },
    availableMargin: b.capital?.availableMargin ?? 150000,
    expectedInvestment: b.capital?.expectedInvestment ?? 800000,
    workingCapital: b.capital?.workingCapital ?? 50000,
    expectedRevenue: b.operations?.expectedRevenue ?? 45000,
    expectedPrice: b.operations?.expectedPrice ?? 55,
    productionQuantity: b.operations?.productionQuantity ?? 30,
    existingResources: b.resources?.existingResources || "Water connection, grid electricity, 0.5 Acre owned",
    status: b.status || "Ready",
  };
}

function mapBusinessForFeasibility(
  business,
  location
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
    location: location ? buildLocationResponse(location) : business.location,
    availableMargin: Number(business.availableMargin ?? 150000),
    existingResources: business.existingResources,
    expectedRevenue: Number(business.expectedRevenue ?? 45000),
    status: business.status,
  };
}

function mapProfileForFeasibility(
  profile
) {
  if (!profile) {
    return null;
  }

  return {
    availableCapital:
      profile.availableCapital !== null
        ? Number(profile.availableCapital)
        : null,
    income:
      profile.income !== null
        ? Number(profile.income)
        : null,
    businessExperience: profile.businessExperience,
    skills:
      Array.isArray(profile.skills)
        ? profile.skills
        : typeof profile.skills === "string" ? profile.skills.split(",").map(s => s.trim()) : [],
    education: profile.education,
  };
}

export async function loadFeasibilityData({
  userId,
  businessId,
  clientBusiness,
  clientProfile,
}) {
  let business = null;
  let profile = null;
  let fullLocation = null;

  try {
    business = await findBusinessByIdAndUserId({
      businessId,
      userId,
    });
    if (business?.locationId) {
      try {
        fullLocation = await findLocationWithParents(business.locationId);
      } catch (e) {
        fullLocation = null;
      }
    }
  } catch (err) {
    business = null;
  }

  try {
    profile = await findProfileByUserId(userId);
  } catch (err) {
    profile = null;
  }

  const resolvedBusiness = clientBusiness
    ? clientBusiness
    : business
    ? mapBusinessForFeasibility(business, fullLocation)
    : getFallbackBusiness(businessId);

  const resolvedProfile = clientProfile
    ? clientProfile
    : profile
    ? mapProfileForFeasibility(profile)
    : getFallbackProfile();

  return {
    business: resolvedBusiness,
    profile: resolvedProfile,
  };
}