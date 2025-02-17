/* This example requires Tailwind CSS v2.0+ */
import {
  Dialog,
  DialogBackdrop,
  DialogTitle,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Transition,
  TransitionChild,
} from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { bindActionCreators, EntityId } from '@reduxjs/toolkit';
import React, { useMemo, useState } from 'react';

import { TrackList } from '~/components/molecules/TrackList';
import { useAppDispatch, useAppSelector } from '~/hooks';
import { useCurrentTrack } from '~/hooks/useCurrentTrack';
import { librarySelectors } from '~/store/slices/library/selectors';
import { playTrack } from '~/store/slices/player/player';

type PlayHistoryProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

function PlayHistoryComponent({ open, setOpen }: PlayHistoryProps) {
  const dispatch = useAppDispatch();
  const play = bindActionCreators(playTrack, dispatch);
  const historyTrackIds = useAppSelector(librarySelectors.selectLibraryHistory);
  const queueTrackIds = useAppSelector(librarySelectors.selectLibraryQueue);
  const currentTrack = useCurrentTrack();
  const [selectedTab, setSelectedTab] = useState(0);

  const queueTrackIdsFromCurrentTrack = useMemo(() => {
    if (!currentTrack) {
      return queueTrackIds;
    }
    // get the _last_ index of the current track in the queue
    const currentTrackIndex = queueTrackIds.lastIndexOf(currentTrack.id);
    return queueTrackIds.slice(currentTrackIndex);
  }, [queueTrackIds, currentTrack]);

  const handlePlayTrackFromQueue = ({ trackId }: { trackId: EntityId }) => {
    play({ trackId, requeue: true, context: 'queue' });
  };

  const handlePlayTrackFromHistory = ({ trackId }: { trackId: EntityId }) => {
    play({ trackId, requeue: true, context: 'history', addHistory: false });
  };

  return (
    <Transition show={open}>
      <Dialog
        static
        className="relative z-50 overflow-hidden"
        open={open}
        onClose={setOpen}
      >
        <DialogBackdrop
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/30"
        />

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <TransitionChild
            enter="transform transition ease-in-out duration-500 sm:duration-700"
            enterFrom="translate-x-full"
            enterTo="translate-x-0"
            leave="transform transition ease-in-out duration-500 sm:duration-700"
            leaveFrom="translate-x-0"
            leaveTo="translate-x-full"
          >
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col py-6 bg-card @container shadow-xl">
                <div className="px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <DialogTitle className="text-lg font-medium text-foreground">
                      Play Queue & History
                    </DialogTitle>
                    <div className="ml-3 h-7 flex items-center">
                      <button
                        className="bg-card rounded-md text-muted-foreground hover:text-foreground focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setOpen(false)}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-4 h-full">
                  <TabGroup
                    selectedIndex={selectedTab}
                    onChange={setSelectedTab}
                    className="h-full"
                  >
                    <TabList className="flex space-x-1 rounded-xl bg-card p-1 mx-4 transition-colors duration-300">
                      <Tab
                        className={({ selected }) =>
                          `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                          ${
                            selected
                              ? 'bg-accent text-primary shadow-sm'
                              : 'text-muted-foreground hover:bg-accent/[0.12] hover:text-foreground'
                          }`
                        }
                      >
                        Queue
                      </Tab>
                      <Tab
                        className={({ selected }) =>
                          `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                          ${
                            selected
                              ? 'bg-accent text-primary shadow-sm'
                              : 'text-muted-foreground bg-accent/[0.12] hover:bg-accent/[0.24] hover:text-foreground'
                          }`
                        }
                      >
                        History
                      </Tab>
                    </TabList>
                    <TabPanels className="mt-2 h-full">
                      <TabPanel className="h-full">
                        <div
                          id="queue-container"
                          className="relative flex-1 max-h-[calc(100vh-120px)] overflow-y-auto h-full"
                        >
                          <TrackList
                            context="library"
                            containerId="queue-container"
                            trackIDs={queueTrackIdsFromCurrentTrack}
                            onPlayTrackId={({ trackId }) =>
                              trackId != null &&
                              handlePlayTrackFromQueue({ trackId })
                            }
                            onFilterLibrary={() => undefined}
                            currentTrack={currentTrack}
                          />
                        </div>
                      </TabPanel>
                      <TabPanel className="h-full">
                        <div
                          id="history-container"
                          className="relative flex-1 max-h-[calc(100vh-120px)] overflow-y-auto h-full"
                        >
                          <TrackList
                            context="history"
                            containerId="history-container"
                            trackIDs={historyTrackIds}
                            onPlayTrackId={({ trackId }) =>
                              trackId != null &&
                              handlePlayTrackFromHistory({ trackId })
                            }
                            onFilterLibrary={() => undefined}
                            currentTrack={currentTrack}
                          />
                        </div>
                      </TabPanel>
                    </TabPanels>
                  </TabGroup>
                </div>
              </div>
            </div>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export const PlayHistory = React.memo(PlayHistoryComponent);
