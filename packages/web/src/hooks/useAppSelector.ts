import { TypedUseSelectorHook, useSelector } from 'react-redux';

import { RootState } from '~/store';

// correctly typed version of useSelector
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
