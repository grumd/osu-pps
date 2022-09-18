import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import {
  ScrollArea,
  ScrollAreaCorner,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from '@/components/Scroll/Scroll';
import { useMode } from '@/hooks/useMode';

import { nextPage, useFilters } from '../hooks/useFilters';
import { useFilterWorker } from '../hooks/useFilters/useFilterWorker';
import type { Beatmap } from '../types';
import { BeatmapCard } from './BeatmapCard';

export function ScrolledFilteredMaps({ maps }: { maps: Beatmap[] | null | undefined }) {
  const mode = useMode();
  const [scrollParent, setScrollParent] = useState<HTMLDivElement | null>(null);
  const filters = useFilters();

  const filteredMaps = useFilterWorker(maps, filters);

  const hasNextPage = !!filteredMaps && filters.count <= filteredMaps.length;
  const loadMore = () => {
    if (hasNextPage) {
      nextPage(mode);
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
        {!filteredMaps ? null : filteredMaps.length === 0 ? (
          <p>{"Didn't find anything :("}</p>
        ) : (
          <Virtuoso
            data={filteredMaps}
            endReached={loadMore}
            itemContent={(index, map) => (
              <BeatmapCard key={`${map.beatmapId}_${map.mods}`} map={map} />
            )}
            customScrollParent={scrollParent ?? undefined}
          />
        )}
      </ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="vertical">
        <ScrollAreaThumb />
      </ScrollAreaScrollbar>
      <ScrollAreaCorner />
    </ScrollArea>
  );
}
