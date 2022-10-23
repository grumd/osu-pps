import * as SwitchPrimitive from '@radix-ui/react-switch';

import { colors, space, styled } from '@/styles';

interface SwitchProps {
  value: boolean;
  onChange: (value: boolean) => void;
}

const StyledSwitch = styled(SwitchPrimitive.Root, {
  all: 'unset',
  cursor: 'pointer',
  width: '3em',
  height: '1.6em',
  backgroundColor: colors.amberA4,
  borderRadius: '9999px',
  position: 'relative',
  boxShadow: `0 0.1em 0.4em ${colors.amberA1}`,
  '&:focus': { boxShadow: `0 0 0 0.1em black` },
  '&[data-state="checked"]': {
    backgroundColor: colors.amberA7,
  },
});

const StyledThumb = styled(SwitchPrimitive.Thumb, {
  display: 'block',
  width: '1.2em',
  height: '1.2em',
  backgroundColor: colors.amberA4,
  borderRadius: '9999px',
  boxShadow: `0 0.1em 0.1em ${colors.amberA1}`,
  transition: 'transform 100ms',
  transform: 'translateX(0.2em)',
  willChange: 'transform',
  '&[data-state="checked"]': {
    transform: 'translateX(1.6em)',
    backgroundColor: colors.amberA11,
  },
});

export const Switch = ({ value, onChange }: SwitchProps) => {
  return (
    <StyledSwitch checked={value} onCheckedChange={onChange}>
      <StyledThumb />
    </StyledSwitch>
  );
};
