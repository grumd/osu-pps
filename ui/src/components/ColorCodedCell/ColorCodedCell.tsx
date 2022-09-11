import { ColorCodeStyle } from '@/hooks/useColorCodeStyle';
import { colors, fonts, space, styled } from '@/styles';

const ColoredCellContainer = styled('span', {
  fontWeight: 'bold',
  display: 'flex',
  flexFlow: 'row nowrap',
  justifyContent: 'center',
  alignItems: 'center',
});

const ColoredCellSpan = styled('span', {
  fontSize: fonts[125],
  textAlign: 'center',
  padding: `${space.xs} ${space.md}`,

  variants: {
    kind: {
      [ColorCodeStyle.None]: {},
      [ColorCodeStyle.Background]: {
        borderRadius: space.sm,
        backgroundColor: 'var(--color)',
      },
      [ColorCodeStyle.Underline]: {
        fontWeight: 'bold',
        position: 'relative',

        '&::before': {
          position: 'absolute',
          content: '',
          top: '95%',
          left: '20%',
          height: '0.3em',
          width: '60%',
          borderRadius: '0.15em',
          backgroundColor: 'var(--color)',
        },
      },
      [ColorCodeStyle.Border]: {
        borderColor: 'var(--color)',
        borderWidth: '0.15em',
        borderStyle: 'solid',
        borderRadius: space.md,
        background: colors.sand5,
      },
      [ColorCodeStyle.TextColor]: {
        color: 'var(--color)',
        fontWeight: 'bold',
      },
    },
  },
});

interface ColorCodedCellProps {
  color?: string;
  children: React.ReactNode;
  kind: ColorCodeStyle;
  'aria-label'?: string;
}

export const ColorCodedCell = ({
  color,
  children,
  kind = ColorCodeStyle.Background,
  'aria-label': ariaLabel,
}: ColorCodedCellProps) => {
  return (
    <ColoredCellContainer>
      <ColoredCellSpan aria-label={ariaLabel} kind={kind} style={{ '--color': color || 'white' }}>
        {children}
      </ColoredCellSpan>
    </ColoredCellContainer>
  );
};
