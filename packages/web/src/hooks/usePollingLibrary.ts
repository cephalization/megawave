import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { libraryQueryKeys, useLibraryStatusQuery } from '~/queries/hooks';

export const usePollingLibrary = () => {
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useLibraryStatusQuery();

  useEffect(() => {
    if (!status?.scanActive) {
      return;
    }

    const refreshLibraryQueries = () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'tracks'] });
      queryClient.invalidateQueries({ queryKey: ['library', 'albums'] });
      queryClient.invalidateQueries({ queryKey: ['library', 'artists'] });
    };

    refreshLibraryQueries();
    const intervalId = window.setInterval(refreshLibraryQueries, 2_500);
    return () => window.clearInterval(intervalId);
  }, [queryClient, status?.scanActive]);

  return { loading: isLoading || !!status?.scanActive };
};
