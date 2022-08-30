import { colors, space, styled } from '@/styles';

export const ErrorBox = styled('p', {
  padding: space.lg,
  background: colors.bgError,
  borderRadius: space.xs,
});

ErrorBox.displayName = 'ErrorBox';
