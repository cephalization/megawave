import clsx from 'clsx';
import React from 'react';

const styles = {
  headerItem: 'text-sm leading-6 text-gray-500 font-semibold',
} as const;

export const sectionWidthRatio = {
  title: 3,
  artist: 2,
  album: 1,
  duration: 1,
} as const;

export function LibraryHeader() {
  return (
    <div className="flex w-full pl-5 sm:pl-6 lg:pl-8 py-1 border-t border-gray-200">
      <div className="flex-1" style={{ flexGrow: sectionWidthRatio.title }}>
        <h2 className="text-sm leading-6 text-gray-500 font-semibold">Title</h2>
      </div>
      <div className="flex-1">
        <h2
          className={clsx(styles.headerItem)}
          style={{ flexGrow: sectionWidthRatio.artist }}
        >
          Artist
        </h2>
      </div>
      <div className="flex-1">
        <h2
          className={clsx(styles.headerItem)}
          style={{ flexGrow: sectionWidthRatio.album }}
        >
          Album
        </h2>
      </div>
      <div className="flex-1">
        <h2
          className={clsx(styles.headerItem)}
          style={{ flexGrow: sectionWidthRatio.duration }}
        >
          Duration
        </h2>
      </div>
    </div>
  );
}
