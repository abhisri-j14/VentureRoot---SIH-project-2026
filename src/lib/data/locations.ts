"use client";
import { useState, useEffect, useRef } from "react";
import locationsData from "@/data/locations.json";
import indianLocations from "@/data/indian-locations.json";

export interface LocationSearchResult {
  id?: string;
  name?: string;
  label: string;
  data: {
    state: string;
    district: string;
    block?: string;
    village?: string;
  };
  source?: string;
}

// The UI expects a complete hierarchy object tree. 
export const getLocationHierarchy = () => {
  return locationsData.hierarchy;
};

export const useLocationSearch = (query: string) => {
  const [data, setData] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (trimmed.length < 2) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    timeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/v1/locations/search?q=${encodeURIComponent(trimmed)}&limit=10`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch locations: ${res.status}`);
        }

        const json = await res.json();
        const locations = json.data?.locations || [];

        if (Array.isArray(locations) && locations.length > 0) {
          setData(locations);
        } else {
          // Client-side fallback matching
          const qLower = trimmed.toLowerCase();
          const fallback = indianLocations
            .filter((item) =>
              item.label.toLowerCase().includes(qLower) ||
              item.data.state.toLowerCase().includes(qLower) ||
              item.data.district.toLowerCase().includes(qLower)
            )
            .slice(0, 10);
          setData(fallback);
        }
        setIsLoading(false);
      } catch (err: any) {
        // Offline / fallback to local curated Indian dataset
        const qLower = trimmed.toLowerCase();
        const fallback = indianLocations
          .filter((item) =>
            item.label.toLowerCase().includes(qLower) ||
            item.data.state.toLowerCase().includes(qLower) ||
            item.data.district.toLowerCase().includes(qLower)
          )
          .slice(0, 10);

        setData(fallback);
        setError(err);
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query]);

  return { data, isLoading, error };
};
