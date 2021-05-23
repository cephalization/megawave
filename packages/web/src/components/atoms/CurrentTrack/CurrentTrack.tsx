import React from 'react';

import { getArrayString } from '~/utils/trackMeta';

type CurrentTrackProps = {
  title?: string;
  artist?: string | string[] | null;
};

export const CurrentTrack = ({ title, artist }: CurrentTrackProps) => {
  if (!title) return null;

  const formattedArtist = getArrayString(artist);

  return (
    <div className="flex flex-wrap text-sm px-5 sm:px-6 lg:px-8 py-4 max-w-full overflow-hidden">
      <label
        title={title}
        className="font-bold overflow-ellipsis w-full max-w-full whitespace-nowrap"
      >
        {title}
      </label>
      <label
        title={formattedArtist}
        className="text-gray-600 hover:text-gray-800 overflow-ellipsis w-full max-w-full whitespace-nowrap overflow-hidden"
      >
        {formattedArtist}
      </label>
    </div>
  );
};
