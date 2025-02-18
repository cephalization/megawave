import {
  ArrowPathIcon,
  ListBulletIcon,
  RectangleStackIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';
import React, { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router';

import { useAppDispatch, useAppSelector } from '~/hooks';
import { libraryActions } from '~/store/slices/library/library';
import { librarySelectors } from '~/store/slices/library/selectors';
import { fetchLibrary } from '~/store/slices/library/thunks';

type Filter = {
  field: string;
  value: string;
};

export const TrackCount = ({ loading }: { loading?: boolean }) => {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const trackCount = useAppSelector(
    librarySelectors.selectFilteredTrackIdCount,
  );

  // Pull filters from URL
  const subkeyfilter = searchParams.get('subkeyfilter');
  const searchQuery = searchParams.get('q');
  const sort = searchParams.get('sort');
  const viewMode = searchParams.get('view') || 'tracks';

  const debouncedFetchLibrary = useMemo(
    () => debounce(() => dispatch(fetchLibrary({ fallback: true })), 300),
    [dispatch],
  );

  // Sync URL filters with Redux state, and fetch library
  useEffect(() => {
    dispatch(libraryActions.setLibraryFilter({ search: searchQuery ?? '' }));
    dispatch(
      libraryActions.setLibraryFilter({ subkeyfilter: subkeyfilter ?? '' }),
    );
    dispatch(libraryActions.setLibraryFilter({ sort: sort ?? '' }));
    debouncedFetchLibrary();
  }, [subkeyfilter, searchQuery, sort, dispatch, debouncedFetchLibrary]);

  // only clear the filter based on the filter field
  const clearFilter = (e: React.MouseEvent, filter: Filter) => {
    e.preventDefault();
    e.stopPropagation();
    if (filter.field === 'search') {
      setSearchParams((p) => {
        p.delete('q');
        return p;
      });
    } else if (filter.field === 'sort') {
      setSearchParams((p) => {
        p.delete('sort');
        return p;
      });
    } else {
      setSearchParams((p) => {
        p.delete('subkeyfilter');
        return p;
      });
    }
  };

  const getFilterDisplay = () => {
    const filters: Filter[] = [];
    if (subkeyfilter) {
      const [field, ...value] = subkeyfilter.split('-');
      filters.push({ field, value: decodeURIComponent(value.join('-')) });
    }
    if (searchQuery) {
      filters.push({ field: 'search', value: searchQuery });
    }
    return filters;
  };

  const filterDisplay: Filter[] = getFilterDisplay();

  // TODO: Break this up into multiple components
  // TODO: Make it a scrollable header on mobile, you should be able to scroll past this stuff
  return (
    <div className="bg-card transition-colors flex-1 grow-0 px-2 sm:px-4 py-4 items-center justify-between w-full flex gap-2">
      <div className="flex items-center gap-2">
        {loading && (
          <ArrowPathIcon className="animate-spin h-5 w-5 text-muted-foreground" />
        )}
        <h2 className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
          {filterDisplay.length > 0 &&
            filterDisplay.map((f) => (
              <span
                key={f.field}
                className="bg-primary/10 text-primary px-2 py-1 rounded-md flex items-center gap-1"
              >
                {f.field}: {f.value}
                <button
                  onClick={(e) => clearFilter(e, f)}
                  className="hover:bg-primary/20 hover:text-primary rounded-sm p-0.5"
                  title="Clear filter"
                  type="button"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </span>
            ))}
          Tracks:{' '}
          <span className="text-foreground font-bold font-mono text-end">
            {trackCount}
          </span>
        </h2>
      </div>
      <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
        <button
          onClick={() =>
            setSearchParams((p) => {
              p.set('view', 'tracks');
              return p;
            })
          }
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'tracks'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10'
          }`}
          title="Track view"
        >
          <ListBulletIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() =>
            setSearchParams((p) => {
              p.set('view', 'albums');
              return p;
            })
          }
          className={`p-2 rounded-md transition-colors ${
            viewMode === 'albums'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent-foreground/10'
          }`}
          title="Album view"
        >
          <RectangleStackIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
