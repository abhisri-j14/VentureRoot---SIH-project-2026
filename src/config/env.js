import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("production"),
  APP_NAME: z.string().min(1).default("VentureRoot"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_PREFIX: z.string().startsWith("/").default("/api/v1"),

  SUPABASE_URL: z.string().optional().default("https://example.supabase.co"),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional().default("mock-publishable-key"),

  DIRECT_URL: z.string().min(1).optional().default("postgresql://postgres:postgres@localhost:5432/ventureroot"),
});

const parsedEnv = envSchema.safeParse(process.env);

const validData = parsedEnv.success ? parsedEnv.data : {
  NODE_ENV: process.env.NODE_ENV || "production",
  APP_NAME: process.env.APP_NAME || "VentureRoot",
  APP_URL: process.env.APP_URL || "http://localhost:3000",
  API_PREFIX: process.env.API_PREFIX || "/api/v1",
  SUPABASE_URL: process.env.SUPABASE_URL || "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: process.env.SUPABASE_PUBLISHABLE_KEY || "mock-publishable-key",
  DIRECT_URL: process.env.DIRECT_URL || "postgresql://postgres:postgres@localhost:5432/ventureroot",
};

const env = {
  nodeEnv: validData.NODE_ENV,
  appName: validData.APP_NAME,
  appUrl: validData.APP_URL,
  apiPrefix: validData.API_PREFIX,

  supabaseUrl: validData.SUPABASE_URL,
  supabasePublishableKey: validData.SUPABASE_PUBLISHABLE_KEY,

  directUrl: validData.DIRECT_URL,
};

export default env;