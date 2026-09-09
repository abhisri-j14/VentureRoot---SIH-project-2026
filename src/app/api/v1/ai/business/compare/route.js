import { authenticate } from "@/middlewares/auth.middleware";
import { businessDb } from "@/lib/server/jsonDb";
import { compareBusinessesWithAi } from "@/integrations/ai.client";
import { successResponse } from "@/utils/api-response";
import { handleError } from "@/utils/error-handler";

export async function POST(request) {
  try {
    const { user } = await authenticate(request);
    const body = await request.json().catch(() => ({}));
    const businessId = body.businessId;

    let userBusiness = businessId ? businessDb.getBusinessById(businessId) : null;
    if (!userBusiness && user?.id) {
      const userBizList = businessDb.getBusinessesByUserId(user.id);
      userBusiness = userBizList?.[0] || null;
    }

    const comparison = await compareBusinessesWithAi({
      userBusiness,
      benchmarkBusinesses: body.benchmarkBusinesses || [],
    });

    return successResponse({
      message: "Comparative analysis generated successfully",
      data: { comparison },
    });
  } catch (error) {
    return handleError(error);
  }
}
