import { EntityId } from '@reduxjs/toolkit';
import clsx from 'clsx';
import React from 'react';

import { useAppSelector } from '~/hooks';
import { librarySelectors } from '~/store/slices/library/selectors';
import { Track } from '~/types/library';
import { formatTime } from '~/utils/formatTime';
import { getArrayString } from '~/utils/trackMeta';

import { LIST_PADDING } from '../TrackList';
import { sectionWidthRatio, styles as headerStyles } from './TrackListHeader';

const styles = {
  headerItem:
    'text-xs md:leading-6 leading-none text-gray-700 font-bold overflow-ellipsis whitespace-nowrap overflow-hidden pr-2',
} as const;

type TrackListRowProps = {
  trackId: EntityId;
  style: React.CSSProperties;
  isActive?: boolean;
  onClickTrack: () => void;
  onClickField: (arg0: keyof Track) => void;
};

export function TrackListRow({
  trackId,
  style,
  isActive,
  onClickTrack,
  onClickField,
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
          className="flex-1 flex min-w-0 items-center"
          style={{ flexGrow: sectionWidthRatio.title }}
        >
          <div className="flex-shrink-0 p-2 md:pl-0">
            <img
              className="flex"
              style={{ height: 32, width: 32 }}
              src={track.art?.[0]}
              // alt={`Album art for ${album} by ${artist}`}
            />
          </div>
          <div className="flex-1 min-w-0 flex-wrap justify-start">
            <h2 className={clsx(styles.headerItem, 'w-full')} title={name}>
              <a
                href={`#${link}`}
                onClick={() => onClickTrack()}
                className={'hover:text-blue-700 transition-colors duration-300'}
              >
                {name}
              </a>
            </h2>
            <a className="leading-none text-xs text-gray-400 font-bold overflow-ellipsis whitespace-nowrap overflow-hidden md:hidden w-full">
              {artist}
            </a>
          </div>
        </div>
        <div
          className="flex-1 md:flex hidden min-w-0"
          style={{ flexGrow: sectionWidthRatio.artist }}
        >
          <h2
            className={clsx(styles.headerItem)}
            title={getArrayString(artist)}
          >
            <a
              href={`#${link}/subkeyfilter=${artist}`}
              onClick={() => onClickField('artist')}
              className="hover:text-blue-700 transition-colors duration-300"
            >
              {artist}
            </a>
          </h2>
        </div>
        <div
          className="flex-1 sm:flex hidden min-w-0"
          style={{ flexGrow: sectionWidthRatio.album }}
        >
          <h2 className={clsx(styles.headerItem)} title={getArrayString(album)}>
            <a
              href={`#${link}/subkeyfilter=${album}`}
              onClick={() => onClickField('album')}
              className="hover:text-blue-700 transition-colors duration-300"
            >
              {album}
            </a>
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
