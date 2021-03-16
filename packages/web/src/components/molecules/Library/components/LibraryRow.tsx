import React from 'react';

import { Track } from '~/types/library';

type LibraryRowProps = {
  track: Track;
  style: React.CSSProperties;
};

export function LibraryRow({ track, style }: LibraryRowProps) {
  return (
    <a style={style} href={track.link}>
      {track.name} - {track.artist}
    </a>
  );
}
