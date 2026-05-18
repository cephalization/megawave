import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';

import logo from '~/assets/logo.svg';
import { authClient } from '~/auth/client';
import { WaveLoader } from '~/components/molecules/WaveLoader';
import { PageContainer } from '~/components/templates/PageContainer';
import { useAuthSettingsQuery } from '~/queries/hooks';

type AuthMode = 'signin' | 'signup';

export function Login() {
  const { data: settings, isLoading: settingsLoading } = useAuthSettingsQuery();

  if (settingsLoading) {
    return <WaveLoader />;
  }

  if (!settings?.enabled) {
    return <Navigate to="/" replace />;
  }

  return <EnabledLogin />;
}

function EnabledLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { data: settings } = useAuthSettingsQuery();
  const { data: session, isPending } = authClient.useSession();
  const from =
    (location.state as { from?: Location } | null)?.from?.pathname ?? '/';

  if (isPending) {
    return <WaveLoader />;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  const canSignUp = settings?.signupEnabled ?? false;
  const title = mode === 'signin' ? 'Sign in' : 'Create account';

  return (
    <PageContainer>
      <div className="flex w-full flex-1 flex-col items-center justify-center bg-background px-4 py-12 text-foreground">
        <div className="w-full max-w-xs">
          <div className="flex flex-col items-center">
            <img className="size-10" src={logo} alt="Megawave" />
            <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight text-balance">
              {title}
            </h1>
            {canSignUp ? (
              <p className="mt-2 text-center text-sm text-muted-foreground text-pretty">
                {mode === 'signin'
                  ? 'Need access?'
                  : 'Already have an account?'}{' '}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError(null);
                  }}
                >
                  {mode === 'signin' ? 'Create your account' : 'Sign in'}
                </button>
              </p>
            ) : null}
          </div>

          <form
            className="mt-8 flex flex-col gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setSubmitting(true);
              setError(null);
              try {
                const result =
                  mode === 'signin'
                    ? await authClient.signIn.email({
                        email,
                        password,
                        rememberMe,
                      })
                    : await authClient.signUp.email({
                        email,
                        password,
                        name,
                      });

                if (result.error) {
                  setError(result.error.message ?? 'Authentication failed');
                } else {
                  navigate(from, { replace: true });
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {mode === 'signup' ? (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-foreground"
                >
                  Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full appearance-none rounded-lg bg-white/5 px-3 py-2 text-base text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
                />
              </div>
            ) : null}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full appearance-none rounded-lg bg-white/5 px-3 py-2 text-base text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={
                  mode === 'signin' ? 'current-password' : 'new-password'
                }
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full appearance-none rounded-lg bg-white/5 px-3 py-2 text-base text-foreground ring-1 ring-white/10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm"
              />
            </div>
            {mode === 'signin' ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="group inline-grid size-5 grid-cols-1 sm:size-4">
                  <input
                    id="remember_me"
                    name="remember_me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="checked:border-primary checked:bg-primary focus-visible:outline-primary dark:checked:border-primary dark:checked:bg-primary dark:focus-visible:outline-primary col-start-1 row-start-1 appearance-none rounded-sm border border-white/10 bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 forced-colors:appearance-auto"
                  />
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    className="pointer-events-none col-start-1 row-start-1 size-7/8 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25 dark:group-has-disabled:stroke-white/25"
                  >
                    <path
                      d="M3 8L6 11L11 3.5"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="group-not-has-checked:opacity-0"
                    />
                  </svg>
                </span>
                <label
                  htmlFor="remember_me"
                  className="select-none text-muted-foreground"
                >
                  Remember me
                </label>
              </div>
            ) : null}
            {settings?.signupWhitelistEnabled && mode === 'signup' ? (
              <p className="text-sm text-muted-foreground text-pretty">
                Account creation is limited to email addresses approved by an
                admin.
              </p>
            ) : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="relative mt-2 w-full rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm ring-1 ring-primary hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
              <span
                className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-x-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
            </button>
          </form>
        </div>
      </div>
    </PageContainer>
  );
}
