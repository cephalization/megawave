import React from 'react';

type DividingHeaderProps = {
  children: React.ReactNode;
};

export const DividingHeader = ({ children }: DividingHeaderProps) => {
  return (
    <div className="border-b border-gray-200 pl-5 px-4 py-4 sm:flex sm:grow-0 sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-medium leading-6 text-gray-900 sm:truncate">
          {children}
        </h1>
      </div>
    </div>
  );
};
