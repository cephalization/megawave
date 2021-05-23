import React, { forwardRef } from 'react';

type ProgressBarProps = {
  onScrub?: (arg0: React.MouseEvent) => void;
  percentage?: number;
};

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ onScrub, percentage = 0 }, ref) => {
    return (
      <div
        className="w-full bg-gray-300 dark:bg-black rounded-full overflow-hidden h-1/6"
        onClick={onScrub}
        ref={ref}
      >
        <div
          className="bg-gray-400 dark:bg-lime-400 h-full"
          role="progressbar"
          aria-valuenow={1456}
          aria-valuemin={0}
          aria-valuemax={4550}
          style={{
            width: `${isNaN(percentage) ? 0 : percentage}%`,
          }}
        />
      </div>
    );
  },
);
