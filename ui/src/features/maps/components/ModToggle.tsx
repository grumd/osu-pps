import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/HoverCard/HoverCard';
import { colors, fonts, space, styled } from '@/styles';

export type ModToggleState = 'any' | 'yes' | 'no' | 'invert';
export type ManiaKeysToggleState = 'any' | 4 | 5 | 6 | 7 | 8 | 9;

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
      any: {
        background: `linear-gradient(135deg, ${colors.sand6} 0%, ${colors.sand6} 50%, ${colors.bgOrange} 50%, ${colors.bgOrange} 100%);`,
        color: colors.textInactive,
      },
      yes: {
        background: colors.bgOrange,
        fontWeight: 'bold',
        color: colors.textPrimary,
      },
      no: {
        background: colors.sand6,
        color: colors.textInactive,
      },
      invert: {
        background: colors.bgBlue,
        fontWeight: 'bold',
        color: colors.textPrimary,
      },
    },
  },
});

export function ModToggle({
  state,
  onChange,
  otherLabel = '',
  children,
  options,
}: {
  state: ModToggleState;
  onChange: (state: ModToggleState) => void;
  otherLabel?: string;
  children: string;
  options: readonly ModToggleState[];
}) {
  const onClick = () => {
    const index = options.indexOf(state);

    onChange(options[index === options.length - 1 ? 0 : index + 1]);
  };

  const getHoverOption = (option: ModToggleState) => (
    <StyledToggleButton
      type="button"
      key={option}
      selected={state === option}
      state={option}
      onClick={() => onChange(option)}
    >
      {option === 'invert' ? otherLabel : children}
    </StyledToggleButton>
  );

  return (
    <HoverCard openDelay={0} closeDelay={150}>
      <HoverCardTrigger>
        <StyledToggleButton type="button" state={state} onClick={onClick}>
          {state === 'invert' ? otherLabel : children}
        </StyledToggleButton>
      </HoverCardTrigger>
      <HoverCardContent side="bottom">
        <HoverCardOptions>{options.map(getHoverOption)}</HoverCardOptions>
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
    const list: ManiaKeysToggleState[] = ['any', 4, 5, 6, 7, 8, 9];
    const index = list.indexOf(state);

    onChange(list[index === list.length - 1 ? 0 : index + 1]);
  };

  const getHoverOption = (option: ManiaKeysToggleState, label: string) => (
    <StyledToggleButton
      type="button"
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
        <StyledToggleButton type="button" state={state === 'any' ? 'any' : 'yes'} onClick={onClick}>
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
          {getHoverOption(8, '8K')}
          {getHoverOption(9, '9K')}
        </HoverCardOptions>
      </HoverCardContent>
    </HoverCard>
  );
}
