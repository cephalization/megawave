import clsx from 'clsx';
import React from 'react';

import { Track } from '~/types/library';
import { sectionWidthRatio } from './LibraryHeader';

const styles = {
  headerItem:
    'text-sm leading-6 text-gray-700 font-bold overflow-ellipsis whitespace-nowrap overflow-hidden',
} as const;

type LibraryRowProps = {
  track: Track;
  style: React.CSSProperties;
};

export function LibraryRow({ track, style }: LibraryRowProps) {
  const { name, artist, album, link } = track;
  return (
    <div style={style}>
      <div className="flex h-full w-full pl-5 sm:pl-6 lg:pl-8">
        <div
          className="flex-1 min-w-0"
          style={{ flexGrow: sectionWidthRatio.title }}
        >
          <h2 className={clsx(styles.headerItem)}>
            <a
              href={link}
              className="hover:text-blue-700 transition-colors duration-300"
            >
              {name}
            </a>
          </h2>
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className={clsx(styles.headerItem)}
            style={{ flexGrow: sectionWidthRatio.artist }}
          >
            {artist}
          </h2>
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className={clsx(styles.headerItem)}
            style={{ flexGrow: sectionWidthRatio.album }}
          >
            {album}
          </h2>
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className={clsx(styles.headerItem)}
            style={{ flexGrow: sectionWidthRatio.duration }}
          >
            0:00
          </h2>
        </div>
      </div>
    </div>
  );
}
