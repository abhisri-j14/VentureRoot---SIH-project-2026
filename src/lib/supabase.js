/**
 * Standalone Supabase client for prototype mode
 * Prevents build failures when @supabase/supabase-js is not installed
 */

class MockSupabaseAuth {
  async signUp({ email, password }) {
    return {
      data: {
        user: { id: "user-ent-001", email, user_metadata: { name: "Ravi Kumar" } },
        session: { access_token: "demo-token", refresh_token: "demo-refresh" },
      },
      error: null,
    };
  }

  async signInWithPassword({ email, password }) {
    return {
      data: {
        user: { id: "user-ent-001", email, user_metadata: { name: "Ravi Kumar" } },
        session: { access_token: "demo-token", refresh_token: "demo-refresh" },
      },
      error: null,
    };
  }

  async getUser(accessToken) {
    return {
      data: {
        user: {
          id: "user-ent-001",
          email: "ravi@example.com",
          user_metadata: { name: "Ravi Kumar" },
        },
      },
      error: null,
    };
  }

  async refreshSession() {
    return {
      data: {
        session: { access_token: "demo-token", refresh_token: "demo-refresh" },
        user: { id: "user-ent-001", email: "ravi@example.com" },
      },
      error: null,
    };
  }
}

export const supabase = {
  auth: new MockSupabaseAuth(),
};
