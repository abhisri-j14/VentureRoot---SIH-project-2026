import { NextResponse } from "next/server";
import indianLocations from "@/data/indian-locations.json";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 30);

    if (!q || q.length < 2) {
      return NextResponse.json({
        success: true,
        message: "Query too short",
        data: { locations: [] }
      });
    }

    const queryLower = q.toLowerCase();
    const matchedSet = new Set();
    const results = [];

    // 1. Instant match from curated Indian database
    for (const item of indianLocations) {
      const match =
        item.label.toLowerCase().includes(queryLower) ||
        item.data.state.toLowerCase().includes(queryLower) ||
        item.data.district.toLowerCase().includes(queryLower) ||
        (item.data.block && item.data.block.toLowerCase().includes(queryLower)) ||
        (item.data.village && item.data.village.toLowerCase().includes(queryLower));

      if (match) {
        const key = (item.data.state + "-" + item.data.district + "-" + (item.data.village || item.data.block)).toLowerCase();
        if (!matchedSet.has(key)) {
          matchedSet.add(key);
          results.push({
            id: "in-" + (results.length + 1),
            name: item.data.village || item.data.district,
            label: item.label,
            data: item.data,
            source: "curated"
          });
        }
      }
      if (results.length >= limit) break;
    }

    // 2. Fetch live OpenStreetMap Nominatim for any Indian village, block, town, or district
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2800);

      const nominatimUrl = "https://nominatim.openstreetmap.org/search?q=" + encodeURIComponent(q) + "&format=json&addressdetails=1&countrycodes=in&limit=" + limit;
      const response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "VentureRoot-App/1.0 (contact@ventureroot.org)",
          "Accept": "application/json"
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const items = await response.json();
        if (Array.isArray(items)) {
          for (const item of items) {
            const a = item.address || {};
            const state = a.state || "";
            const district = a.state_district || a.district || (a.county && a.county !== state ? a.county : "") || (a.city && a.city !== state ? a.city : "");
            const block = a.subdistrict || (a.county !== district ? a.county : "") || a.municipality || "";
            const village = a.village || a.town || a.suburb || a.neighbourhood || (a.city !== district ? a.city : "") || "";

            const labelParts = [village, block, district, state].filter(Boolean).filter((v, i, arr) => arr.indexOf(v) === i);
            const label = labelParts.length > 0 ? labelParts.join(", ") : item.display_name.split(",").slice(0, 3).join(", ");

            const key = (state + "-" + district + "-" + (village || block)).toLowerCase();
            if (!matchedSet.has(key) && (state || district)) {
              matchedSet.add(key);
              results.push({
                id: "osm-" + (item.place_id || results.length + 1),
                name: village || district || state,
                label: label,
                data: {
                  state: state || "India",
                  district: district || state,
                  block: block,
                  village: village
                },
                source: "nominatim"
              });
            }

            if (results.length >= limit) break;
          }
        }
      }
    } catch (fetchErr) {
      // Nominatim timed out or network offline; curated results serve as fallback
    }

    return NextResponse.json({
      success: true,
      message: "Locations fetched successfully",
      data: {
        locations: results
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || "Internal error" },
      { status: 500 }
    );
  }
}