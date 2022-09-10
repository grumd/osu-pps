import ReactSelect from 'react-select';
import type { GroupBase, Props as ReactSelectProps } from 'react-select';

import { colors, space, styled } from '@/styles';

// Not my fault react-select ships fucking emotion by default for no reason
// Don't get me wrong, emotion is great, but shipping it with a component library is insane
const SelectContainer = styled('div', {
  '& .react-select__control': {
    minHeight: 'auto',
    background: colors.sand1,
    color: colors.sand12,
    borderRadius: space.sm,
    border: `${space.borderWidth} solid ${colors.sand8}`,

    '&:hover': {
      borderColor: colors.sand10,
    },
  },

  '& .react-select__indicator': {
    padding: space.sm,

    '& > svg': {
      height: '1.2em',
      width: '1.2em',
    },
  },

  '& .react-select__value-container': {
    padding: `0.15em ${space.xs}`,
  },

  '& .react-select__indicator-separator': {
    marginTop: space.md,
    marginBottom: space.md,
  },

  '& .react-select__menu': {
    margin: 0,
    background: colors.sand1,
    color: colors.sand11,
    borderRadius: space.sm,
    border: `${space.borderWidth} solid ${colors.sand8}`,

    '& .react-select__option--is-focused': {
      background: colors.sand4,
      color: colors.sand12,
    },

    '& .react-select__option--is-selected': {
      background: colors.amberA4,
      color: colors.sand12,
    },
  },

  '& .react-select__single-value': {
    color: colors.sand12,
  },

  '& .react-select__multi-value': {
    background: colors.amberA7,
    color: colors.textPrimary,
    borderRadius: space.xs,
    margin: `0.1em 0.25em`,

    '& > .react-select__multi-value__label': {
      color: colors.textPrimary,
      padding: `0.2em 0.2em 0.2em 0.45em`,
    },
    '& > .react-select__multi-value__remove': {
      cursor: 'pointer',
      borderRadius: space.xs,
      padding: `0 0.25em`,

      '&:hover': {
        color: colors.red11,
        background: colors.red6,
      },
      '& > svg': {
        height: '0.9em',
        width: '0.9em',
      },
    },
  },

  '& .react-select__input-container': {
    margin: '0.1em',
    padding: '0.1em',
    color: colors.textPrimary,
  },
});

export const Select = <Option, IsMulti extends boolean, Group extends GroupBase<Option>>(
  props: ReactSelectProps<Option, IsMulti, Group>
) => {
  return (
    <SelectContainer>
      <ReactSelect classNamePrefix="react-select" {...props} />
    </SelectContainer>
  );
};
