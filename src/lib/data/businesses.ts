"use client";
import { useState, useEffect } from "react";
import { DATA_SOURCE } from "./source";
import { businessApi } from "@/features/business/api/businessApi";
import { BusinessDetails } from "@/features/business/components/BusinessDetailsView";
import { prototypeStorage } from "@/lib/storage/prototypeStorage";

export const useBusinessesComparison = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (DATA_SOURCE === "database") {
      businessApi
        .list()
        .then((res: any) => {
          const list =
            res?.data?.businesses ||
            res?.data?.data?.businesses ||
            res?.data?.items ||
            res?.items ||
            [];
          setData(list);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setData([]);
          setIsLoading(false);
        });
      return;
    }

    // Prototype storage mode: load active user's actual businesses
    const activeUser = prototypeStorage.getCurrentUser();
    if (activeUser) {
      const userBusinesses = prototypeStorage.getBusinesses(activeUser.id);
      setData(userBusinesses);
    } else {
      setData([]);
    }
    setIsLoading(false);
  }, []);

  return { data, isLoading, error };
};

export const useBusinessDetails = (id: string) => {
  const [data, setData] = useState<BusinessDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (DATA_SOURCE === "database") {
      if (!id || id === "123") {
        setData(null);
        setIsLoading(false);
        return;
      }
      businessApi
        .get(id)
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
      return;
    }

    // Prototype storage mode: look up by ID
    if (id) {
      const stored = prototypeStorage.getBusinessById(id);
      if (stored) {
        setData(stored);
        setIsLoading(false);
        return;
      }

      // Check if active user has any business
      const activeUser = prototypeStorage.getCurrentUser();
      if (activeUser) {
        const userBusinesses = prototypeStorage.getBusinesses(activeUser.id);
        if (userBusinesses.length > 0) {
          setData(userBusinesses[0]);
          setIsLoading(false);
          return;
        }
      }
    }

    setData(null);
    setIsLoading(false);
  }, [id]);

  return { data, isLoading, error };
};
