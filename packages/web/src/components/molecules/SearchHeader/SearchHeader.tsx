import { SidebarButton } from '~/components/atoms/SidebarButton';

import { ProfileMenu } from '../ProfileMenu';
import { TrackSearch } from '../TrackSearch';

type SearchHeaderProps = {
  onToggleNavigationOpen?: () => void;
};

export const SearchHeader = ({
  onToggleNavigationOpen = () => {},
}: SearchHeaderProps) => {
  return (
    <div className="relative z-8 shrink-0 flex h-16 bg-card transition-colors border-b border-border sm:px-4">
      {/* Sidebar toggle, controls the 'sidebarOpen' sidebar state. */}
      <SidebarButton onToggleNavigationOpen={onToggleNavigationOpen} />
      <div className="flex-1 flex justify-between px-4 sm:px-0">
        <TrackSearch />
        <div className="flex items-center">
          {/* Profile dropdown */}
          <ProfileMenu />
        </div>
      </div>
    </div>
  );
};
