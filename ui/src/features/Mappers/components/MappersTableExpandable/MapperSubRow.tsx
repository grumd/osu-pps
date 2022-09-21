import { ExternalLink } from '@/components/Link/ExternalLink';
import { ProgressBar } from '@/components/ProgressBar/ProgressBar';
import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/components/Scroll/Scroll';
import { Text } from '@/components/Text/Text';
import { colors, space, styled } from '@/styles';
import { truncateFloat } from '@/utils';
import { getBeatmapUrl } from '@/utils/externalLinks';

import type { MapperMapItem } from './types';

const Container = styled('div', {
  fontSize: '1rem',
  fontWeight: 'normal',
  padding: `0 ${space.xl}`,
  boxShadow: `inset 0 -1em 0.75em -1em ${colors.sand1}, inset 0 1em 0.75em -1em ${colors.sand1}`,

  '& td': {
    width: '50%',
    padding: space.xs,
  },

  '& tr': {
    borderBottom: `${space.borderWidth} solid ${colors.border}`,
  },

  '& table': {
    borderCollapse: 'collapse',
    width: '100%',
  },
});

const MapCountBar = styled(ProgressBar, {
  width: '100%',
  borderRadius: space.xxs,
  height: '1.3em',
  lineHeight: 1.4,
});

interface MapperMapsProps {
  data: MapperMapItem[] | undefined;
  children?: React.ReactNode;
  customHeaderRow?: React.ReactNode;
  getUrl: (id: number) => string;
}

export const MapperSubRow = ({ data, children, customHeaderRow, getUrl }: MapperMapsProps) => {
  const averagePoints = data ? data.reduce((sum, map) => sum + map.value, 0) / data.length : 0;
  const maxValue = data ? data[0].value : 0;

  return (
    <Container>
      {children}
      {data && (
        <ScrollArea>
          <ScrollAreaViewport css={{ maxHeight: '20em', height: 'auto' }}>
            <table>
              <thead>
                {customHeaderRow ?? (
                  <tr>
                    <td></td>
                    <td>
                      <Text bold>{data.length}</Text> maps; average points per map:{' '}
                      <Text bold>{truncateFloat(averagePoints)}</Text>
                    </td>
                  </tr>
                )}
              </thead>
              <tbody>
                {data.map((map) => {
                  return (
                    <tr key={map.id}>
                      <td>
                        <ExternalLink url={getUrl(map.id)}>{map.text}</ExternalLink>
                      </td>
                      <td>
                        <MapCountBar progress={map.value / maxValue}>
                          <div style={{ position: 'absolute', top: 0, left: '0.4em' }}>
                            {truncateFloat(map.value, 10)}
                          </div>
                        </MapCountBar>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollAreaViewport>
          <ScrollAreaScrollbar orientation="vertical">
            <ScrollAreaThumb />
          </ScrollAreaScrollbar>
          <ScrollAreaCorner />
        </ScrollArea>
      )}
    </Container>
  );
};
