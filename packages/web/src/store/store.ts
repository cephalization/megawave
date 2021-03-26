import { configureStore } from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';

import { librarySlice } from './slices';

const store = configureStore({
  reducer: {
    library: librarySlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// correctly typed version of useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();

export default store;
