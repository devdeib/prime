import {
  buildLoginResponse,
  loadStore,
  type MockStoredUser,
} from "@/lib/mock-backend-store";
import type { LoginResponse } from "@/data/types/auth";

export function mockAuthorizeCredentials(
  email: string | undefined,
  password: string | undefined
): LoginResponse | null {
  if (!email || password === undefined) return null;
  const store = loadStore();
  const u = store.users.find(
    (x) => x.email.toLowerCase() === email.toLowerCase()
  );
  if (!u || u.password !== password) return null;
  return buildLoginResponse(u) as unknown as LoginResponse;
}

export function findMockUserByEmail(email: string): MockStoredUser | undefined {
  const store = loadStore();
  return store.users.find(
    (x) => x.email.toLowerCase() === email.toLowerCase()
  );
}
