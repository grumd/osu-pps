import ParentSize from '@visx/responsive/lib/components/ParentSize';
import { Axis, GlyphSeries, Tooltip, XYChart } from '@visx/xychart';
import { useMemo, useRef, useState } from 'react';

import { Button } from '@/components/Button/Button';
import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import Loader from '@/components/Loader/Loader';
import { Mode } from '@/constants/modes';
import { useMode } from '@/hooks/useMode';
import { styled } from '@/styles';
import { getScoreUrl, getUserUrl } from '@/utils/externalLinks';

import { useMapPpData } from '../../hooks/useMapPpData';
import type { DataPoint } from '../../hooks/useMapPpData';
import { ScoreTooltip } from './ScoreTooltip';

const xAccessor = (d: DataPoint) => d && d.accuracy;
const yAccessor = (d: DataPoint) => d && d.pp;

const missesColors = ['#5ab852', '#e58850', '#fa6151', '#ed4545'];
const colorAccessor = (d: DataPoint) => missesColors[Math.min(d.statistics.count_miss, 3)];
const colorAccessorMania = () => missesColors[0];

const GraphContainer = styled('div', {
  height: '40vw',
  maxHeight: 300,
});
const ScoreLinkContainer = styled('div', {
  textAlign: 'right',
  fontSize: '75%',
});

interface PpDialogContentProps {
  beatmapId: number;
  modsBitmask: number;
}

export default function PpDialogContent({ beatmapId, modsBitmask }: PpDialogContentProps) {
  const isTouchEvent = useRef(false);
  const [lastTouchedScore, setLastTouchedScore] = useState<DataPoint | null>(null);
  const { data, isLoading, error } = useMapPpData(beatmapId, modsBitmask);
  const mode = useMode();
  const visibleTooltipDataPoint = useRef<DataPoint | undefined>();

  const lineData = useMemo(() => {
    return (
      data &&
      Object.entries(data)
        .map(([accuracy, score]) => {
          return {
            ...score,
            accuracy: Number(accuracy),
          };
        })
        .sort((a, b) => a.accuracy - b.accuracy)
    );
  }, [data]);

  if (error instanceof Error) {
    return <ErrorBox>{error.message}</ErrorBox>;
  }

  if (isLoading || !lineData) {
    return <Loader />;
  }

  const openScorePage = (score: DataPoint) => {
    if (score.score_id) window.open(getScoreUrl(mode, score.score_id), '_blank');
    else window.open(getUserUrl(score.user_id), '_blank');
  };

  const maxAccuracy =
    mode === Mode.fruits ? Math.min(100, lineData[lineData.length - 1].accuracy + 0.1) : 100;

  return (
    <div>
      <GraphContainer>
        <ParentSize>
          {({ width, height }) => {
            return (
              <XYChart
                xScale={{
                  type: 'linear',
                  zero: false,
                  domain: [lineData[0].accuracy - 0.1, maxAccuracy],
                }}
                yScale={{ type: 'linear', zero: false }}
                height={height}
                width={width}
                margin={{ top: 10, bottom: 40, left: 10, right: 45 }}
              >
                <Axis
                  stroke="grey"
                  strokeWidth={1}
                  tickStroke="grey"
                  orientation="bottom"
                  numTicks={5}
                  tickFormat={(n) => `${n}%`}
                />
                <Axis
                  stroke="grey"
                  strokeWidth={1}
                  tickStroke="grey"
                  orientation="right"
                  numTicks={5}
                  tickFormat={(n) => `${n}pp`}
                />
                <GlyphSeries
                  colorAccessor={mode === Mode.mania ? colorAccessorMania : colorAccessor}
                  size={Math.ceil(width / 80)}
                  dataKey="pp"
                  data={lineData}
                  xAccessor={xAccessor}
                  yAccessor={yAccessor}
                  onPointerDown={({ event }) => {
                    isTouchEvent.current =
                      !!event && 'pointerType' in event && event.pointerType === 'touch';
                  }}
                  onPointerUp={({ datum, event }) => {
                    if (event && 'pointerType' in event) {
                      if (event.pointerType !== 'touch' && event.isPrimary) {
                        openScorePage(datum);
                      }
                      if (event.pointerType === 'touch') {
                        setLastTouchedScore(datum);
                      }
                    }
                  }}
                />
                <Tooltip
                  detectBounds
                  showVerticalCrosshair
                  showHorizontalCrosshair
                  snapTooltipToDatumX
                  snapTooltipToDatumY
                  className="visx-tooltip-reset"
                  renderTooltip={({ tooltipData }) => {
                    const d = tooltipData?.nearestDatum?.datum as DataPoint | undefined;
                    visibleTooltipDataPoint.current = d;
                    if (!d) return null;
                    return (
                      <ScoreTooltip mode={mode} score={d} hideLinkText={isTouchEvent.current} />
                    );
                  }}
                />
              </XYChart>
            );
          }}
        </ParentSize>
      </GraphContainer>
      {lastTouchedScore && (
        <ScoreLinkContainer>
          <Button kind="light" onClick={() => openScorePage(lastTouchedScore)}>
            open selected score in new tab
          </Button>
        </ScoreLinkContainer>
      )}
    </div>
  );
}
