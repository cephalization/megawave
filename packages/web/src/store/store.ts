import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';

import { librarySlice } from './slices';

const store = configureStore({
  reducer: {
    library: librarySlice.reducer,
  },
  middleware: [...getDefaultMiddleware({ immutableCheck: false })],
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
