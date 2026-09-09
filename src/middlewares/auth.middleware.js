import { UnauthorizedError } from "@/errors/http-error";
import { getCurrentUser } from "@/services/auth.service";
import usersData from "@/data/users.json";

export async function authenticate(request) {
  const authorization =
    request.headers.get("authorization");

  // In prototype mode (e.g. DATA_SOURCE=json or Supabase not configured), provide seamless demo user context
  const isMockMode =
    process.env.NEXT_PUBLIC_DATA_SOURCE === "json" ||
    !process.env.SUPABASE_URL;

  const extractMockUser = (t) => {
    if (t && t.startsWith("mock-token-")) {
      const id = t.replace("mock-token-", "");
      return {
        id,
        email: `${id}@example.com`,
        user_metadata: { full_name: "Entrepreneur" },
      };
    }
    return usersData.currentUser;
  };

  if (!authorization) {
    if (isMockMode) {
      return {
        user: extractMockUser("demo-token"),
        accessToken: "demo-token",
      };
    }
    throw new UnauthorizedError(
      "Authorization header is required"
    );
  }

  const [scheme, token] =
    authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    if (isMockMode) {
      return {
        user: extractMockUser("demo-token"),
        accessToken: "demo-token",
      };
    }
    throw new UnauthorizedError(
      "Invalid authorization header"
    );
  }

  try {
    const user = await getCurrentUser(token);

    if (!user) {
      if (isMockMode) {
        return {
          user: extractMockUser(token),
          accessToken: token,
        };
      }
      throw new UnauthorizedError(
        "Invalid or expired access token"
      );
    }

    return {
      user,
      accessToken: token,
    };
  } catch (error) {
    if (isMockMode) {
      return {
        user: extractMockUser(token),
        accessToken: token,
      };
    }
    if (error instanceof UnauthorizedError) {
      throw error;
    }

    throw new UnauthorizedError(
      "Invalid or expired access token"
    );
  }
}