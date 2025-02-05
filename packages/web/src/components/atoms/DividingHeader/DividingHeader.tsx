import React from 'react';

type DividingHeaderProps = {
  children: React.ReactNode;
};

export const DividingHeader = ({ children }: DividingHeaderProps) => {
  return (
    <div className="bg-card transition-colors border-b border-border px-4 py-4 sm:flex sm:grow-0 sm:items-center sm:justify-between">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-medium leading-6 sm:truncate">
          {children}
        </h1>
      </div>
    </div>
  );
};
