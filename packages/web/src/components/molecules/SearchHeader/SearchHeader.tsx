import React from 'react';

import { SidebarButton } from '~/components/atoms/SidebarButton/SidebarButton';

import { ProfileMenu } from '../ProfileMenu';
import { TrackSearch } from '../TrackSearch';

type SearchHeaderProps = {
  onToggleNavigationOpen?: () => void;
};

export const SearchHeader = ({
  onToggleNavigationOpen = () => {},
}: SearchHeaderProps) => {
  return (
    <div className="relative z-8 flex-shrink-0 flex h-16 bg-white border-b border-gray-200">
      {/* Sidebar toggle, controls the 'sidebarOpen' sidebar state. */}
      <SidebarButton onToggleNavigationOpen={onToggleNavigationOpen} />
      <div className="flex-1 flex justify-between px-4 sm:px-6 lg:px-8">
        <TrackSearch />
        <div className="flex items-center">
          {/* Profile dropdown */}
          <ProfileMenu />
        </div>
      </div>
    </div>
  );
};
