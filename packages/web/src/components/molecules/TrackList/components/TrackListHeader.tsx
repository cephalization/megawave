import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import React from 'react';
import { useSearchParams } from 'react-router';

export const styles = {
  headerItem: 'text-sm leading-6 text-foreground font-semibold',
  rowPadding: 'px-2 py-1 sm:px-4',
} as const;

export const sectionWidthRatio = {
  title: 4,
  artist: 3,
  album: 2,
  duration: 1,
} as const;

type SortableField = 'name' | 'artist' | 'album';

interface HeaderItemProps {
  field: SortableField;
  children: React.ReactNode;
  currentSort: string | null;
  onSort: (field: SortableField) => void;
  className?: string;
  style?: React.CSSProperties;
}

const HeaderItem = ({
  field,
  children,
  currentSort,
  onSort,
  className,
  style,
}: HeaderItemProps) => {
  const isCurrentSort = currentSort?.replace('-', '') === field;
  const isDescending = currentSort?.startsWith('-');

  return (
    <div className={className} style={style}>
      <button
        onClick={() => onSort(field)}
        className={clsx(
          styles.headerItem,
          'flex items-center gap-2 text-foreground hover:underline underline-offset-2 transition-colors duration-150 group w-full',
          isCurrentSort && 'text-foreground',
        )}
      >
        {children}
        <span
          className={clsx(
            'transition-opacity duration-150',
            isCurrentSort ? 'opacity-100' : 'opacity-0 group-hover:opacity-50',
          )}
        >
          {isCurrentSort && isDescending ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronUpIcon className="h-4 w-4" />
          )}
        </span>
      </button>
    </div>
  );
};

export function TrackListHeader() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSort = searchParams.get('sort');

  const handleSort = (field: SortableField) => {
    const newSort =
      currentSort === field
        ? `-${field}`
        : currentSort === `-${field}`
          ? null
          : field;

    if (newSort) {
      setSearchParams((params) => {
        params.set('sort', newSort);
        return params;
      });
    } else {
      setSearchParams((params) => {
        params.delete('sort');
        return params;
      });
    }
  };

  return (
    <div
      className={clsx(
        'flex w-full border-t border-border bg-card transition-colors',
        styles.rowPadding,
      )}
    >
      <HeaderItem
        field="name"
        currentSort={currentSort}
        onSort={handleSort}
        className="flex-1"
        style={{ flexGrow: sectionWidthRatio.title }}
      >
        Title
      </HeaderItem>
      <HeaderItem
        field="artist"
        currentSort={currentSort}
        onSort={handleSort}
        className="@lg:flex-1 @lg:flex hidden"
        style={{ flexGrow: sectionWidthRatio.artist }}
      >
        Artist
      </HeaderItem>
      <HeaderItem
        field="album"
        currentSort={currentSort}
        onSort={handleSort}
        className="@lg:flex-1 @lg:flex hidden"
        style={{ flexGrow: sectionWidthRatio.album }}
      >
        Album
      </HeaderItem>
      <div
        className="@sm:flex-1 @sm:flex hidden justify-end"
        style={{ flexGrow: sectionWidthRatio.duration }}
      >
        <h2 className={clsx(styles.headerItem)}>Duration</h2>
      </div>
    </div>
  );
}
