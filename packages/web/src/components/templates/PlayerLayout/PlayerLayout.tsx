import { useCallback, useState } from 'react';
import { Outlet } from 'react-router';

import { Controls } from '~/components/molecules/Controls';
import { Nav } from '~/components/molecules/Nav';
import { SearchHeader } from '~/components/molecules/SearchHeader';
import { PageContainer } from '~/components/templates/PageContainer';
import { PlayerProvider } from '~/context/PlayerContext';

export const PlayerLayout = () => {
  const [navOpen, setNavOpen] = useState(false);
  const toggleNavOpen = useCallback(() => setNavOpen((o) => !o), [setNavOpen]);
  return (
    <PlayerProvider>
      <PageContainer>
        <Nav open={navOpen} toggleNav={toggleNavOpen} />
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <SearchHeader onToggleNavigationOpen={toggleNavOpen} />
          <main
            className="flex-1 @container flex-col flex-nowrap relative z-0 overflow-hidden focus:outline-hidden"
            tabIndex={0}
            id="library-container"
          >
            <Outlet />
            <Controls />
          </main>
        </div>
      </PageContainer>
    </PlayerProvider>
  );
};
