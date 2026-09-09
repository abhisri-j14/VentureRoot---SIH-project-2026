import {
  generateFeasibilityController,
} from "@/controllers/feasibility.controller";

import {
  feasibilityBusinessIdSchema,
} from "@/validators/feasibility/feasibility.validator";

import {
  authenticate,
} from "@/middlewares/auth.middleware";

import {
  successResponse,
} from "@/utils/api-response";

import {
  handleError,
} from "@/utils/error-handler";


export async function POST(
  request,
  { params }
) {
  try {
    const { user } =
      await authenticate(request);

    const { businessId } =
      await params;

    const validatedBusinessId =
      feasibilityBusinessIdSchema.parse(
        businessId
      );

    let body = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const response =
      await generateFeasibilityController(
        user,
        validatedBusinessId,
        body
      );

    return successResponse(response);
  } catch (error) {
    return handleError(error);
  }
}