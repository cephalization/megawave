import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from '@headlessui/react';
import { useState } from 'react';

import { getArrayString } from '~/utils/trackMeta';

import { AlbumArt } from '../AlbumArt/AlbumArt';

type CurrentTrackProps = {
  title?: string;
  artist?: string | string[] | null;
  art?: string;
};

export function CurrentTrack({ title, artist, art }: CurrentTrackProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-center gap-2 flex-shrink w-full cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <AlbumArt
          className="h-12 w-12 flex-shrink-0 hidden sm:flex"
          src={art}
          alt={`Album art for ${title} by ${artist}`}
        />
        <div className="flex flex-col min-w-0 w-full">
          <div className="text-sm font-bold truncate max-w-full">
            {title || 'No track playing'}
          </div>
          <div className="text-xs text-gray-500 truncate max-w-full">
            {getArrayString(artist)}
          </div>
        </div>
      </div>

      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-sm rounded bg-white p-6 shadow-xl overflow-y-auto overflow-x-hidden max-h-[90vh]">
            <div className="flex items-center gap-4">
              <AlbumArt
                className="h-24 w-24 flex-shrink-0"
                src={art}
                alt={`Album art for ${title} by ${artist}`}
              />
              <div>
                <DialogTitle className="text-lg font-medium whitespace-pre-wrap break-all">
                  {title || 'No track playing'}
                </DialogTitle>
                <Description className="text-sm text-gray-500 mt-1 whitespace-pre-wrap break-all">
                  {getArrayString(artist)}
                </Description>
              </div>
            </div>

            <button
              className="mt-4 w-full rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
