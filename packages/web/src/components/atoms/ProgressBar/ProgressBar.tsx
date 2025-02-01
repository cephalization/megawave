import { forwardRef } from 'react';

type ProgressBarProps = {
  onChange?: (value: number) => void;
  percentage?: number;
};

export const ProgressBar = forwardRef<HTMLInputElement, ProgressBarProps>(
  ({ onChange, percentage = 0 }, ref) => {
    return (
      <div className="relative w-full h-2 bg-gray-300 rounded-full">
        <input
          ref={ref}
          type="range"
          value={percentage}
          className="range-input absolute top-0 w-full h-full cursor-pointer bg-transparent appearance-none"
          onChange={(e) => onChange?.(e.target.valueAsNumber)}
          min={0}
          max={100}
          aria-valuenow={percentage}
          step="0.01"
        />
        <div
          className="bg-gray-600 h-full rounded-l-full rounded-r-full"
          style={{
            width: `${percentage}%`, // Map percentage to width directly
          }}
        ></div>
      </div>
    );
  },
);

ProgressBar.displayName = 'ProgressBar';
