import React from 'react';

import { getArrayString } from '~/utils/trackMeta';

type CurrentTrackProps = {
  title?: string;
  artist?: string | string[] | null;
  art?: string;
};

export const CurrentTrack = ({ title, artist, art }: CurrentTrackProps) => {
  if (!title) return null;

  const formattedArtist = getArrayString(artist);

  return (
    <div className='flex gap-2 items-center max-w-full'>
      <div className="flex-shrink-0 md:pl-0">
        <img
          className="object-contain rounded"
          style={{ height: 32, width: 32 }}
          src={art}
          alt={`Album art for ${title} by ${artist}`}
        />
      </div>
      <div className="grid grid-rows-2 text-sm max-w-full">
        <label
          title={title}
          className="font-bold truncate w-full max-w-full whitespace-nowrap"
        >
          {title}
        </label>
        <label
          title={formattedArtist}
          className="text-gray-600 hover:text-gray-800 truncate w-full max-w-full whitespace-nowrap"
        >
          {formattedArtist}
        </label>
      </div>
    </div>
  );
};
