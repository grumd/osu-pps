import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { ExternalLink } from '@/components/Link/ExternalLink';
import Loader from '@/components/Loader/Loader';
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

import { useMapperMaps } from '../hooks/useMapperMaps';
import type { FavMapper } from '../types';

interface MapperMapsProps {
  mapper: FavMapper;
}

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
  },
});

const MapCountBar = styled(ProgressBar, {
  width: '100%',
  borderRadius: space.xxs,
  height: '1.3em',
  lineHeight: 1.4,
});

export const MapperMaps = ({ mapper }: MapperMapsProps) => {
  const { data, isLoading, error } = useMapperMaps(mapper.mapperId);
  const averagePoints = data ? data.reduce((sum, map) => sum + map.count, 0) / data.length : 0;
  const maxPoints = data ? data[0].count : 0;

  return (
    <Container>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && <Loader css={{ padding: `${space.md} 0` }} />}
      {data && (
        <ScrollArea>
          <ScrollAreaViewport css={{ maxHeight: '20em', height: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <td></td>
                  <td>
                    <Text bold>{data.length}</Text> maps; average points per map:{' '}
                    <Text bold>{truncateFloat(averagePoints)}</Text>
                  </td>
                </tr>
              </thead>
              <tbody>
                {data.map((map) => {
                  return (
                    <tr key={map.id}>
                      <td>
                        <ExternalLink url={`https://osu.ppy.sh/beatmapsets/${map.id}`}>
                          {map.artist} - {map.title}
                        </ExternalLink>
                      </td>
                      <td>
                        <MapCountBar progress={map.count / maxPoints}>
                          <div style={{ position: 'absolute', top: 0, left: '0.4em' }}>
                            {truncateFloat(map.count, 10)}
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
