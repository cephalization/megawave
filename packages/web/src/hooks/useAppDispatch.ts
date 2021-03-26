import { useDispatch } from 'react-redux';

import { AppDispatch } from '~/store';

// correctly typed version of useDispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();
