import { createEntityAdapter } from '@reduxjs/toolkit';

import { Track } from '~/types/library';

export const libraryAdapter = createEntityAdapter<Track>();
