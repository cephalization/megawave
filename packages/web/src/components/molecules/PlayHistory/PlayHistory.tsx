/* This example requires Tailwind CSS v2.0+ */
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { bindActionCreators } from '@reduxjs/toolkit';
import React from 'react';
import { Fragment } from 'react';

import { TrackList } from '~/components/molecules/TrackList';
import { useAppDispatch, useAppSelector } from '~/hooks';
import { librarySelectors } from '~/store/slices/library/selectors';
import { playTrack } from '~/store/slices/player/player';

type PlayHistoryProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

function PlayHistoryComponent({ open, setOpen }: PlayHistoryProps) {
  const dispatch = useAppDispatch();
  const play = bindActionCreators(playTrack, dispatch);
  const trackIds = useAppSelector(librarySelectors.selectLibraryHistory);
  const currentTrack = useAppSelector(
    librarySelectors.selectLibraryActiveTrack,
  );
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed inset-0 overflow-hidden"
        open={open}
        onClose={setOpen}
      >
        <div className="absolute inset-0 overflow-hidden">
          <Dialog.Overlay className="absolute inset-0" />

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-500 sm:duration-700"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-500 sm:duration-700"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col py-6 bg-white @container shadow-xl">
                  <div className="px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg font-medium text-gray-900">
                        Play History
                      </Dialog.Title>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          onClick={() => setOpen(false)}
                        >
                          <span className="sr-only">Close panel</span>
                          <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    id="history-container"
                    className="mt-6 relative flex-1 max-h-full overflow-y-auto"
                  >
                    <TrackList
                      context="history"
                      containerId="history-container"
                      trackIDs={trackIds}
                      onPlayTrackId={play}
                      onFilterLibrary={() => undefined}
                      currentTrack={currentTrack}
                    />
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export const PlayHistory = React.memo(PlayHistoryComponent);
