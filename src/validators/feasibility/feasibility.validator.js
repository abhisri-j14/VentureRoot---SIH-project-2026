import { z } from "zod";

export const feasibilityBusinessIdSchema = z
  .string()
  .min(1, "Invalid business ID");