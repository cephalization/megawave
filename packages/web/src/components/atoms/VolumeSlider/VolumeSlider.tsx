import { SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';
import React from 'react';

type VolumeSliderProps = {
  volume: number;
  onChange: (volume: number) => void;
};

export const VolumeSlider = ({ volume, onChange }: VolumeSliderProps) => {
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    onChange(newVolume);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="hover:text-gray-900"
        onClick={() => onChange(volume === 0 ? 1 : 0)}
      >
        {volume === 0 ? (
          <SpeakerXMarkIcon height={20} />
        ) : (
          <SpeakerWaveIcon height={20} />
        )}
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={handleVolumeChange}
        className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer range-input"
      />
    </div>
  );
};
