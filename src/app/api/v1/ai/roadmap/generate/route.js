import { authenticate } from "@/middlewares/auth.middleware";
import { userDb, businessDb } from "@/lib/server/jsonDb";
import { generateRoadmapWithAi } from "@/integrations/ai.client";
import { successResponse } from "@/utils/api-response";
import { handleError } from "@/utils/error-handler";

export async function POST(request) {
  try {
    const { user } = await authenticate(request);
    const body = await request.json().catch(() => ({}));
    const businessId = body.businessId;

    let business = businessId ? businessDb.getBusinessById(businessId) : null;
    if (!business && user?.id) {
      const userBizList = businessDb.getBusinessesByUserId(user.id);
      business = userBizList?.[0] || null;
    }

    // If already generated and not forced, return cached
    if (business?.roadmap && !body.forceRegenerate) {
      return successResponse({
        message: "Cached action roadmap retrieved",
        data: { roadmap: business.roadmap },
      });
    }

    const profile = user ? userDb.findUserById(user.id)?.profile : null;
    const roadmap = await generateRoadmapWithAi({ business, profile });

    if (business?.id && roadmap) {
      await businessDb.saveRoadmap(business.id, roadmap);
    }

    return successResponse({
      message: "Action roadmap generated successfully",
      data: { roadmap },
    });
  } catch (error) {
    return handleError(error);
  }
}
