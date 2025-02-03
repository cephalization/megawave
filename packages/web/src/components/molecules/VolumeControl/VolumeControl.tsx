import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash.debounce';
import React, { useEffect } from 'react';

import { VolumeSlider } from '~/components/atoms/VolumeSlider';

type VolumeControlProps = {
  volume: number;
  onChange: (volume: number) => void;
};

const VOLUME_KEY = 'mw-volume';

const updateVolume = (volume: number) =>
  debounce(() => localStorage.setItem(VOLUME_KEY, volume.toString()), 1000);

export const VolumeControl = ({ volume, onChange }: VolumeControlProps) => {
  // get volume from local storage and sync with redux on mount
  useEffect(() => {
    try {
      const storedVolume = localStorage.getItem(VOLUME_KEY);
      if (storedVolume) {
        onChange(parseFloat(storedVolume));
      }
    } catch {
      // did not update volume
    }
  }, [onChange]);

  useEffect(() => {
    updateVolume(volume);
  }, [volume]);

  return (
    <>
      {/* Show inline on larger screens */}
      <div className="hidden md:flex items-center">
        <VolumeSlider volume={volume} onChange={onChange} />
      </div>

      {/* Show button and popover on small screens */}
      <div className="md:hidden flex items-center">
        <Popover className="relative z-10 flex items-center">
          <PopoverButton className="hover:text-gray-900 focus:outline-hidden">
            <SpeakerWaveIcon height={20} />
          </PopoverButton>

          <PopoverPanel anchor="bottom end" className="shadow-sm">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <VolumeSlider volume={volume} onChange={onChange} />
            </div>
          </PopoverPanel>
        </Popover>
      </div>
    </>
  );
};
