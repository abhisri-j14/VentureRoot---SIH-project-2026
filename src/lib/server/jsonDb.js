/**
 * VentureRoot Server-Side JSON Database Engine
 * 
 * Provides atomic persistence for prototype mode:
 * 1. Reads/writes to local JSON files (`src/data/users.json`, `src/data/businesses.json`) in development.
 * 2. In deployment (Vercel) or when GITHUB_TOKEN is configured, syncs updates directly
 *    to the GitHub repository via GitHub REST API (Contents API) to persist across server restarts.
 * 3. Cryptographically hashes passwords with PBKDF2 (SHA-512) and per-user random salts.
 * 4. Strictly protects secrets: GITHUB_TOKEN and GEMINI_API_KEY remain server-only.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || "abhisri-j14/VentureRoot---SIH-project-2026";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

// Resolve local data directory
function getDataDir() {
  return path.join(process.cwd(), "src", "data");
}

function getFilePath(fileName) {
  return path.join(getDataDir(), fileName);
}

// ─── Cryptographic Password Hashing ──────────────────────────────────────────

export function hashPassword(password, salt) {
  const generatedSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, generatedSalt, 100000, 64, "sha512")
    .toString("hex");
  return { hash, salt: generatedSalt };
}

export function verifyPassword(password, storedHash, salt) {
  if (!password || !storedHash || !salt) return false;
  const { hash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

// ─── Local File I/O ──────────────────────────────────────────────────────────

export function readLocalJson(fileName, fallback = {}) {
  try {
    const filePath = getFilePath(fileName);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[jsonDb] Error reading ${fileName} from disk:`, err?.message);
  }
  return fallback;
}

export function writeLocalJson(fileName, data) {
  try {
    const filePath = getFilePath(fileName);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.warn(`[jsonDb] Local write failed for ${fileName} (normal in read-only serverless):`, err?.message);
    return false;
  }
}

// ─── GitHub API Content Sync (For Cloud / Vercel Redeployment Persistence) ───

export async function syncToGitHub(fileName, data) {
  if (!GITHUB_TOKEN) {
    // In local dev without GITHUB_TOKEN, local file write is sufficient
    return false;
  }

  const repoFilePath = `src/data/${fileName}`;
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${repoFilePath}?ref=${GITHUB_BRANCH}`;

  try {
    // 1. Fetch current file SHA from GitHub
    let currentSha = null;
    const getRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "VentureRoot-Database-Sync",
      },
      cache: "no-store",
    });

    if (getRes.ok) {
      const fileMeta = await getRes.json();
      currentSha = fileMeta.sha;
    }

    // 2. Commit updated JSON to GitHub
    const contentBase64 = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
    const putRes = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${repoFilePath}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "VentureRoot-Database-Sync",
      },
      body: JSON.stringify({
        message: `chore(data): persist ${fileName} [skip ci]`,
        content: contentBase64,
        sha: currentSha,
        branch: GITHUB_BRANCH,
      }),
    });

    if (!putRes.ok) {
      const errBody = await putRes.json().catch(() => ({}));
      console.warn(`[jsonDb] GitHub sync HTTP ${putRes.status} for ${fileName}:`, errBody);
      return false;
    }

    console.log(`[jsonDb] Successfully synced ${fileName} to GitHub repository (${GITHUB_REPO})`);
    return true;
  } catch (err) {
    console.error(`[jsonDb] Failed to commit ${fileName} to GitHub:`, err?.message);
    return false;
  }
}

// Write to both local disk and GitHub
export async function persistJson(fileName, data) {
  writeLocalJson(fileName, data);
  if (GITHUB_TOKEN) {
    // Run GitHub commit in background without blocking response
    syncToGitHub(fileName, data).catch((e) =>
      console.warn(`[jsonDb] Async GitHub sync error:`, e?.message)
    );
  }
}

// ─── USER REPOSITORY ─────────────────────────────────────────────────────────

export const userDb = {
  getAllUsers() {
    const raw = readLocalJson("users.json", { users: [] });
    return Array.isArray(raw.users) ? raw.users : [];
  },

  findUserByEmail(email) {
    if (!email) return null;
    const users = this.getAllUsers();
    return users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase()) || null;
  },

  findUserById(id) {
    if (!id) return null;
    const users = this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  },

  async createUser({ name, fullName, email, password, roleLabel, role, phone, mobile }) {
    const raw = readLocalJson("users.json", { users: [] });
    const users = Array.isArray(raw.users) ? raw.users : [];

    const existing = users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existing) {
      return existing;
    }

    const resolvedName = (name || fullName || email.split("@")[0] || "Entrepreneur").trim();
    const resolvedRole = roleLabel || role || "Entrepreneur";
    const resolvedPhone = phone || mobile || "";

    const { hash, salt } = hashPassword(password || "password123");
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: resolvedName,
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      salt: salt,
      roleLabel: resolvedRole,
      createdAt: new Date().toISOString(),
      profile: {
        fullName: resolvedName,
        email: email.trim().toLowerCase(),
        phone: resolvedPhone,
        location: { state: "", district: "", block: "", village: "" },
        financial: { availableCapital: 0, income: 0 },
        experience: { businessExperience: "None", skills: [], education: "" },
      },
    };

    users.push(newUser);
    raw.users = users;
    await persistJson("users.json", raw);
    return newUser;
  },

  authenticateUser(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) return null;
    // If user has hashed password, verify
    if (user.passwordHash && user.salt) {
      const isValid = verifyPassword(password, user.passwordHash, user.salt);
      if (!isValid) return null;
    }
    return user;
  },

  async updateUserProfile(userId, profileData) {
    const raw = readLocalJson("users.json", { users: [] });
    const users = Array.isArray(raw.users) ? raw.users : [];
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return null;

    const user = users[idx];
    user.name = profileData.fullName || user.name;
    user.profile = {
      ...user.profile,
      ...profileData,
      updatedAt: new Date().toISOString(),
    };

    users[idx] = user;
    raw.users = users;
    await persistJson("users.json", raw);
    return user;
  },
};

// ─── BUSINESS REPOSITORY ─────────────────────────────────────────────────────

export const businessDb = {
  getAllBusinesses() {
    const raw = readLocalJson("businesses.json", { items: [] });
    return Array.isArray(raw.items) ? raw.items : [];
  },

  getBusinessesByUserId(userId) {
    const items = this.getAllBusinesses();
    if (!userId) return items;
    return items.filter((b) => b.userId === userId);
  },

  getBusinessById(id) {
    const items = this.getAllBusinesses();
    return items.find((b) => b.id === id) || null;
  },

  async createBusiness(userId, data) {
    const raw = readLocalJson("businesses.json", { items: [] });
    const items = Array.isArray(raw.items) ? raw.items : [];

    const businessTitle = data.name || data.businessName || "My Rural Enterprise";
    const newBusiness = {
      id: data.id || `biz_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId,
      name: businessTitle,
      businessName: businessTitle,
      category: data.category || data.industry || "General Enterprise",
      subcategory: data.subcategory || "",
      description: data.description || "Micro-enterprise plan.",
      stage: data.stage || "Ideation",
      status: data.status || "Ready",
      location: data.location || {
        state: data.state || "Local",
        district: data.district || "District",
      },
      capital: {
        availableMargin: Number(data.capital?.availableMargin || data.availableMargin) || 50000,
        workingCapital: Number(data.capital?.workingCapital) || Math.round((Number(data.availableMargin || 50000)) * 0.35),
        expectedInvestment: Number(data.capital?.expectedInvestment || data.expectedInvestment) || Math.round((Number(data.availableMargin || 50000)) * 2.5),
      },
      operations: {
        expectedRevenue: Number(data.operations?.expectedRevenue || data.expectedRevenue) || 30000,
        expectedPrice: Number(data.operations?.expectedPrice || data.expectedPrice) || 75,
        productionQuantity: Number(data.operations?.productionQuantity || data.productionQuantity) || 100,
      },
      resources: data.resources || {
        existingResources: data.existingResources || "Basic utilities & shed",
        land: "Local premises",
        equipment: "Essential processing equipment",
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    items.unshift(newBusiness);
    raw.items = items;
    await persistJson("businesses.json", raw);
    return newBusiness;
  },

  async updateBusiness(businessId, data) {
    const raw = readLocalJson("businesses.json", { items: [] });
    const items = Array.isArray(raw.items) ? raw.items : [];
    const idx = items.findIndex((b) => b.id === businessId);
    if (idx === -1) return null;

    items[idx] = {
      ...items[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    raw.items = items;
    await persistJson("businesses.json", raw);
    return items[idx];
  },
};
