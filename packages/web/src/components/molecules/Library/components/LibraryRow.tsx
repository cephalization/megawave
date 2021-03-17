import clsx from 'clsx';
import React from 'react';

import { Track } from '~/types/library';

import { sectionWidthRatio } from './LibraryHeader';
import { LIST_PADDING } from '../Library';

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
    <div
      style={{
        ...style,
        top: `${
          (typeof style.top === 'number'
            ? (style.top as number)
            : parseFloat(style.top || '0')) + LIST_PADDING
        }px`,
      }}
    >
      <div className="flex h-full w-full pl-5 sm:pl-6 lg:pl-8">
        <div
          className="flex-1 min-w-0"
          style={{ flexGrow: sectionWidthRatio.title }}
        >
          <h2 className={clsx(styles.headerItem)} title={name}>
            <a
              href={link}
              className="hover:text-blue-700 transition-colors duration-300"
            >
              {name}
            </a>
          </h2>
        </div>
        <div
          className="flex-1 min-w-0"
          style={{ flexGrow: sectionWidthRatio.artist }}
        >
          <h2 className={clsx(styles.headerItem)} title={artist}>
            {artist}
          </h2>
        </div>
        <div
          className="flex-1 min-w-0"
          style={{ flexGrow: sectionWidthRatio.album }}
        >
          <h2 className={clsx(styles.headerItem)} title={album}>
            {album}
          </h2>
        </div>
        <div
          className="flex-1 min-w-0"
          style={{ flexGrow: sectionWidthRatio.duration }}
        >
          <h2 className={clsx(styles.headerItem)}>0:00</h2>
        </div>
      </div>
    </div>
  );
}
