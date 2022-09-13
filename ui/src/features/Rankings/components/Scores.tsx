import TimeAgo from 'react-timeago';

import { ErrorBox } from '@/components/ErrorBox/ErrorBox';
import { ExternalLink } from '@/components/Link/ExternalLink';
import Loader from '@/components/Loader/Loader';
import { Text } from '@/components/Text/Text';
import { styled } from '@/styles';
import { getModsText } from '@/utils/beatmap';
import { getBeatmapUrl } from '@/utils/externalLinks';

import { useScores } from '../hooks/useScores';
import type { DataItem } from '../types';

const ScoresDiv = styled('div', {
  whiteSpace: 'normal',
});

export const Scores = ({ item }: { item: DataItem }) => {
  const { data, error, isLoading } = useScores(item.id);

  return (
    <ScoresDiv>
      {isLoading ? (
        <Loader />
      ) : error instanceof Error ? (
        <ErrorBox>{error.message}</ErrorBox>
      ) : !data ? (
        <ErrorBox>Data not found</ErrorBox>
      ) : (
        <table style={{ width: '100%', borderSpacing: '0.5em' }}>
          <thead>
            <tr>
              <td>
                updated <TimeAgo date={new Date(item.minuteUpdated * 60 * 1000)} />
              </td>
              <td>
                <Text nowrap>original pp</Text>
              </td>
              <td>
                <Text nowrap>adjusted</Text>
              </td>
              <td>
                <Text nowrap>weighted</Text>
              </td>
            </tr>
          </thead>
          <tbody>
            {data.map((score, index) => {
              const modsText = getModsText(score.mods);
              return (
                <tr key={`${score.beatmapId}_${score.mods}`}>
                  <td>
                    <ExternalLink url={getBeatmapUrl(score.beatmapId)}>{score.title}</ExternalLink>
                    {modsText && ' +' + modsText}
                  </td>
                  <td>
                    <Text nowrap>
                      <Text faded>{score.ppOld}</Text>{' '}
                      <Text color={score.ppNew >= score.ppOld ? 'green' : 'red'}>
                        {score.ppNew >= score.ppOld ? '+' : ''}
                        {score.ppNew - score.ppOld} =
                      </Text>
                    </Text>
                  </td>
                  <td>
                    <Text nowrap bold>
                      {score.ppNew}
                    </Text>
                    <Text faded>pp</Text>
                  </td>
                  <td>
                    <Text faded nowrap>
                      {Math.round(score.ppNew * Math.pow(0.95, index))} (
                      {Math.round(Math.pow(0.95, index) * 100)}
                      %)
                    </Text>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </ScoresDiv>
  );
};
