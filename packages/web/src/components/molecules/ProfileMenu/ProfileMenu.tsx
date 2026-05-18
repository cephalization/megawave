import { useNavigate } from 'react-router';

import { authClient } from '~/auth/client';
import { useAuthSettingsQuery } from '~/queries/hooks';

export const ProfileMenu = () => {
  const { data: settings } = useAuthSettingsQuery();

  if (!settings?.enabled) {
    return null;
  }

  return <AuthenticatedProfileMenu />;
};

const AuthenticatedProfileMenu = () => {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();

  if (!session) {
    return null;
  }

  return (
    <div className="ml-3 flex items-center gap-3 text-sm">
      <span className="hidden sm:inline text-muted-foreground">
        {session.user.email}
      </span>
      <button
        className="rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent"
        type="button"
        onClick={() =>
          authClient.signOut({
            fetchOptions: { onSuccess: () => navigate('/login') },
          })
        }
      >
        Sign out
      </button>
    </div>
  );
};
