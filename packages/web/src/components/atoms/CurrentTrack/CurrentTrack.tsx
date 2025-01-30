import React from 'react';

import { getArrayString } from '~/utils/trackMeta';

import { AlbumArt } from '../AlbumArt/AlbumArt';

type CurrentTrackProps = {
  title?: string;
  artist?: string | string[] | null;
  art?: string;
};

export function CurrentTrack({ title, artist, art }: CurrentTrackProps) {
  return (
    <div className="flex items-center gap-2 flex-shrink w-full">
      <AlbumArt
        className="h-12 w-12 flex-shrink-0 hidden sm:flex"
        src={art}
        alt={`Album art for ${title} by ${artist}`}
      />
      <div className="flex flex-col min-w-0 w-full">
        <div className="text-sm font-bold truncate max-w-full">
          {title || 'No track playing'}
        </div>
        <div className="text-xs text-gray-500 truncate max-w-full">
          {getArrayString(artist)}
        </div>
      </div>
    </div>
  );
}
