export type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  created_at: string | null;
};

export type CreateProfilePayload = {
  userId: string;
  email: string;
  username: string;
};

