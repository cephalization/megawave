import { useAppSelector } from '~/hooks';
import { librarySelectors } from '~/store/slices/library/selectors';

export const useCurrentTrack = () => {
  const activeTrackId = useAppSelector(
    librarySelectors.selectLibraryActiveTrackId,
  );
  const currentTrack = useAppSelector((state) =>
    activeTrackId
      ? librarySelectors.selectTrackById(state, activeTrackId)
      : null,
  );

  return currentTrack;
};
