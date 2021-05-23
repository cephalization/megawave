import React from 'react';

import { ICON_SIZE_SCALAR } from '~/constants/controls';

type NextButtonProps = {
  onClick?: () => void;
};

export const NextButton = ({ onClick }: NextButtonProps) => {
  return (
    <button
      type="button"
      className="hidden sm:block mx-1  hover:text-gray-900"
      onClick={onClick}
    >
      <svg
        width={8 * ICON_SIZE_SCALAR}
        height={9 * ICON_SIZE_SCALAR}
        viewBox="0 0 17 18"
        fill="none"
      >
        <path d="M17 0H15V18H17V0Z" fill="currentColor" />
        <path d="M13 9L0 0V18L13 9Z" fill="currentColor" />
      </svg>
    </button>
  );
};
