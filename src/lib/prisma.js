/**
 * Standalone Prisma proxy for prototype mode
 * Safely resolves database queries to null so fallback handlers can activate smoothly
 */

function createMockPrisma() {
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === "$connect" || prop === "$disconnect") {
          return async () => {};
        }
        return new Proxy(
          {},
          {
            get(t, method) {
              return async () => null;
            },
          }
        );
      },
    }
  );
}

export const prisma = createMockPrisma();