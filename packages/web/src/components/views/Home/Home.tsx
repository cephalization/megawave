import { DividingHeader } from '~/components/atoms/DividingHeader';
import { Library } from '~/components/molecules/Library';
import { TrackCount } from '~/components/molecules/TrackCount';
import { usePollingLibrary } from '~/hooks/usePollingLibrary';

export function Home() {
  const { loading } = usePollingLibrary();

  return (
    <>
      {/* Page title & actions */}
      <DividingHeader>Library</DividingHeader>
      <TrackCount loading={loading} />
      {/* Library table */}
      <Library />
    </>
  );
}
