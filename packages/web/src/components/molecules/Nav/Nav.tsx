import React from 'react';
import { Link, useLocation } from 'react-router';

import logo from '~/assets/logo.svg';
import { ThemeToggle } from '~/components/atoms/ThemeToggle';

import { MobileNav } from './MobileNav';

export type NavProps = {
  open: boolean;
  toggleNav: () => void;
};

export function Nav({ open = false, toggleNav }: NavProps) {
  const location = useLocation();

  return (
    <>
      <MobileNav open={open} toggleNav={toggleNav} />

      <div className="hidden lg:flex lg:shrink-0" id="side-nav">
        <div className="flex flex-col w-64 border-r border-border pt-5 pb-4 bg-card text-card-foreground transition-colors">
          <div className="flex items-center shrink-0 px-4">
            <img className="h-8 w-auto" src={logo} alt="Megawave" />
            <h2 className="text-xl pl-2">
              <b className="font-extrabold">Megawave</b>
            </h2>
          </div>
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="h-0 flex-1 flex flex-col overflow-y-auto justify-between">
            {/* Navigation */}
            <nav className="px-3 mt-6">
              <div className="space-y-1">
                <Link
                  to="/"
                  className={`${
                    location.pathname === '/'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <svg
                    className="text-muted-foreground mr-3 h-6 w-6"
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
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Library
                </Link>
                <Link
                  to="/playlists"
                  className={`${
                    location.pathname === '/playlists'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <svg
                    className="text-muted-foreground group-hover:text-foreground mr-3 h-6 w-6"
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
                      d="M4 6h16M4 10h16M4 14h16M4 18h16"
                    />
                  </svg>
                  Playlists
                </Link>
                <Link
                  to="/recent"
                  className={`${
                    location.pathname === '/recent'
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <svg
                    className="text-muted-foreground group-hover:text-foreground mr-3 h-6 w-6"
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Recent
                </Link>
              </div>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </>
  );
}
