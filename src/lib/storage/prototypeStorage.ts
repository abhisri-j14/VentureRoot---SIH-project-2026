/**
 * VentureRoot Prototype Storage Interface
 * Serves as the clean client/server-compatible source of truth for prototype mode.
 * Adheres strictly to the MASTER-API-CONTRACT schemas so it can be swapped
 * with the real database backend with zero client-side architectural rework.
 */

import { ProfileData } from "@/features/profile/schemas/profileSchema";
import { BusinessDetails } from "@/features/business/components/BusinessDetailsView";

export interface PrototypeUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  roleLabel: string;
  createdAt: string;
}

export interface PrototypeProfile extends ProfileData {
  userId: string;
  updatedAt: string;
}

export interface PrototypeBusiness extends BusinessDetails {
  userId: string;
  createdAt: string;
}

const STORAGE_KEYS = {
  USERS: "ventureroot_users",
  CURRENT_USER_ID: "ventureroot_current_user_id",
  PROFILES: "ventureroot_profiles",
  BUSINESSES: "ventureroot_businesses",
  AI_INSIGHTS: "ventureroot_ai_insights",
};

// In-memory fallback for SSR or environments without localStorage
const memoryStore: Record<string, string> = {};

function getItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return localStorage.getItem(key);
    } catch {
      return memoryStore[key] || null;
    }
  }
  return memoryStore[key] || null;
}

function setItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(key, value);
    } catch {
      memoryStore[key] = value;
    }
  } else {
    memoryStore[key] = value;
  }
}

function removeItem(key: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(key);
    } catch {
      delete memoryStore[key];
    }
  } else {
    delete memoryStore[key];
  }
}

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export const prototypeStorage = {
  // ─── USER & AUTHENTICATION ──────────────────────────────────────────

  getAllUsers(): PrototypeUser[] {
    return parseJSON<PrototypeUser[]>(getItem(STORAGE_KEYS.USERS), []);
  },

  getCurrentUser(): PrototypeUser | null {
    const currentId = getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!currentId) return null;
    const users = this.getAllUsers();
    return users.find((u) => u.id === currentId) || null;
  },

  setCurrentUser(user: PrototypeUser | null): void {
    if (user) {
      setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      if (typeof window !== "undefined") {
        document.cookie = `ventureroot_token=mock-token-${user.id}; path=/; max-age=2592000; SameSite=Lax`;
      }
    } else {
      removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (typeof window !== "undefined") {
        document.cookie = "ventureroot_token=; path=/; max-age=0";
      }
    }
  },

  register(fullName: string, email: string, password?: string): PrototypeUser {
    const users = this.getAllUsers();
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      // Update name if previously registered without profile
      existing.name = fullName || existing.name;
      if (password) existing.password = password;
      setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      this.setCurrentUser(existing);
      return existing;
    }

    const newUser: PrototypeUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password: password || "password123",
      roleLabel: "Entrepreneur",
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    this.setCurrentUser(newUser);
    return newUser;
  },

  login(email: string, password?: string): PrototypeUser | null {
    const users = this.getAllUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) return null;
    if (password && user.password && user.password !== password) {
      // For prototype convenience, if password doesn't match default fallback, reject
      return null;
    }
    this.setCurrentUser(user);
    return user;
  },

  logout(): void {
    this.setCurrentUser(null);
  },

  // ─── ENTREPRENEUR PROFILE ──────────────────────────────────────────

  getProfile(userId: string): PrototypeProfile | null {
    const profiles = parseJSON<Record<string, PrototypeProfile>>(getItem(STORAGE_KEYS.PROFILES), {});
    return profiles[userId] || null;
  },

  saveProfile(userId: string, data: Partial<ProfileData>): PrototypeProfile {
    const profiles = parseJSON<Record<string, PrototypeProfile>>(getItem(STORAGE_KEYS.PROFILES), {});
    const existing = profiles[userId];

    const updatedProfile: PrototypeProfile = {
      userId,
      fullName: data.fullName || existing?.fullName || "Entrepreneur",
      email: data.email || existing?.email || "",
      phone: data.phone || existing?.phone || "",
      location: data.location || existing?.location || { state: "", district: "" },
      financial: data.financial || existing?.financial || { availableCapital: 0, income: 0 },
      experience: data.experience || existing?.experience || { businessExperience: "None", skills: [] },
      updatedAt: new Date().toISOString(),
    };

    profiles[userId] = updatedProfile;
    setItem(STORAGE_KEYS.PROFILES, JSON.stringify(profiles));

    // Also sync user's display name if provided
    const users = this.getAllUsers();
    const user = users.find((u) => u.id === userId);
    if (user && data.fullName) {
      user.name = data.fullName;
      setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    return updatedProfile;
  },

  // ─── BUSINESS ENTERPRISES ───────────────────────────────────────────

  getBusinesses(userId?: string): PrototypeBusiness[] {
    const all = parseJSON<PrototypeBusiness[]>(getItem(STORAGE_KEYS.BUSINESSES), []);
    if (!userId) return all;
    return all.filter((b) => b.userId === userId);
  },

  getBusinessById(id: string): PrototypeBusiness | null {
    const all = this.getBusinesses();
    return all.find((b) => b.id === id) || null;
  },

  saveBusiness(userId: string, data: Partial<PrototypeBusiness>): PrototypeBusiness {
    const all = this.getBusinesses();
    const businessId = data.id || `biz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const existingIdx = all.findIndex((b) => b.id === businessId);

    const businessRecord: PrototypeBusiness = {
      id: businessId,
      userId,
      name: data.name || "My New Enterprise",
      category: data.category || "General Enterprise",
      subcategory: data.subcategory || "",
      description: data.description || "Micro-enterprise operations and local commercial plan.",
      status: data.status || "Ready",
      location: data.location || { state: "Local", district: "Region" },
      capital: {
        availableMargin: Number(data.capital?.availableMargin) || 50000,
        workingCapital: Number(data.capital?.workingCapital) || 20000,
        expectedInvestment: Number(data.capital?.expectedInvestment) || 150000,
      },
      operations: {
        expectedRevenue: Number(data.operations?.expectedRevenue) || 30000,
        expectedPrice: Number(data.operations?.expectedPrice) || 50,
        productionQuantity: Number(data.operations?.productionQuantity) || 100,
      },
      resources: data.resources || {
        land: "Local site",
        equipment: "Basic equipment",
        existingResources: "Power & water available",
      },
      createdAt: existingIdx >= 0 ? all[existingIdx].createdAt : new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      all[existingIdx] = businessRecord;
    } else {
      all.unshift(businessRecord);
    }

    setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(all));
    return businessRecord;
  },

  // ─── AI INSIGHTS CACHE ──────────────────────────────────────────────

  getAiInsights(businessId: string): any | null {
    const all = parseJSON<Record<string, any>>(getItem(STORAGE_KEYS.AI_INSIGHTS), {});
    return all[businessId] || null;
  },

  saveAiInsights(businessId: string, insights: any): void {
    const all = parseJSON<Record<string, any>>(getItem(STORAGE_KEYS.AI_INSIGHTS), {});
    all[businessId] = {
      ...insights,
      cachedAt: new Date().toISOString(),
    };
    setItem(STORAGE_KEYS.AI_INSIGHTS, JSON.stringify(all));
  },

  // ─── DEMO SEED UTILITY (Optional, for judge testing) ───────────────

  seedDemoAccount(): PrototypeUser {
    const demoUser = this.register("Rajesh Verma", "rajesh.verma@example.com", "demo123");
    this.saveProfile(demoUser.id, {
      fullName: "Rajesh Verma",
      email: "rajesh.verma@example.com",
      phone: "+91 9876543210",
      location: {
        state: "Uttar Pradesh",
        district: "Varanasi",
        block: "Arajiline",
        village: "Kashipur",
      },
      financial: {
        availableCapital: 300000,
        income: 22000,
      },
      experience: {
        businessExperience: "3-5 years",
        skills: ["Textile Weaving", "Local Retail"],
        education: "Higher Secondary",
      },
    });

    this.saveBusiness(demoUser.id, {
      id: "biz_demo_001",
      name: "Kashi Handloom Weaving Unit",
      category: "Textiles & Handicrafts",
      subcategory: "Handloom Weaving",
      description: "Semi-mechanized traditional handloom unit producing Banarasi sarees and fabrics for regional markets.",
      status: "Ready",
      location: {
        state: "Uttar Pradesh",
        district: "Varanasi",
        block: "Arajiline",
        village: "Kashipur",
      },
      capital: {
        availableMargin: 120000,
        expectedInvestment: 450000,
        workingCapital: 40000,
      },
      operations: {
        expectedRevenue: 55000,
        expectedPrice: 1200,
        productionQuantity: 45,
      },
      resources: {
        land: "Work shed at homestead",
        equipment: "2 Pit looms and yarn bobbin winder",
        existingResources: "Grid electricity, artisan weaver network",
      },
    });

    this.setCurrentUser(demoUser);
    return demoUser;
  },
};
