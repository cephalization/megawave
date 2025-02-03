import { Popover, PopoverPanel } from '@headlessui/react';
import {
  Bars4Icon,
  PlayIcon,
  QueueListIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { EntityId } from '@reduxjs/toolkit';
import clsx from 'clsx';
import React from 'react';

import { useAppDispatch } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';

type SelectionToolbarProps = {
  selectedTracks: EntityId[];
  onAddToPlaylist: (trackIds: EntityId[]) => void;
  onQueueTracks: (trackIds: EntityId[]) => void;
};

export function SelectionToolbar({
  selectedTracks,
  onAddToPlaylist,
  onQueueTracks,
}: SelectionToolbarProps) {
  const dispatch = useAppDispatch();

  if (selectedTracks.length === 0) return null;

  return (
    <Popover className="relative">
      <PopoverPanel
        static
        as="div"
        transition
        className={clsx(
          'fixed bottom-24 left-1/2 -translate-x-1/2 lg:ml-64 lg:left-1/2 lg:-translate-x-full bg-gray-800 text-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-4',
        )}
      >
        <div className="text-sm font-medium">
          {selectedTracks.length} track{selectedTracks.length !== 1 ? 's' : ''}{' '}
          selected
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddToPlaylist(selectedTracks)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Add to playlist"
          >
            <Bars4Icon className="h-5 w-5" />
          </button>
          <button
            onClick={() => onQueueTracks(selectedTracks)}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Add to queue"
          >
            <QueueListIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => dispatch(libraryActions.clearTrackSelection())}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            title="Clear selection"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
