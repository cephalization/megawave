import { EntityId } from '@reduxjs/toolkit';
import { useRef } from 'react';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';
import { librarySelectors } from '~/store/slices/library/selectors';

export function useTrackSelection(trackIDs: EntityId[]) {
  const dispatch = useAppDispatch();
  const selectedTracks = useAppSelector(librarySelectors.selectSelectedTracks);
  const lastSelectedRef = useRef<EntityId | null>(null);

  const handleTrackSelection = (
    trackId: EntityId,
    multiSelect: boolean,
    cmdSelect: boolean,
  ) => {
    if (multiSelect) {
      if (
        lastSelectedRef.current &&
        trackIDs.includes(lastSelectedRef.current)
      ) {
        // Handle shift+click range selection
        const lastSelectedIndex = trackIDs.indexOf(lastSelectedRef.current);
        const currentIndex = trackIDs.indexOf(trackId);
        const start = Math.min(lastSelectedIndex, currentIndex);
        const end = Math.max(lastSelectedIndex, currentIndex) + 1;

        // Get all tracks in the range
        const rangeSelection = trackIDs.slice(start, end);

        // Combine existing selection with new range
        const newSelection = Array.from(
          new Set([...selectedTracks, ...rangeSelection]),
        );

        dispatch(libraryActions.setSelectedTracks({ trackIds: newSelection }));
      } else {
        // If no previous selection, treat as single selection
        dispatch(libraryActions.setSelectedTracks({ trackIds: [trackId] }));
      }
    } else if (cmdSelect) {
      // Handle cmd/ctrl+click to toggle individual tracks while maintaining existing selection
      if (selectedTracks.includes(trackId)) {
        dispatch(
          libraryActions.setSelectedTracks({
            trackIds: selectedTracks.filter((id) => id !== trackId),
          }),
        );
      } else {
        dispatch(
          libraryActions.setSelectedTracks({
            trackIds: [...selectedTracks, trackId],
          }),
        );
      }
    } else {
      // Single click selection
      dispatch(
        libraryActions.setSelectedTracks({
          trackIds: lastSelectedRef.current === trackId ? [] : [trackId],
        }),
      );
    }

    // Update last selected track reference
    if (lastSelectedRef.current !== trackId) {
      lastSelectedRef.current = trackId;
    } else if (!multiSelect && !cmdSelect) {
      lastSelectedRef.current = null;
    }
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
