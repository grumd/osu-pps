import type { ChangeEvent, InputHTMLAttributes } from 'react';
import { useCallback } from 'react';

import { colors, space, styled } from '@/styles';

const StyledInput = styled('input', {
  all: 'unset',
  padding: space.xs,
  background: colors.sand1,
  color: colors.sand12,
  borderRadius: space.sm,
  border: `thin solid ${colors.sand8}`,

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

type CustomProps<Type extends InputTypes> = Type extends 'number'
  ? {
      type: Type;
      onChange: (value: number | null, event: ChangeEvent<HTMLInputElement>) => void;
    }
  : {
      type: Type;
      onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
    };

export function Input<Type extends InputTypes>(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> & CustomProps<Type>
): JSX.Element {
  const { onChange, type, ...rest } = props;

  const _onChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      if (type === 'number') {
        onChange(event.target.value !== '' ? parseFloat(event.target.value) : null, event);
      } else {
        onChange(event.target.value, event);
      }
    },
    [type, onChange]
  );

  return <StyledInput {...rest} type={type} onChange={_onChange} />;
}
