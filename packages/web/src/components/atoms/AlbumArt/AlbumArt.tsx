import {
  Dialog,
  DialogBackdrop,
  Transition,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react';
import { MusicalNoteIcon } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import React, { useState } from 'react';

interface AlbumArtProps {
  src?: string;
  alt?: string;
  className?: string;
}

export function AlbumArt({ src, alt, className }: AlbumArtProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (!src) {
    return (
      <div
        className={clsx(
          className,
          'bg-muted transition-colors flex items-center justify-center shrink-0',
        )}
      >
        <MusicalNoteIcon className="w-1/2 h-1/2 text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <button
        className={clsx(className, 'cursor-pointer shrink-0')}
        onClick={() => setIsDialogOpen(true)}
        type="button"
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      </button>
      <Transition show={isDialogOpen} as={React.Fragment}>
        <Dialog
          static
          open={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          className="fixed inset-0 z-50 overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <DialogBackdrop className="fixed inset-0 bg-black/50" />
            </TransitionChild>

            <TransitionChild
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="relative max-w-3xl w-full">
                <img
                  src={src}
                  alt={alt}
                  className="w-full h-auto rounded-lg shadow-xl"
                />
                <button
                  className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/75"
                  onClick={() => setIsDialogOpen(false)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
