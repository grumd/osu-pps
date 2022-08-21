import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { useCallback } from 'react';

import { colors, space, styled } from '@/styles';

const StyledInput = styled('input', {
  all: 'unset',
  padding: space.xs,
  background: colors.sand1,
  color: colors.sand12,
  borderRadius: space.sm,
  border: `${space.borderWidth} solid ${colors.sand8}`,

  /* Chrome, Safari, Edge, Opera */
  '&::-webkit-outer-spin-button,&::-webkit-inner-spin-button': {
    display: 'none',
  },

  /* Firefox */
  '&[type=number]': {
    '-moz-appearance': 'textfield',
  },
});

type InputTypes =
  | 'button'
  | 'checkbox'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'file'
  | 'hidden'
  | 'image'
  | 'month'
  | 'number'
  | 'password'
  | 'radio'
  | 'range'
  | 'reset'
  | 'search'
  | 'submit'
  | 'tel'
  | 'text'
  | 'time'
  | 'url'
  | 'week';

interface InputProps<Type>
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  type: Type;
  onChange: Type extends 'number'
    ? (value: number | null, event: ChangeEvent<HTMLInputElement>) => void
    : (value: string, event: ChangeEvent<HTMLInputElement>) => void;
}

export function Input<Type extends InputTypes>(props: InputProps<Type>): JSX.Element {
  const { onChange, type, ...rest } = props;

  const _onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        // Typescript can't infer the type of onChange
        // TODO: seems to be working fine in TS 4.9, remove type casting when upgrading
        (onChange as InputProps<'number'>['onChange'])(
          event.target.value !== '' ? parseFloat(event.target.value) : null,
          event
        );
      } else {
        (onChange as InputProps<'text'>['onChange'])(event.target.value, event);
      }
    },
    [type, onChange]
  );

  return <StyledInput {...rest} type={type} onChange={_onChange} />;
}
