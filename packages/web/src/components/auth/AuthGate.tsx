import type React from 'react';
import { Navigate, useLocation } from 'react-router';

import { authClient } from '~/auth/client';
import { WaveLoader } from '~/components/molecules/WaveLoader';
import { useAuthSettingsQuery } from '~/queries/hooks';

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const location = useLocation();
  const { data: settings, isLoading: settingsLoading } = useAuthSettingsQuery();

  if (settingsLoading) {
    return <WaveLoader />;
  }

  if (!settings?.enabled) {
    return children;
  }

  return <EnabledAuthGate location={location}>{children}</EnabledAuthGate>;
}

function EnabledAuthGate({
  children,
  location,
}: AuthGateProps & { location: ReturnType<typeof useLocation> }) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <WaveLoader />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
