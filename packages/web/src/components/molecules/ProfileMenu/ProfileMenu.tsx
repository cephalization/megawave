export const ProfileMenu = () => {
  return (
    <div className="ml-3 relative">
      <div>
        <button
          className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          id="user-menu"
          aria-haspopup="true"
        >
          <span className="sr-only">Open user menu</span>
          <span className="inline-block h-8 w-8 rounded-full overflow-hidden bg-gray-100">
            <svg
              className="h-full w-full text-gray-300"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
};
