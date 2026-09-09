import {
  findProfileByUserId,
  upsertProfile,
} from "@/repositories/profile.repository";
import {
  buildLocationResponse,
} from "@/utils/location.mapper";

import {
  findLocationByHierarchy,
  findLocationWithParents,
} from "@/repositories/location.repository";

import { BadRequestError } from "@/errors/http-error";


function splitFullName(fullName) {
  const parts =
    fullName.trim().split(/\s+/);

  return {
    firstName: parts[0],

    lastName:
      parts.length > 1
        ? parts.slice(1).join(" ")
        : null,
  };
}

function mapProfileResponse({
  profile,
  email,
  location,
}) {
  if (!profile) {
    return {
      profile: null,
      onboardingCompleted: false,
    };
  }

  return {
    profile: {
      fullName: [
        profile.firstName,
        profile.lastName,
      ]
        .filter(Boolean)
        .join(" "),

      email,

      phone: profile.phone,

      location:
        buildLocationResponse(location),

      financial: {
        availableCapital:
          profile.availableCapital !== null
            ? Number(profile.availableCapital)
            : null,

        income:
          profile.income !== null
            ? Number(profile.income)
            : null,
      },

      experience: {
        businessExperience:
          profile.businessExperience,

        skills:
          profile.skills ?? [],

        education:
          profile.education,
      },
    },

    onboardingCompleted:
    isOnboardingCompleted(profile),  };
}


import { userDb } from "@/lib/server/jsonDb";

export async function getMyProfile(user) {
  try {
    const profile =
      await findProfileByUserId(user.id);

    if (profile) {
      let location = null;
      if (profile.locationId) {
        location =
          await findLocationWithParents(
            profile.locationId
          );
      }

      return mapProfileResponse({
        profile,
        email: user.email ?? null,
        location,
      });
    }
  } catch (err) {
    // Database repository offline or unconfigured
  }

  // Fallback to JSON database
  const storedUser = userDb.findUserById(user.id);
  if (storedUser?.profile) {
    return {
      profile: storedUser.profile,
      onboardingCompleted: Boolean(
        storedUser.profile.location?.state &&
        storedUser.profile.financial?.availableCapital !== undefined
      ),
    };
  }

  return {
    profile: null,
    onboardingCompleted: false,
  };
}


export async function upsertMyProfile(
  user,
  data
) {
  try {
    const {
      firstName,
      lastName,
    } = splitFullName(data.fullName);

    const location =
      await findLocationByHierarchy({
        state: data.location.state,
        district: data.location.district,
        block: data.location.block,
        village: data.location.village,
      });

    if (location) {
      const profile =
        await upsertProfile({
          userId: user.id,
          firstName,
          lastName,
          phone: data.phone ?? null,
          locationId: location.id,
          availableCapital: data.financial.availableCapital,
          income: data.financial.income,
          businessExperience: data.experience.businessExperience,
          skills: data.experience.skills ?? [],
          education: data.experience.education ?? null,
        });

      const fullLocation =
        await findLocationWithParents(
          profile.locationId
        );

      return mapProfileResponse({
        profile,
        email: user.email ?? null,
        location: fullLocation,
      });
    }
  } catch (err) {
    // Database repository offline or unconfigured
  }

  // Persist directly into JSON database
  const updatedUser = await userDb.updateUserProfile(user.id, data);
  return {
    profile: updatedUser?.profile || data,
    onboardingCompleted: true,
  };
}

function isOnboardingCompleted(profile) {
  if (!profile) {
    return false;
  }

  return Boolean(
    profile.firstName &&
    profile.locationId &&
    profile.availableCapital !== null &&
    profile.income !== null &&
    profile.businessExperience
  );
}