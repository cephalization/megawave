import React from 'react';

type SidebarButtonProps = {
  onToggleNavigationOpen?: () => void;
};

export const SidebarButton = ({
  onToggleNavigationOpen,
}: SidebarButtonProps) => {
  return (
    <button
      onClick={onToggleNavigationOpen}
      className="px-4 border-r border-border text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden z-30"
    >
      <span className="sr-only">Open sidebar</span>
      {/* Heroicon name: menu-alt-1 */}
      <svg
        className="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h8m-8 6h16"
        />
      </svg>
    </button>
  );
};
