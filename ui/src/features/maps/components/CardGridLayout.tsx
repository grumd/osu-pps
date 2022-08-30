import { space, styled } from '@/styles';

const GridContainer = styled('div', {
  display: 'grid',
  width: '100%',
  alignItems: 'center',
  gap: space.sm,
  gridTemplateColumns: `${space.beatmapHeight} 3fr minmax(6.25em, 1fr) min-content repeat(4, minmax(6.25em, 1fr))`,
  gridTemplateRows: 'max-content',

  variants: {
    filter: {
      true: {
        alignItems: 'end',

        '@beatmapCardSm': {
          paddingTop: 0,
          paddingBottom: 0,
        },
        '@beatmapCardMd': {
          paddingTop: 0,
          paddingBottom: 0,
        },
      },
    },
    hidden: {
      true: {
        '@beatmapCardMd': {
          display: 'block',
          padding: 0,
          '& > *:not(:first-child)': {
            display: 'none',
          },
        },
        '@beatmapCardSm': {
          display: 'block',
          padding: 0,
          '& > *:not(:first-child)': {
            display: 'none',
          },
        },
      },
    },
  },

  '@beatmapCardMd': {
    gridTemplateColumns: `5.5em max-content repeat(4, minmax(6.25em, 1fr)) minmax(4.5em, 1fr)`,
    gridTemplateRows: 'max-content max-content',
    gridTemplateAreas: `
      'image title title title title title title'
      'image mods pp time bpm diff ow'
    `,
    gap: space.xs,

    '& > *:nth-child(1)': {
      gridArea: 'image',
      alignSelf: 'stretch',
      textAlign: 'left',
      height: '100%',
      width: '100%',
    },
    '& > *:nth-child(2)': {
      paddingTop: space.md,
      paddingLeft: space.sm,
      gridArea: 'title',
    },
    '& > *:nth-child(3)': {
      paddingBottom: space.md,
      gridArea: 'pp',
    },
    '& > *:nth-child(4)': {
      paddingBottom: space.md,
      paddingLeft: space.sm,
      gridArea: 'mods',
    },
    '& > *:nth-child(5)': {
      paddingBottom: space.md,
      gridArea: 'time',
    },
    '& > *:nth-child(6)': {
      paddingBottom: space.md,
      gridArea: 'bpm',
    },
    '& > *:nth-child(7)': {
      paddingBottom: space.md,
      gridArea: 'diff',
    },
    '& > *:nth-child(8)': {
      paddingBottom: space.md,
      gridArea: 'ow',
    },
  },
  '@beatmapCardSm': {
    gridTemplateColumns: `6.25em repeat(3, minmax(6.25em, 1fr)) minmax(4.5em, 0.75fr)`,
    gridTemplateRows: 'min-content max-content max-content',
    gridTemplateAreas: `
      'image title title title title'
      'image mods mods mods mods'
      'pp time bpm diff ow'
    `,
    gap: space.md,
    padding: space.md,

    '& > *': {
      padding: 0,
    },

    '& > *:nth-child(1)': {
      gridArea: 'image',
      alignSelf: 'start',
    },
    '& > *:nth-child(2)': {
      padding: 0,
      gridArea: 'title',
    },
    '& > *:nth-child(3)': {
      padding: 0,
      gridArea: 'pp',
    },
    '& > *:nth-child(4)': {
      padding: 0,
      gridArea: 'mods',
    },
    '& > *:nth-child(5)': {
      padding: 0,
      gridArea: 'time',
    },
    '& > *:nth-child(6)': {
      padding: 0,
      gridArea: 'bpm',
    },
    '& > *:nth-child(7)': {
      padding: 0,
      gridArea: 'diff',
    },
    '& > *:nth-child(8)': {
      padding: 0,
      gridArea: 'ow',
    },
  },
});

export const CardGridLayout = ({
  children,
  filter,
  hidden,
}: {
  filter?: boolean;
  hidden?: boolean;
  children: React.ReactNode;
}): JSX.Element => {
  return (
    <GridContainer filter={filter} hidden={hidden}>
      {children}
    </GridContainer>
  );
};
