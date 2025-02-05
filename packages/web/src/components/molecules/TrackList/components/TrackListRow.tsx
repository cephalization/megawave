import { EntityId } from '@reduxjs/toolkit';
import clsx from 'clsx';
import React from 'react';
import { useSearchParams } from 'react-router';

import { AlbumArt } from '~/components/atoms/AlbumArt/AlbumArt';
import { useAppSelector } from '~/hooks';
import { librarySelectors } from '~/store/slices/library/selectors';
import { Track } from '~/types/library';
import { formatTime } from '~/utils/formatTime';
import { getArrayString } from '~/utils/trackMeta';

import { LIST_PADDING } from '../TrackList';
import { sectionWidthRatio, styles as headerStyles } from './TrackListHeader';

const styles = {
  headerItem:
    'text-sm @md:leading-6 leading-none font-bold *:text-ellipsis *:whitespace-nowrap *:overflow-hidden *:max-w-full *:text-start pr-2',
} as const;

type TrackListRowProps = {
  trackId: EntityId;
  style: React.CSSProperties;
  isActive?: boolean;
  isSelected?: boolean;
  onClickTrack: () => void;
  onClickField: (arg0: keyof Track) => void;
  onSelect?: (
    trackId: EntityId,
    multiSelect: boolean,
    cmdSelect: boolean,
  ) => void;
};

export function TrackListRow({
  trackId,
  style,
  isActive,
  isSelected,
  onClickTrack,
  onClickField,
  onSelect,
}: TrackListRowProps) {
  const track = useAppSelector((s) =>
    librarySelectors.selectTrackById(s, trackId),
  );
  const [, setSearchParams] = useSearchParams();

  if (track === undefined) return null;

  const { name, artist, album } = track;
  const duration = formatTime(parseInt(track.length, 10));

  const handleTrackClick = (e: React.MouseEvent) => {
    if (e.shiftKey || e.metaKey) {
      onSelect?.(trackId, e.shiftKey, e.metaKey);
    } else {
      onClickTrack();
    }
  };

  const handleRowTouch = (e: React.TouchEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('button')) {
      return;
    }

    e.preventDefault();
  };

  const handleRowClick = (e: React.MouseEvent) => {
    // Only handle row clicks if they're not on a button
    if (!(e.target as HTMLElement).closest('button')) {
      onSelect?.(trackId, e.shiftKey, e.metaKey);
    }
  };

  const handleArtistClick = (e: React.MouseEvent) => {
    setSearchParams({
      subkeyfilter: `artist-${encodeURIComponent(getArrayString(artist))}`,
    });
    onClickField('artist');
  };

  const handleAlbumClick = (e: React.MouseEvent) => {
    setSearchParams({
      subkeyfilter: `album-${encodeURIComponent(getArrayString(album))}`,
    });
    onClickField('album');
  };

  return (
    <div
      className="select-none"
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
        onTouchStart={handleRowTouch}
        onTouchMove={handleRowTouch}
        onTouchEnd={handleRowTouch}
        onClick={handleRowClick}
        className={clsx(
          'flex h-full w-full items-center cursor-pointer',
          headerStyles.rowPadding,
          isActive && 'text-primary bg-primary/[0.05]',
          isSelected && 'bg-primary/30! **:italic',
        )}
      >
        {isActive && (
          <div className="absolute left-0 top-0 h-full w-1 bg-primary" />
        )}
        <div
          className="flex-1 flex min-w-0 items-center"
          style={{ flexGrow: sectionWidthRatio.title }}
        >
          <div className="shrink-0 pr-2">
            <AlbumArt
              className="flex h-10 w-10"
              src={track.art?.[0]}
              alt={`Album art for ${album} by ${artist}`}
            />
          </div>
          <div className="flex-1 min-w-0 flex-wrap justify-start @lg:justify-center @lg:items-center">
            <h2 className={clsx(styles.headerItem, 'w-full')} title={name}>
              <button
                type="button"
                onClick={handleTrackClick}
                className={'hover:text-primary transition-colors duration-300'}
              >
                {name}
              </button>
            </h2>
            <div className={clsx(styles.headerItem, 'w-full')}>
              <div className="leading-none text-xs text-muted-foreground font-bold text-ellipsis whitespace-nowrap overflow-hidden @lg:hidden w-full">
                {artist}
              </div>
            </div>
          </div>
        </div>
        <div
          className="@lg:flex-1 @lg:flex hidden min-w-0"
          style={{ flexGrow: sectionWidthRatio.artist }}
        >
          <h2
            className={clsx(styles.headerItem, 'w-full')}
            title={getArrayString(artist)}
          >
            <button
              onClick={handleArtistClick}
              className="hover:text-primary transition-colors duration-300"
            >
              {artist}
            </button>
          </h2>
        </div>
        <div
          className="@lg:flex-1 @lg:flex hidden min-w-0"
          style={{ flexGrow: sectionWidthRatio.album }}
        >
          <h2
            className={clsx(styles.headerItem, 'w-full')}
            title={getArrayString(album)}
          >
            <button
              onClick={handleAlbumClick}
              className="hover:text-primary transition-colors duration-300"
            >
              {album}
            </button>
          </h2>
        </div>
        <div
          className="flex-1 @sm:flex hidden min-w-0 justify-end"
          style={{ flexGrow: sectionWidthRatio.duration }}
        >
          <h2
            title={duration}
            className={clsx(styles.headerItem, 'tabular-nums')}
          >
            {duration}
          </h2>
        </div>
      </div>
    </div>
  );
}
