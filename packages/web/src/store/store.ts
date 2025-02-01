import { configureStore } from '@reduxjs/toolkit';

import { librarySlice, playerActions, playerSlice } from './slices';

// Extend the globalThis type to include our store
declare global {
  var store: ReturnType<typeof makeStore> | undefined;
}

const makeStore = () => {
  return configureStore({
    reducer: {
      library: librarySlice.reducer,
      player: playerSlice.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({ immutableCheck: false }),
    devTools: {
      actionsDenylist: [playerActions.setSeekTime.toString()],
    },
  });
};

const store = globalThis.store ?? (globalThis.store = makeStore());

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
