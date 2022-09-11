import { colors, space, styled } from '@/styles';

const StyledToggleButton = styled('button', {
  all: 'unset',
  borderRadius: space.sm,
  padding: space.md,
  lineHeight: 1.2,
  cursor: 'pointer',
  fontWeight: 600,

  '&:hover': {
    backgroundColor: colors.sand4,
  },

  variants: {
    pressed: {
      true: {
        backgroundColor: colors.sand4,
      },
    },
  },
});

interface ToggleButtonProps {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

export const ToggleButton = ({ pressed, onClick, children, className }: ToggleButtonProps) => {
  return (
    <StyledToggleButton
      className={className}
      aria-pressed={pressed}
      pressed={pressed}
      onClick={onClick}
    >
      {children}
    </StyledToggleButton>
  );
};
