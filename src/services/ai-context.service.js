import { findBusinessByIdAndUserId } from "@/repositories/business.repository";
import { findProfileByUserId } from "@/repositories/profile.repository";
import { userDb, businessDb } from "@/lib/server/jsonDb";

export async function loadAiContext({ userId, businessId = null }) {
  let profile = null;
  let businessContext = null;

  if (userId) {
    const user = userDb.findUserById(userId);
    if (user) {
      profile = {
        fullName: user.name || user.profile?.fullName || "Entrepreneur",
        firstName: (user.name || user.profile?.fullName || "Entrepreneur").split(" ")[0],
        email: user.email,
        phone: user.profile?.phone || "",
        location: user.profile?.location || { state: "Uttar Pradesh", district: "Varanasi" },
        availableCapital: user.profile?.financial?.availableCapital || 100000,
        income: user.profile?.financial?.income || 20000,
        businessExperience: user.profile?.experience?.businessExperience || "1-3 years",
        skills: user.profile?.experience?.skills || ["Local Enterprise"],
        education: user.profile?.experience?.education || "Secondary",
      };
    }
  }

  if (!profile) {
    try {
      const repoProfile = await findProfileByUserId(userId);
      if (repoProfile) {
        profile = {
          fullName: repoProfile.fullName || "Entrepreneur",
          firstName: (repoProfile.fullName || "Entrepreneur").split(" ")[0],
          email: repoProfile.email || "",
          location: repoProfile.location || null,
          availableCapital: Number(repoProfile.availableCapital || 0),
          income: Number(repoProfile.income || 0),
          skills: repoProfile.skills || [],
          education: repoProfile.education || "",
          businessExperience: repoProfile.businessExperience || "None",
        };
      }
    } catch (err) {
      // ignore
    }
  }

  if (businessId) {
    const jsonBiz = businessDb.getBusinessById(businessId);
    if (jsonBiz) {
      businessContext = {
        id: jsonBiz.id,
        name: jsonBiz.name || jsonBiz.businessName,
        category: jsonBiz.category,
        subcategory: jsonBiz.subcategory || "",
        description: jsonBiz.description,
        location: jsonBiz.location,
        capital: jsonBiz.capital,
        operations: jsonBiz.operations,
        resources: jsonBiz.resources,
        status: jsonBiz.status,
      };
    }
  }

  if (!businessContext && userId) {
    const userBizList = businessDb.getBusinessesByUserId(userId);
    if (userBizList && userBizList.length > 0) {
      const b = userBizList[0];
      businessContext = {
        id: b.id,
        name: b.name || b.businessName,
        category: b.category,
        subcategory: b.subcategory || "",
        description: b.description,
        location: b.location,
        capital: b.capital,
        operations: b.operations,
        resources: b.resources,
        status: b.status,
      };
    }
  }

  return {
    profile: profile || {
      fullName: "Entrepreneur",
      firstName: "Entrepreneur",
      availableCapital: 100000,
      skills: ["General Enterprise"],
      location: { state: "Uttar Pradesh", district: "Varanasi" }
    },
    business: businessContext || null,
  };
}
