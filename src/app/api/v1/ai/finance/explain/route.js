import { authenticate } from "@/middlewares/auth.middleware";
import { explainFinancialPlanWithAi } from "@/integrations/ai.client";
import { successResponse } from "@/utils/api-response";
import { handleError } from "@/utils/error-handler";

export async function POST(request) {
  try {
    const { user } = await authenticate(request);
    const body = await request.json().catch(() => ({}));

    const result = await explainFinancialPlanWithAi({
      business: body.business,
      plan: body.plan,
      profile: body.profile,
    });

    return successResponse({
      explanation: result,
    });
  } catch (error) {
    return handleError(error);
  }
}
