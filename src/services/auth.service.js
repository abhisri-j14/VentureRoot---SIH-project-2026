import { supabase } from "@/lib/supabase";
import { mapAuthError } from "@/errors/auth-error";
import { userDb } from "@/lib/server/jsonDb";
import { UnauthorizedError, BadRequestError } from "@/errors/http-error";

const isPrototypeMode =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "json" ||
  !process.env.SUPABASE_URL;

export async function registerUser({
  email,
  password,
  fullName,
}) {
  if (isPrototypeMode) {
    const existing = userDb.findUserByEmail(email);
    if (existing) {
      throw new BadRequestError("User with this email already exists");
    }

    const newUser = await userDb.createUser({
      name: fullName || email.split("@")[0],
      email,
      password,
    });

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        user_metadata: { full_name: newUser.name, role: newUser.roleLabel },
      },
      session: {
        access_token: `vr-token-${newUser.id}`,
        refresh_token: `vr-refresh-${newUser.id}`,
      },
    };
  }

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
    });

  if (error) {
    throw mapAuthError(error);
  }

  return data;
}

export async function loginUser({
  email,
  password,
}) {
  if (isPrototypeMode) {
    const user = userDb.authenticateUser(email, password);
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.name, role: user.roleLabel },
      },
      session: {
        access_token: `vr-token-${user.id}`,
        refresh_token: `vr-refresh-${user.id}`,
      },
    };
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw mapAuthError(error);
  }

  return data;
}

export async function getCurrentUser(accessToken) {
  if (isPrototypeMode) {
    if (!accessToken) return null;
    const cleanToken = accessToken.startsWith("Bearer ")
      ? accessToken.slice(7)
      : accessToken;

    let userId = null;
    if (cleanToken.startsWith("vr-token-")) {
      userId = cleanToken.replace("vr-token-", "");
    } else if (cleanToken.startsWith("mock-token-")) {
      userId = cleanToken.replace("mock-token-", "");
    } else if (cleanToken !== "demo-token") {
      userId = cleanToken;
    }

    if (userId) {
      const user = userDb.findUserById(userId);
      if (user) {
        return {
          id: user.id,
          email: user.email,
          user_metadata: { full_name: user.name, role: user.roleLabel },
        };
      }
    }

    // Check first available user
    const users = userDb.getAllUsers();
    if (users.length > 0) {
      const u = users[0];
      return {
        id: u.id,
        email: u.email,
        user_metadata: { full_name: u.name, role: u.roleLabel },
      };
    }
    return null;
  }

  const { data, error } =
    await supabase.auth.getUser(accessToken);

  if (error || !data?.user) {
    throw mapAuthError(error);
  }

  return data.user;
}

export async function refreshUserSession(
  refreshToken
) {
  if (isPrototypeMode) {
    return {
      session: {
        access_token: `vr-token-${Date.now()}`,
        refresh_token: refreshToken,
      },
    };
  }

  const { data, error } =
    await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

  if (error) {
    throw mapAuthError(error);
  }

  return data;
}



