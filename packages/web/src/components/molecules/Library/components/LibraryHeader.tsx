import clsx from 'clsx';
import React from 'react';

export const styles = {
  headerItem: 'text-sm leading-6 text-gray-500 font-semibold',
  rowPadding: 'px-5 sm:px-6 lg:px-8 py-1',
} as const;

export const sectionWidthRatio = {
  title: 4,
  artist: 3,
  album: 4,
  duration: 1,
} as const;

export function LibraryHeader() {
  return (
    <div
      className={clsx(
        'flex w-full border-t border-gray-200',
        styles.rowPadding,
      )}
    >
      <div className="flex-1" style={{ flexGrow: sectionWidthRatio.title }}>
        <h2 className="text-sm leading-6 text-gray-500 font-semibold">Title</h2>
      </div>
      <div
        className="sm:flex-1 sm:flex hidden"
        style={{ flexGrow: sectionWidthRatio.artist }}
      >
        <h2 className={clsx(styles.headerItem)}>Artist</h2>
      </div>
      <div
        className="sm:flex-1 sm:flex hidden"
        style={{ flexGrow: sectionWidthRatio.album }}
      >
        <h2 className={clsx(styles.headerItem)}>Album</h2>
      </div>
      <div
        className="sm:flex-1 sm:flex hidden justify-end"
        style={{ flexGrow: sectionWidthRatio.duration }}
      >
        <h2 className={clsx(styles.headerItem)}>Duration</h2>
      </div>
    </div>
  );
}
