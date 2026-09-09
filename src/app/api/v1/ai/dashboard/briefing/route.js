import { authenticate } from "@/middlewares/auth.middleware";
import { userDb, businessDb } from "@/lib/server/jsonDb";
import { generateDashboardBriefingWithAi } from "@/integrations/ai.client";
import { successResponse } from "@/utils/api-response";
import { handleError } from "@/utils/error-handler";

export async function GET(request) {
  try {
    const { user } = await authenticate(request);
    const dbUser = user?.id ? userDb.findUserById(user.id) : null;
    const userBizList = user?.id ? businessDb.getBusinessesByUserId(user.id) : [];
    const activeBiz = userBizList?.[0] || null;

    if (activeBiz?.briefing) {
      return successResponse({
        message: "Cached executive briefing retrieved",
        data: { briefing: activeBiz.briefing },
      });
    }

    const briefing = await generateDashboardBriefingWithAi({
      user: dbUser || user,
      business: activeBiz,
    });

    if (activeBiz?.id && briefing) {
      await businessDb.saveBriefing(activeBiz.id, briefing);
    }

    return successResponse({
      message: "Executive dashboard briefing generated successfully",
      data: { briefing },
    });
  } catch (error) {
    return handleError(error);
  }
}
