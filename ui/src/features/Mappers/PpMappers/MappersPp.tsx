import { useCallback, useMemo, useState } from 'react';

import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import Loader from '@/components/Loader/Loader';
import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/components/Scroll/Scroll';
import { Text } from '@/components/Text/Text';
import { CalcMode } from '@/constants/modes';
import { MapperSubRow } from '@/features/Mappers/components/MappersTableExpandable/MapperSubRow';
import { MappersTableExpandable } from '@/features/Mappers/components/MappersTableExpandable/MappersTableExpandable';
import type {
  MapperItem,
  MapperMapItem,
} from '@/features/Mappers/components/MappersTableExpandable/types';
import { space, styled } from '@/styles';
import { farmValueCalc } from '@/utils/farmValue';

import { usePpMappers } from './hooks/usePpMappers';
import prizeBronze from './images/prize_bronze.png';
import prizeGold from './images/prize_gold.png';
import prizeSilver from './images/prize_silver.png';

const StyledMain = styled('main', {
  flex: '1 1 auto',
  display: 'flex',
  flexFlow: 'column nowrap',
  alignItems: 'center',
});

const MapperName = styled('div', {
  display: 'flex',
  flexFlow: 'row nowrap',
  alignItems: 'center',
});

const PrizeImg = styled('img', {
  marginLeft: space.md,
  height: '1.8em',
});

const getMapperName = (name: string, index: number) => {
  return (
    <MapperName>
      <span>{name}</span>
      {index < 3 && <PrizeImg src={[prizeGold, prizeSilver, prizeBronze][index]} alt=" " />}
    </MapperName>
  );
};

const getAdjustedFarmValue = (value: number): number => {
  return farmValueCalc[CalcMode.ByPopulationAndTime]({
    farmValue: value,
    hoursSinceRanked: 1,
    passCount: 1,
    adjusted: 1,
  });
};

interface PpMapperItem extends MapperItem {
  maps: MapperMapItem[];
}

export function MappersPp() {
  const { data, isLoading, error } = usePpMappers();
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);

  const top20 = data?.top20adj;

  const mappedData = useMemo(() => {
    return top20?.map(
      (item, index): PpMapperItem => ({
        id: item.id,
        names: [getMapperName(item.name, index)],
        value: getAdjustedFarmValue(item.points),
        place: index + 1,
        maps: item.mapsRecorded.map((map) => ({
          value: getAdjustedFarmValue(map.ow),
          id: map.id,
          text: map.text,
        })),
      })
    );
  }, [top20]);

  const maxValue = mappedData ? mappedData[0].value : 0;

  const renderExpandedRow = useCallback(({ mapper }: { mapper: PpMapperItem }) => {
    return (
      <MapperSubRow
        data={mapper.maps}
        customHeaderRow={
          <tr>
            <td>
              <Text faded>only showing top 20 maps</Text>
            </td>
          </tr>
        }
      />
    );
  }, []);

  return (
    <StyledMain>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && <Loader css={{ padding: `${space.md} 0` }} />}
      {mappedData && (
        <>
          <ScrollArea css={{ flex: '1 1 0px' }}>
            <ScrollAreaViewport ref={setScrollParent}>
              <MappersTableExpandable
                mappers={mappedData}
                scrollParent={scrollParent ?? undefined}
                maxValue={maxValue}
                renderExpandedRow={renderExpandedRow}
              />
            </ScrollAreaViewport>
            <ScrollAreaScrollbar orientation="vertical">
              <ScrollAreaThumb />
            </ScrollAreaScrollbar>
            <ScrollAreaCorner />
          </ScrollArea>
        </>
      )}
    </StyledMain>
  );
}
