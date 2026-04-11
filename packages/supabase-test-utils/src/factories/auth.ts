import { createTestId } from "../testIds";
import {
  getSupabaseAdminClient,
  getSupabaseAnonClient,
} from "../supabaseTestClient";

type TestUser = {
  userId: string;
  email: string;
  password: string;
  client: ReturnType<typeof getSupabaseAnonClient>;
};

type CreatedTestUser = {
  userId: string;
  email: string;
  password: string;
};

export const createTestUser = async (): Promise<CreatedTestUser> => {
  const admin = getSupabaseAdminClient();

  const uniqueId = createTestId("user");
  const email = `${uniqueId}@example.com`;
  const password = "TestPassword123!";

  const { data: createdUser, error: createUserError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (createUserError || !createdUser.user) {
    throw createUserError ?? new Error("Failed to create auth user");
  }

  const userId = createdUser.user.id;
  const usernameUniqueId = createTestId("username");

  const { error: profileError } = await admin.from("profiles").insert({
    id: userId,
    email,
    username: usernameUniqueId,
  });

  if (profileError) throw profileError;

  return {
    userId,
    email,
    password,
  };
};

export const createAuthenticatedTestUser = async (): Promise<TestUser> => {
  const anon = getSupabaseAnonClient();

  const { userId, email, password } = await createTestUser();

  const { data: signInData, error: signInError } =
    await anon.auth.signInWithPassword({
      email,
      password,
    });

  if (signInError || !signInData.session) {
    throw new Error(
      `Failed to authenticate test user: ${signInError?.message ?? "Unknown error"}`,
    );
  }

  const authenticatedClient = getSupabaseAnonClient();

  const { error: sessionError } = await authenticatedClient.auth.setSession({
    access_token: signInData.session.access_token,
    refresh_token: signInData.session.refresh_token,
  });

  if (sessionError) {
    throw new Error(
      `Failed to set session on authenticated client: ${sessionError.message}`,
    );
  }

  return {
    userId,
    email,
    password,
    client: authenticatedClient,
  };
};
