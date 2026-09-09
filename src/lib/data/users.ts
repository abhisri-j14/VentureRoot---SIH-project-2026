"use client";
import { useState, useEffect, useCallback } from "react";
import { DATA_SOURCE } from "./source";
import { profileApi } from "@/features/profile/api/profileApi";
import { authApi } from "@/features/auth/api/authApi";
import { prototypeStorage } from "@/lib/storage/prototypeStorage";

export const getCurrentUser = async (): Promise<any | null> => {
  if (DATA_SOURCE === "database") {
    try {
      const res: any = await authApi.me();
      const user = res?.data?.user || res?.user || res?.data;
      if (user) {
        let profileName = user.user_metadata?.full_name;
        let location = undefined;
        try {
          const pRes: any = await profileApi.getProfile();
          const pData = pRes?.data?.profile;
          if (pData?.fullName) {
            profileName = pData.fullName;
          }
          if (pData?.location?.state) {
            location = `${pData.location.district ? pData.location.district + ", " : ""}${pData.location.state}`;
          }
        } catch {
          // Profile may not exist yet for new user
        }

        return {
          id: user.id,
          name:
            profileName ||
            user.email?.split("@")[0] ||
            "User",
          email: user.email,
          roleLabel: user.user_metadata?.role || "Entrepreneur",
          location,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  // Prototype storage mode: look up active session
  const activeUser = prototypeStorage.getCurrentUser();
  if (activeUser) {
    const profile = prototypeStorage.getProfile(activeUser.id);
    const location = profile?.location?.state
      ? `${profile.location.district ? profile.location.district + ", " : ""}${profile.location.state}`
      : undefined;
    return {
      id: activeUser.id,
      name: profile?.fullName || activeUser.name,
      email: activeUser.email,
      roleLabel: activeUser.roleLabel || "Entrepreneur",
      location,
    };
  }

  return null;
};

export const useProfile = () => {
  const [data, setData] = useState<any | null>(null);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(() => {
    if (DATA_SOURCE === "database") {
      setIsLoading(true);
      profileApi
        .getProfile()
        .then((res: any) => {
          const profile = res?.data?.profile ?? null;
          const completed = res?.data?.onboardingCompleted ?? !!profile;
          setData(profile);
          setOnboardingCompleted(completed);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setData(null);
          setOnboardingCompleted(false);
          setIsLoading(false);
        });
      return;
    }

    // Prototype storage mode: read current user's profile
    const activeUser = prototypeStorage.getCurrentUser();
    if (activeUser) {
      const profile = prototypeStorage.getProfile(activeUser.id);
      const isCompleted = Boolean(profile?.fullName && profile?.location?.state);
      setData(profile);
      setOnboardingCompleted(isCompleted);
    } else {
      setData(null);
      setOnboardingCompleted(false);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, onboardingCompleted, isLoading, error, refetch };
};
