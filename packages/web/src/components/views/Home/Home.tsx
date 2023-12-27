import React, { useCallback, useState } from 'react';

import { DividingHeader } from '~/components/atoms/DividingHeader';
import { Controls } from '~/components/molecules/Controls/Controls';
import { Library } from '~/components/molecules/Library';
import { Nav } from '~/components/molecules/Nav';
import { SearchHeader } from '~/components/molecules/SearchHeader';
import { TrackCount } from '~/components/molecules/TrackCount';
import { PageContainer } from '~/components/templates/PageContainer';
import { PlayerProvider } from '~/context/PlayerContext';
import { usePollingLibrary } from '~/hooks/usePollingLibrary';

export function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const toggleNavOpen = useCallback(() => setNavOpen((o) => !o), [setNavOpen]);
  const { loading } = usePollingLibrary();

  return (
    <PlayerProvider>
      <PageContainer>
        <Nav open={navOpen} toggleNav={toggleNavOpen} />
        {/* Main column */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <SearchHeader onToggleNavigationOpen={toggleNavOpen} />
          <main
            className="flex-1 @container flex-col flex-nowrap relative z-0 overflow-hidden focus:outline-none"
            tabIndex={0}
            id="library-container"
          >
            {/* Page title & actions */}
            <DividingHeader>Library</DividingHeader>
            <TrackCount loading={loading} />
            {/* Library table */}
            <Library />
            <Controls />
          </main>
        </div>
      </PageContainer>
    </PlayerProvider>
  );
}
