"use client";
import { useState, useEffect, useCallback } from "react";
import { DATA_SOURCE } from "./source";
import { businessApi } from "@/features/business/api/businessApi";
import { BusinessDetails } from "@/features/business/components/BusinessDetailsView";
import { prototypeStorage } from "@/lib/storage/prototypeStorage";

export const useBusinessesComparison = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadBusinesses = useCallback(() => {
    // 1. Prototype storage check first (immediate, sync)
    const activeUser = prototypeStorage.getCurrentUser();
    let localBusinesses = activeUser ? prototypeStorage.getBusinesses(activeUser.id) : [];
    if (!localBusinesses || localBusinesses.length === 0) {
      localBusinesses = prototypeStorage.getBusinesses();
    }

    if (localBusinesses && localBusinesses.length > 0) {
      setData(localBusinesses);
      setIsLoading(false);
      return;
    }

    // 2. Fetch from backend API
    businessApi
      .list()
      .then((res: any) => {
        const list =
          res?.data?.businesses ||
          res?.data?.data?.businesses ||
          res?.data?.items ||
          res?.items ||
          [];
        if (list.length > 0) {
          setData(list);
        } else if (localBusinesses && localBusinesses.length > 0) {
          setData(localBusinesses);
        } else {
          setData([]);
        }
        setIsLoading(false);
      })
      .catch((err) => {
        if (localBusinesses && localBusinesses.length > 0) {
          setData(localBusinesses);
        } else {
          setError(err);
          setData([]);
        }
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadBusinesses();

    if (typeof window !== "undefined") {
      const handleUpdate = () => loadBusinesses();
      window.addEventListener("ventureroot_business_updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);
      window.addEventListener("focus", handleUpdate);

      return () => {
        window.removeEventListener("ventureroot_business_updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
        window.removeEventListener("focus", handleUpdate);
      };
    }
  }, [loadBusinesses]);

  return { data, isLoading, error, refresh: loadBusinesses };
};

export const useBusinessDetails = (id: string) => {
  const [data, setData] = useState<BusinessDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadDetails = useCallback(() => {
    const targetId = id === "123" || id === "latest" || id === "active" ? "" : id;

    // 1. Check prototype storage
    if (targetId) {
      const stored = prototypeStorage.getBusinessById(targetId);
      if (stored) {
        setData(stored);
        setIsLoading(false);
        return;
      }
    }

    // Fallback to active business in storage
    const active = prototypeStorage.getActiveBusiness();
    if (active) {
      setData(active);
      setIsLoading(false);
      return;
    }

    const all = prototypeStorage.getBusinesses();
    if (all.length > 0) {
      setData(all[0]);
      setIsLoading(false);
      return;
    }

    // 2. Try backend API if available
    if (targetId) {
      businessApi
        .get(targetId)
        .then((res: any) => {
          const details =
            res?.data?.business ||
            res?.data?.data?.business ||
            res?.data ||
            res;
          setData(details as BusinessDetails);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setData(null);
          setIsLoading(false);
        });
    } else {
      setData(null);
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetails();

    if (typeof window !== "undefined") {
      const handleUpdate = () => loadDetails();
      window.addEventListener("ventureroot_business_updated", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      return () => {
        window.removeEventListener("ventureroot_business_updated", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
      };
    }
  }, [loadDetails]);

  return { data, isLoading, error };
};
