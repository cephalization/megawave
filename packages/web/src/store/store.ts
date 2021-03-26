import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

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
// correctly typed version of useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
