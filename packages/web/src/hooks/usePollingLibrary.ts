import { useEffect, useState } from 'react';

import { useAppDispatch } from '~/hooks/useAppDispatch';
import { getStatus } from '~/queries/library';
import { fetchLibrary } from '~/store/slices/library/thunks';

export const usePollingLibrary = () => {
  const [loading, setLoading] = useState(true);
  const dispatch = useAppDispatch();
  // this is the worst
  useEffect(() => {
    async function init() {
      try {
        const status = await getStatus();
        if (status.data === 'loading') {
          // fetch status and library on 1 second timer until status is "idle"
          async function check() {
            const status = await getStatus();
            if (status.data !== 'idle') {
              setTimeout(check, 2500);
            } else {
              setLoading(false);
            }
            dispatch(fetchLibrary());
          }

          check();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error(error);
      }
    }
    init();
  }, [dispatch]);

  return { loading };
};
