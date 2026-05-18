import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Navigate } from 'react-router';

import { PageContainer } from '~/components/templates/PageContainer';
import { authApi, type AdminUser } from '~/queries/auth';
import {
  authQueryKeys,
  useAdminUsersQuery,
  useAuthMeQuery,
  useSignupWhitelistQuery,
} from '~/queries/hooks';

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function Admin() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data: me, isLoading: meLoading } = useAuthMeQuery(true);
  const { data: entries = [], isLoading } = useSignupWhitelistQuery(
    !!me?.isAdmin,
  );
  const { data: users = [], isLoading: usersLoading } = useAdminUsersQuery(
    !!me?.isAdmin,
  );

  const invalidateWhitelist = () =>
    queryClient.invalidateQueries({ queryKey: authQueryKeys.signupWhitelist });

  const addEmail = useMutation({
    mutationFn: authApi.addSignupWhitelistEmail,
    onSuccess: () => {
      setEmail('');
      setError(null);
      invalidateWhitelist();
    },
    onError: (error) => setError(error.message),
  });

  const deleteEmail = useMutation({
    mutationFn: authApi.deleteSignupWhitelistEmail,
    onSuccess: invalidateWhitelist,
    onError: (error) => setError(error.message),
  });

  if (!meLoading && !me?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageContainer>
      <main className="w-full flex-1 bg-background px-4 py-8 text-foreground sm:px-8">
        <div className="mx-auto max-w-2xl">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
            <p className="mt-2 text-sm text-muted-foreground text-pretty">
              Manage email addresses allowed to create Megawave accounts when
              signup whitelist mode is enabled.
            </p>
          </header>

          <section className="mt-8">
            <h2 className="text-base font-medium">Signup Whitelist</h2>
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                addEmail.mutate(email);
              }}
            >
              <input
                name="email"
                type="email"
                value={email}
                placeholder="listener@example.com"
                required
                onChange={(event) => setEmail(event.target.value)}
                className="min-w-0 flex-1 appearance-none rounded-lg bg-white/5 px-3 py-1.5 text-base text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              />
              <button
                type="submit"
                disabled={addEmail.isPending}
                className="relative rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-foreground ring-1 ring-white/10 hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                Add
                <span
                  className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-x-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
              </button>
            </form>

            {error ? (
              <p className="mt-3 text-sm text-red-400">{error}</p>
            ) : null}

            <div className="mt-6 divide-y divide-white/10 rounded-lg ring-1 ring-white/10">
              {isLoading ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  Loading...
                </p>
              ) : entries.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  No whitelist entries yet.
                </p>
              ) : (
                entries.map((entry) => (
                  <div
                    key={entry.email}
                    className="flex items-center justify-between gap-4 px-4 py-3"
                  >
                    <span className="truncate text-sm">{entry.email}</span>
                    <button
                      type="button"
                      disabled={deleteEmail.isPending}
                      onClick={() => deleteEmail.mutate(entry.email)}
                      className="relative shrink-0 text-sm font-medium text-red-400 hover:text-red-300 disabled:opacity-50"
                    >
                      Remove
                      <span
                        className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-x-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="mt-12">
            <h2 className="text-base font-medium">Users</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {usersLoading
                ? 'Loading...'
                : `${users.length} registered ${users.length === 1 ? 'user' : 'users'}`}
            </p>

            <div className="-mx-4 -my-2 mt-4 overflow-x-auto whitespace-nowrap sm:-mx-8">
              <div className="inline-block min-w-full px-4 py-2 align-middle sm:px-8">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-left text-sm text-muted-foreground">
                      <th className="whitespace-nowrap pb-3 pr-3 font-medium">
                        Name
                      </th>
                      <th className="whitespace-nowrap px-3 pb-3 font-medium">
                        Email
                      </th>
                      <th className="whitespace-nowrap px-3 pb-3 font-medium">
                        Role
                      </th>
                      <th className="whitespace-nowrap px-3 pb-3 font-medium">
                        Created
                      </th>
                      <th className="whitespace-nowrap pb-3 pl-3 font-medium">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {usersLoading ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-sm text-muted-foreground"
                        >
                          Loading...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-4 text-center text-sm text-muted-foreground"
                        >
                          No users yet.
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <UserRow key={user.id} user={user} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PageContainer>
  );
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <tr className="text-sm">
      <td className="whitespace-nowrap py-3 pr-3">
        <span className="font-medium text-foreground">{user.name}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
        {user.email}
      </td>
      <td className="whitespace-nowrap px-3 py-3">
        {user.isAdmin ? (
          <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-primary/20">
            Admin
          </span>
        ) : (
          <span className="text-muted-foreground">User</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-muted-foreground tabular-nums">
        {formatDate(user.createdAt)}
      </td>
      <td className="whitespace-nowrap py-3 pl-3">
        {user.banned ? (
          <span className="inline-flex items-center rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
            Banned
          </span>
        ) : (
          <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-emerald-500/20">
            Active
          </span>
        )}
      </td>
    </tr>
  );
}
