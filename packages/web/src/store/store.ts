import { configureStore } from '@reduxjs/toolkit';

import { librarySlice, playerActions, playerSlice } from './slices';

const store = configureStore({
  reducer: {
    library: librarySlice.reducer,
    player: playerSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ immutableCheck: false }),
  devTools: {
    actionsBlacklist: [playerActions.setSeekTime.toString()],
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
