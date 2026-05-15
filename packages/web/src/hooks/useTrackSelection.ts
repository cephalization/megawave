import { useRef } from 'react';

import { usePlayerStore } from '~/store/playerStore';
import type { Track } from '~/types/library';

export function useTrackSelection(trackIDs: Track['id'][]) {
  const selectedTracks = usePlayerStore((state) => state.selectedTrackIds);
  const setSelectedTracks = usePlayerStore(
    (state) => state.setSelectedTrackIds,
  );
  const clearSelectedTracks = usePlayerStore(
    (state) => state.clearSelectedTrackIds,
  );
  const lastSelectedRef = useRef<Track['id'] | null>(null);

  const handleTrackSelection = (
    trackId: Track['id'],
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

        setSelectedTracks(newSelection);
      } else {
        // If no previous selection, treat as single selection
        setSelectedTracks([trackId]);
      }
    } else if (cmdSelect) {
      // Handle cmd/ctrl+click to toggle individual tracks while maintaining existing selection
      if (selectedTracks.includes(trackId)) {
        setSelectedTracks(selectedTracks.filter((id) => id !== trackId));
      } else {
        setSelectedTracks([...selectedTracks, trackId]);
      }
    } else {
      // Single click selection
      setSelectedTracks(lastSelectedRef.current === trackId ? [] : [trackId]);
    }

    // Update last selected track reference
    if (lastSelectedRef.current !== trackId) {
      lastSelectedRef.current = trackId;
    } else if (!multiSelect && !cmdSelect) {
      lastSelectedRef.current = null;
    }
  };

  const clearSelection = () => {
    clearSelectedTracks();
    lastSelectedRef.current = null;
  };

  return {
    selectedTracks,
    handleTrackSelection,
    clearSelection,
  };
}
