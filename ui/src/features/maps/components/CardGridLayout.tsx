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
      false: {
        '@beatmapCardMd': {
          '& > *': {
            paddingBottom: space.md,
          },
          '& > *:nth-child(1), & > *:nth-child(2)': {
            paddingBottom: 0,
          },
          '& > *:nth-child(2)': {
            paddingTop: space.md,
          },
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
      gridArea: 'title',
      paddingLeft: space.sm,
    },
    '& > *:nth-child(3)': {
      gridArea: 'pp',
    },
    '& > *:nth-child(4)': {
      gridArea: 'mods',
      paddingLeft: space.sm,
    },
    '& > *:nth-child(5)': {
      gridArea: 'time',
    },
    '& > *:nth-child(6)': {
      gridArea: 'bpm',
    },
    '& > *:nth-child(7)': {
      gridArea: 'diff',
    },
    '& > *:nth-child(8)': {
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
      textAlign: 'left',
      height: '100%',
      width: '100%',
    },
    '& > *:nth-child(2)': {
      gridArea: 'title',
    },
    '& > *:nth-child(3)': {
      gridArea: 'pp',
    },
    '& > *:nth-child(4)': {
      gridArea: 'mods',
    },
    '& > *:nth-child(5)': {
      gridArea: 'time',
    },
    '& > *:nth-child(6)': {
      gridArea: 'bpm',
    },
    '& > *:nth-child(7)': {
      gridArea: 'diff',
    },
    '& > *:nth-child(8)': {
      gridArea: 'ow',
    },
  },
});

export const CardGridLayout = ({
  children,
  filter = false,
  hidden = false,
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
