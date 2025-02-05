import { ICON_SIZE_SCALAR } from '~/constants/controls';

type PrevButtonProps = {
  onClick?: () => void;
};

export const PrevButton = ({ onClick }: PrevButtonProps) => {
  return (
    <button
      type="button"
      className="mx-1 text-muted-foreground hover:text-foreground"
      onClick={onClick}
    >
      <svg
        width={8 * ICON_SIZE_SCALAR}
        height={9 * ICON_SIZE_SCALAR}
        viewBox="0 0 17 18"
      >
        <path d="M0 0h2v18H0V0zM4 9l13-9v18L4 9z" fill="currentColor" />
      </svg>
    </button>
  );
};
