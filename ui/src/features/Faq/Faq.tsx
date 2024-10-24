/* eslint-disable react/no-unescaped-entities */
import { colors, space, styled } from '@/styles';

const faqs = [
  {
    question: 'What is overweightness? How is it calculated?',
    answer: `It's a metric I invented that shows how easy it is to get pp out of a particular map as compared to other maps of that level.
      Main component of my formulae is how many people have this map as their top score.
      If a map is easier than other maps, more people in general will have this map as one of their top scores.
      It also accounts for several other things, e.g. how recently a map was ranked, how many people can play at this level, how much playcount this map has, etc.`,
  },
  {
    question: 'What does the pp number in the map list mean?',
    answer: `You could notice that the pp number doesn't mean pp for 100% or even pp for 99%. "Maps" page actually shows average pp that people get
      from this map when it's in their top plays. So if a map is often SS'd, then this number will be close to pp for SS. If a map is often passed with a few misses for good pp,
      then pp number will be lower. The reason why I don't just show pp for 99% is that I would need to run pp calculator for thousands of maps (and download all of these maps too),
      and it would take too much time to update the database. So I just use the pp numbers from the scores of players.`,
  },
  {
    question: 'How is the list of "pp mappers" calculated?',
    answer: `Mappers' "score" is the sum of overweightness points of every map they made. Whoever has the most total points, wins the golden poopy.
      I try my best to figure out the mappers of guest diffs, but it's not perfect. Every diff is only included once, with the mod combination that has the most overweightness.`,
  },
  {
    question: 'How is the list of "quality mappers" calculated?',
    answer: (
      <>
        Every mapper's score is based on how many favourites from other experienced mappers their
        maps get.
        <br />
        "Experienced mappers" is defined as having 3+ ranked maps. If a mapper has 3 mapsets ranked,
        one their favourite is weighted as 0.125 points. If they have 10 or more maps ranked, their
        favourite is weighted as 1 point. Scales linearly between 3 and 10.
        <br />
        There's more than 1800 mappers who "participate" in judging this ranking.
        <br />
        Doesn't include self-favorites.
        <br />
        Note: the more ranked maps a mapper has, the higher score they get. Some good mappers with
        few ranked maps might be ranked lower than expected.
      </>
    ),
  },
  {
    question: 'How are your player rankings calculated?',
    answer: (
      <>
        Overweighted maps get nerfed, underweighted maps get buffed. A map is underweighted if it
        has less overweightness points than an average map of that difficulty. Updated pp values for
        every map will range from 80% to 112.5% of original pp values. Small changes, but it adds
        up.
        <br />
        - Only includes players from official top ~11k rankings.
        <br />
        - Total pp of every player is lower than official because I only count top 100 scores, and
        don't count bonus pp.
        <br />- This list can not replace the official rankings, because it can't even exist without
        it.
      </>
    ),
  },
  {
    question: `Is this a full beatmap database that has all ranked maps ever?`,
    answer: (
      <>
        No, this database only includes maps that <b>at least one player has a top 100 score on</b>.
        I only scan a couple hundred thousands of top players, so some maps that aren't actively
        played are not in the database. That's also why you might not find the map you're looking
        for if you're sorting by length/difficulty/etc.
      </>
    ),
  },
];

const FaqList = styled('ul', {
  marginTop: 0,
  paddingLeft: space.xl,
  borderTop: `1px solid ${colors.sand6}`,
  width: space.pageMaxWidth,
  maxWidth: '100%',
  margin: '0 auto',

  '& > li': {
    paddingTop: space.lg,

    '& + li': {
      borderTop: `1px solid ${colors.sand6}`,
    },

    '& > div': {
      fontWeight: 700,
    },
  },
});

export function Faq() {
  return (
    <FaqList>
      {faqs.map((item) => (
        <li key={item.question}>
          <div>{item.question}</div>
          <p>{item.answer}</p>
        </li>
      ))}
    </FaqList>
  );
}
