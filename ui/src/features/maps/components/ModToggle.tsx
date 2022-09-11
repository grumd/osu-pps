import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/HoverCard/HoverCard';
import { colors, fonts, space, styled } from '@/styles';

export type ModToggleState = 'any' | 'yes' | 'no' | 'invert';
export type ManiaKeysToggleState = 'any' | 4 | 5 | 6 | 7;

const HoverCardOptions = styled('div', {
  '& > button + button': {
    marginLeft: space.sm,
  },
});

const StyledToggleButton = styled('button', {
  all: 'unset',
  textAlign: 'center',
  cursor: 'pointer',
  fontSize: fonts[125],
  padding: `${space.sm} ${space.md}`,
  width: space.modBlock,
  boxSizing: 'border-box',
  borderRadius: space.sm,
  position: 'relative',

  variants: {
    selected: {
      true: {
        border: `${space.borderWidth} solid white`,
        boxShadow: '0 0 0.5em -0.2em white',
      },
    },
    state: {
      any: {},
      yes: {
        background: colors.bgOrange,
        fontWeight: 'bold',
        color: colors.textPrimary,
      },
      no: {
        background: colors.sand6,
        color: colors.textInactiveSecondary,
      },
      invert: {
        background: colors.bgBlue,
        fontWeight: 'bold',
        color: colors.textPrimary,
      },
    },
    withOther: {
      true: {},
    },
  },

  compoundVariants: [
    {
      state: 'any',
      withOther: true,
      css: {
        background: `linear-gradient(135deg, ${colors.sand6} 0%, ${colors.sand6} 33%, ${colors.bgOrange} 33%, ${colors.bgOrange} 66%, ${colors.bgBlue} 66%, ${colors.bgBlue} 100%);`,
        color: colors.textInactiveSecondary,
      },
    },
    {
      state: 'any',
      withOther: false,
      css: {
        background: `linear-gradient(135deg, ${colors.sand6} 0%, ${colors.sand6} 50%, ${colors.bgOrange} 50%, ${colors.bgOrange} 100%);`,
        color: colors.textInactiveSecondary,
      },
    },
  ],
});

export function ModToggle({
  state,
  onChange,
  withOther = false,
  otherLabel = '',
  children,
}: {
  state: ModToggleState;
  onChange: (state: ModToggleState) => void;
  withOther?: boolean;
  otherLabel?: string;
  children: string;
}) {
  const onClick = () => {
    const list: ModToggleState[] = withOther
      ? ['any', 'yes', 'no', 'invert']
      : ['any', 'yes', 'no'];
    const index = list.indexOf(state);

    onChange(list[index === list.length - 1 ? 0 : index + 1]);
  };

  const getHoverOption = (option: ModToggleState) => (
    <StyledToggleButton
      type="button"
      selected={state === option}
      state={option}
      withOther={withOther}
      onClick={() => onChange(option)}
    >
      {option === 'invert' ? otherLabel : children}
    </StyledToggleButton>
  );

  return (
    <HoverCard openDelay={0} closeDelay={150}>
      <HoverCardTrigger>
        <StyledToggleButton type="button" state={state} withOther={withOther} onClick={onClick}>
          {state === 'invert' ? otherLabel : children}
        </StyledToggleButton>
      </HoverCardTrigger>
      <HoverCardContent side="bottom">
        <HoverCardOptions>
          {getHoverOption('any')}
          {getHoverOption('yes')}
          {getHoverOption('no')}
          {withOther && getHoverOption('invert')}
        </HoverCardOptions>
      </HoverCardContent>
    </HoverCard>
  );
}

export function ManiaKeysToggle({
  state,
  onChange,
  children,
}: {
  state: ManiaKeysToggleState;
  onChange: (state: ManiaKeysToggleState) => void;
  children: string;
}) {
  const onClick = () => {
    const list: ManiaKeysToggleState[] = ['any', 4, 5, 6, 7];
    const index = list.indexOf(state);

    onChange(list[index === list.length - 1 ? 0 : index + 1]);
  };

  const getHoverOption = (option: ManiaKeysToggleState, label: string) => (
    <StyledToggleButton
      type="button"
      withOther={false}
      selected={state === option}
      state={option === 'any' ? 'any' : 'yes'}
      onClick={() => onChange(option)}
    >
      {label}
    </StyledToggleButton>
  );

  return (
    <HoverCard openDelay={0} closeDelay={150}>
      <HoverCardTrigger>
        <StyledToggleButton
          type="button"
          withOther={false}
          state={state === 'any' ? 'any' : 'yes'}
          onClick={onClick}
        >
          {children}
        </StyledToggleButton>
      </HoverCardTrigger>
      <HoverCardContent side="bottom">
        <HoverCardOptions>
          {getHoverOption('any', '?K')}
          {getHoverOption(4, '4K')}
          {getHoverOption(5, '5K')}
          {getHoverOption(6, '6K')}
          {getHoverOption(7, '7K')}
        </HoverCardOptions>
      </HoverCardContent>
    </HoverCard>
  );
}
