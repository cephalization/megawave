import { EntityId } from '@reduxjs/toolkit';
import { useRef } from 'react';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';
import { librarySelectors } from '~/store/slices/library/selectors';

export function useTrackSelection(trackIDs: EntityId[]) {
  const dispatch = useAppDispatch();
  const selectedTracks = useAppSelector(librarySelectors.selectSelectedTracks);
  const lastSelectedRef = useRef<EntityId | null>(null);

  const handleTrackSelection = (trackId: EntityId, multiSelect: boolean) => {
    if (multiSelect) {
      if (
        lastSelectedRef.current &&
        trackIDs.includes(lastSelectedRef.current)
      ) {
        // Handle shift+click range selection
        const lastIndex = trackIDs.indexOf(lastSelectedRef.current);
        const currentIndex = trackIDs.indexOf(trackId);
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const newSelection = trackIDs.slice(start, end + 1);

        dispatch(libraryActions.setSelectedTracks({ trackIds: newSelection }));
      } else {
        // Handle cmd/ctrl+click for individual selection
        dispatch(libraryActions.toggleTrackSelection({ trackId }));
      }
    } else {
      // Single click selection
      dispatch(
        libraryActions.setSelectedTracks({
          trackIds: lastSelectedRef.current === trackId ? [] : [trackId],
        }),
      );
    }
    lastSelectedRef.current = trackId;
  };

  const clearSelection = () => {
    dispatch(libraryActions.clearTrackSelection());
    lastSelectedRef.current = null;
  };

  return {
    selectedTracks,
    handleTrackSelection,
    clearSelection,
  };
}
