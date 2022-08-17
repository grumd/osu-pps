import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/components/Scroll/Scroll';

import { nextPage, useFilters } from '../hooks/useFilters';
import { useFilterWorker } from '../hooks/useFilters/useFilterWorker';
import type { Beatmap } from '../types';
import { BeatmapCard } from './BeatmapCard';

export function ScrolledFilteredMaps({ maps }: { maps: Beatmap[] | null | undefined }) {
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const filters = useFilters();

  const filteredMaps = useFilterWorker(maps, filters);

  const hasNextPage = filters.count <= filteredMaps.length;
  const loadMore = () => {
    if (hasNextPage) {
      nextPage();
    }
  };

  return (
    <ScrollArea
      css={{
        flex: '1 1 0px',
        display: 'flex',
        flexFlow: 'column nowrap',
        alignItems: 'center',
      }}
    >
      <ScrollAreaViewport ref={setScrollParent}>
        <Virtuoso
          data={filteredMaps}
          endReached={loadMore}
          itemContent={(index, map) => (
            <BeatmapCard key={`${map.beatmapId}_${map.mods}`} map={map} />
          )}
          customScrollParent={scrollParent ?? undefined}
        />
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="vertical">
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
      <ScrollAreaCorner />
    </ScrollArea>
  );
}
