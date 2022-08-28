import { memo, useMemo } from 'react';

import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import Loader from '@/components/Loader/Loader';
import { MapperSubRow } from '@/features/Mappers/components/MappersTableExpandable/MapperSubRow';
import type { MapperItem } from '@/features/Mappers/components/MappersTableExpandable/types';
import { space } from '@/styles';

import { useMapperMaps } from '../hooks/useMapperMaps';

export const FavMapperExpandableRow = memo(function _FavMapperExpandableRow({
  mapper,
}: {
  mapper: MapperItem;
}) {
  const { data, isLoading, error } = useMapperMaps(mapper.id);

  const subRowData = useMemo(() => {
    return data?.map((item) => ({
      value: item.count,
      id: item.id,
      text: `${item.artist} - ${item.title}`,
    }));
  }, [data]);

  return (
    <MapperSubRow data={subRowData}>
      {error instanceof Error && <ErrorBox>{error.message}</ErrorBox>}
      {isLoading && <Loader css={{ padding: `${space.md} 0` }} />}
    </MapperSubRow>
  );
});
