import { UnauthorizedError } from "@/errors/http-error";
import { getCurrentUser } from "@/services/auth.service";
import { userDb } from "@/lib/server/jsonDb";

export async function authenticate(request) {
  const authorization =
    request.headers.get("authorization");

  // In prototype mode (e.g. DATA_SOURCE=json or Supabase not configured), provide seamless demo user context
  const isMockMode =
    process.env.NEXT_PUBLIC_DATA_SOURCE === "json" ||
    !process.env.SUPABASE_URL;

  const extractMockUser = (t) => {
    let id = null;
    if (t && t.startsWith("vr-token-")) {
      id = t.replace("vr-token-", "");
    } else if (t && t.startsWith("mock-token-")) {
      id = t.replace("mock-token-", "");
    } else if (t && t !== "demo-token") {
      id = t;
    }

    if (id) {
      const stored = userDb.findUserById(id);
      if (stored) {
        return {
          id: stored.id,
          email: stored.email,
          user_metadata: { full_name: stored.name, role: stored.roleLabel },
        };
      }
    }

    const all = userDb.getAllUsers();
    if (all.length > 0) {
      return {
        id: all[0].id,
        email: all[0].email,
        user_metadata: { full_name: all[0].name, role: all[0].roleLabel },
      };
    }

    return {
      id: "usr_guest",
      email: "guest@example.com",
      user_metadata: { full_name: "Entrepreneur" },
    };
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