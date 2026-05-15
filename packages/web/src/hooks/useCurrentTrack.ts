import { selectCurrentTrack, usePlayerStore } from '~/store/playerStore';

export const useCurrentTrack = () => {
  return usePlayerStore(selectCurrentTrack);
};
