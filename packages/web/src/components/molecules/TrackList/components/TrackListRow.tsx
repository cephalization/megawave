import { EntityId } from '@reduxjs/toolkit';
import clsx from 'clsx';
import React from 'react';

import { useAppSelector } from '~/hooks';
import { librarySelectors } from '~/store/slices/library';
import { formatTime } from '~/utils/formatTime';
import { getArrayString } from '~/utils/trackMeta';

import { LIST_PADDING } from '../TrackList';
import { sectionWidthRatio, styles as headerStyles } from './TrackListHeader';

const styles = {
  headerItem:
    'text-sm leading-6 text-gray-700 font-bold overflow-ellipsis whitespace-nowrap overflow-hidden pr-2',
} as const;

type TrackListRowProps = {
  trackId: EntityId;
  style: React.CSSProperties;
  isActive?: boolean;
  onClickTrack: (arg0: EntityId) => void;
};

export function TrackListRow({
  trackId,
  style,
  isActive,
  onClickTrack,
}: TrackListRowProps) {
  const track = useAppSelector((s) =>
    librarySelectors.selectTrackById(s, trackId),
  );

  if (track === undefined) return null;

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
      <div
        className={clsx(
          'flex h-full w-full items-center',
          headerStyles.rowPadding,
          isActive && 'text-blue-700 bg-blue-50',
        )}
      >
        <div
          className="flex-1 min-w-0 flex-col sm:flex-row"
          style={{ flexGrow: sectionWidthRatio.title }}
        >
          <h2 className={clsx(styles.headerItem)} title={name}>
            <a
              href={`#${link}`}
              onClick={() => onClickTrack(trackId)}
              className={'hover:text-blue-700 transition-colors duration-300'}
            >
              {name}
            </a>
          </h2>
          <a className="text-sm leading-6 text-gray-400 font-bold overflow-ellipsis whitespace-nowrap overflow-hidden sm:hidden">
            {artist}
          </a>
        </div>
        <div
          className="flex-1 sm:flex hidden min-w-0"
          style={{ flexGrow: sectionWidthRatio.artist }}
        >
          <h2
            className={clsx(styles.headerItem)}
            title={getArrayString(artist)}
          >
            {artist}
          </h2>
        </div>
        <div
          className="flex-1 sm:flex hidden min-w-0"
          style={{ flexGrow: sectionWidthRatio.album }}
        >
          <h2 className={clsx(styles.headerItem)} title={getArrayString(album)}>
            {album}
          </h2>
        </div>
        <div
          className="flex-1 sm:flex hidden min-w-0 justify-end"
          style={{ flexGrow: sectionWidthRatio.duration }}
        >
          <h2 className={clsx(styles.headerItem, 'tabular-nums')}>
            {formatTime(parseInt(track.length, 10))}
          </h2>
        </div>
      </div>
    </div>
  );
}
