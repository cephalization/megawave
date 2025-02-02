import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';
import { SpeakerWaveIcon } from '@heroicons/react/24/outline';
import React from 'react';

import { VolumeSlider } from '~/components/atoms/VolumeSlider';

type VolumeControlProps = {
  volume: number;
  onChange: (volume: number) => void;
};

export const VolumeControl = ({ volume, onChange }: VolumeControlProps) => {
  return (
    <>
      {/* Show inline on larger screens */}
      <div className="hidden md:flex items-center">
        <VolumeSlider volume={volume} onChange={onChange} />
      </div>

      {/* Show button and popover on small screens */}
      <div className="md:hidden flex items-center">
        <Popover className="relative z-10 flex items-center">
          <PopoverButton className="hover:text-gray-900 focus:outline-none">
            <SpeakerWaveIcon height={20} />
          </PopoverButton>

          <PopoverPanel anchor="bottom end" className="shadow">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
              <VolumeSlider volume={volume} onChange={onChange} />
            </div>
            <div className="absolute -bottom-2 right-3 w-4 h-4 rotate-45 bg-white dark:bg-gray-800" />
          </PopoverPanel>
        </Popover>
      </div>
    </>
  );
};
