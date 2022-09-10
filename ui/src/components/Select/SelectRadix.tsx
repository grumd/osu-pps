import * as SelectPrimitive from '@radix-ui/react-select';
import { FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';

import { colors, fonts, space, styled } from '@/styles';

const SelectTrigger = styled(SelectPrimitive.SelectTrigger, {
  all: 'unset',
  lineHeight: 1,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: space.sm,
  borderRadius: space.sm,
  padding: space.sm,
  backgroundColor: colors.sand1,
  border: `${space.borderWidth} solid ${colors.sand8}`,
  color: colors.amberA11,
  boxShadow: `0 2px 10px ${colors.sand1}`,
  '&:hover': { backgroundColor: colors.amberA2 },
  '&:focus': { boxShadow: `0 0 0 2px black` },
  '&[data-placeholder]': { color: colors.sand10 },
});

const SelectIcon = styled(SelectPrimitive.SelectIcon, {
  color: colors.amberA11,
});

const StyledContent = styled(SelectPrimitive.Content, {
  overflow: 'hidden',
  backgroundColor: colors.bgMain,
  borderRadius: space.sm,
  boxShadow:
    '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',
});

const SelectViewport = styled(SelectPrimitive.Viewport, {
  padding: space.sm,
});

function SelectContent({ children, ...props }: React.ComponentProps<typeof StyledContent>) {
  return (
    <SelectPrimitive.Portal>
      <StyledContent {...props}>{children}</StyledContent>
    </SelectPrimitive.Portal>
  );
}

const SelectItem = styled(SelectPrimitive.Item, {
  all: 'unset',
  color: colors.amberA11,
  borderRadius: space.sm,
  display: 'flex',
  alignItems: 'center',
  height: '1.5em',
  padding: `${space.xs} ${space.xs} ${space.xs} 1.8em`,
  position: 'relative',
  userSelect: 'none',

  '&[data-disabled]': {
    color: colors.sand8,
    pointerEvents: 'none',
  },

  '&[data-highlighted]': {
    backgroundColor: colors.amberA3,
    color: colors.amberA11,
  },
});

const StyledLabel = styled(SelectPrimitive.Label, {
  padding: '0 25px',
  fontSize: 12,
  lineHeight: '25px',
  color: colors.amberA11,
});

const StyledSeparator = styled(SelectPrimitive.Separator, {
  height: 1,
  backgroundColor: colors.amberA6,
  margin: 5,
});

const SelectItemIndicator = styled(SelectPrimitive.ItemIndicator, {
  position: 'absolute',
  left: 0,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const scrollButtonStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 25,
  backgroundColor: colors.bgMain,
  color: colors.amberA11,
  cursor: 'default',
};

const SelectScrollUpButton = styled(SelectPrimitive.ScrollUpButton, scrollButtonStyles);

const SelectScrollDownButton = styled(SelectPrimitive.ScrollDownButton, scrollButtonStyles);

const SelectValue = SelectPrimitive.Value;
const SelectItemText = SelectPrimitive.ItemText;

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  children: React.ReactNode;
}

export const Select = ({ value, onChange, placeholder, ariaLabel, children }: SelectProps) => {
  return (
    <SelectPrimitive.Root>
      <SelectTrigger aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
        <SelectIcon>
          <FaChevronDown />
        </SelectIcon>
      </SelectTrigger>
      <SelectContent>
        <SelectScrollUpButton>
          <FaChevronUp />
        </SelectScrollUpButton>
        <SelectViewport>{children}</SelectViewport>
        <SelectScrollDownButton>
          <FaChevronDown />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPrimitive.Root>
  );
};

interface SelectOptionProps {
  value: string;
  label: React.ReactNode;
}

export const SelectOption = ({ value, label }: SelectOptionProps) => {
  return (
    <SelectItem value={value}>
      <SelectItemText>{label}</SelectItemText>
      <SelectItemIndicator>
        <FaCheck />
      </SelectItemIndicator>
    </SelectItem>
  );
};
