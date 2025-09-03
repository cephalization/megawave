import { bindActionCreators, EntityId } from '@reduxjs/toolkit';

import { FullHeightContainer } from '~/components/atoms/FullHeightContainer/FullHeightContainer';
import { TrackList } from '~/components/molecules/TrackList';
import { useAppDispatch, useAppSelector } from '~/hooks';
import { useCurrentTrack } from '~/hooks/useCurrentTrack';
import { librarySelectors } from '~/store/slices/library/selectors';
import { playTrack } from '~/store/slices/player/player';

export const Recent = () => {
  const historyTrackIds = useAppSelector(librarySelectors.selectLibraryHistory);
  const currentTrack = useCurrentTrack();
  const dispatch = useAppDispatch();
  const play = bindActionCreators(playTrack, dispatch);

  const handlePlayTrackFromHistory = ({ trackId }: { trackId: EntityId }) => {
    play({ trackId, requeue: true, context: 'history', addHistory: false });
  };

  return (
    <FullHeightContainer>
      <TrackList
        context="history"
        trackIDs={historyTrackIds}
        onPlayTrackId={({ trackId }) =>
          trackId != null && handlePlayTrackFromHistory({ trackId })
        }
        onFilterLibrary={() => undefined}
        currentTrack={currentTrack}
      />
    </FullHeightContainer>
  );
};
