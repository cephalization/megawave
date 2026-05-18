export type AuthSettings = {
  enabled: boolean;
  signupEnabled: boolean;
  signupWhitelistEnabled: boolean;
};

export type AuthMe = {
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
  isAdmin: boolean;
};

export type SignupWhitelistEntry = {
  id: number;
  email: string;
  createdBy: string | null;
  createdAt: string | Date;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: Date;
  banned: boolean | null;
  isAdmin: boolean;
};

export async function getAuthSettings(): Promise<AuthSettings> {
  const res = await fetch('/api/auth-settings');
  if (!res.ok) {
    throw new Error('Failed to load auth settings');
  }
  return res.json();
}

export async function getAuthMe(): Promise<AuthMe> {
  const res = await fetch('/api/me');
  if (!res.ok) {
    throw new Error('Failed to load auth user');
  }
  return res.json();
}

export async function getSignupWhitelist(): Promise<SignupWhitelistEntry[]> {
  const res = await fetch('/api/admin/signup-whitelist');
  if (!res.ok) {
    throw new Error('Failed to load signup whitelist');
  }
  const data = await res.json();
  return data.entries;
}

export async function addSignupWhitelistEmail(email: string) {
  const res = await fetch('/api/admin/signup-whitelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error('Failed to add signup whitelist email');
  }
  return res.json();
}

export async function deleteSignupWhitelistEmail(email: string) {
  const res = await fetch(
    `/api/admin/signup-whitelist/${encodeURIComponent(email)}`,
    {
      method: 'DELETE',
    },
  );
  if (!res.ok) {
    throw new Error('Failed to remove signup whitelist email');
  }
  return res.json();
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch('/api/admin/users');
  if (!res.ok) {
    throw new Error('Failed to load users');
  }
  const data = await res.json();
  return data.users;
}

export const authApi = {
  getAuthSettings,
  getAuthMe,
  getSignupWhitelist,
  addSignupWhitelistEmail,
  deleteSignupWhitelistEmail,
  getAdminUsers,
};
