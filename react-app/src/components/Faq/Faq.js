import React from 'react';
// import toBe from 'prop-types';
// import { connect } from 'react-redux';
// import classNames from 'classnames';

import './faq.scss';

// import CollapsibleBar from 'components/CollapsibleBar';
// import ParamLink from 'components/ParamLink/ParamLink';

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
      and it would take too much time to update the database.`,
  },
  {
    question: 'How are your player rankings calculated?',
    answer: `Overweighted maps get nerfed, underweighted maps get buffed. A map is underweighted if it has less overweightness points than an average map of that difficulty.
      Updated pp values for every map will range from 80% to 112.5% of original pp values. Small changes, but it adds up.
      <br />
      - Only includes players from official top ~11k rankings.<br />
      - Total pp of every player is lower than official because I only count top 50 scores, and don't count bonus pp.<br />
      - This list can not replace the official rankings, because it can't even exist without them.`,
  },
  {
    question: 'How is the list of pp mappers calculated?',
    answer: `Mappers' "score" is the sum of overweightness points of every their map. Whoever has the most total points, wins the golden poopy.
      I try my best to figure out the mappers of guest diffs, but it's not perfect. Every diff is only included once, with the mod combination that has the most overweightness.
      One important caveat: For now it uses total overweightness points instead of "adjusted".
      I'm planning to change it so that overweightness numbers match the same numbers from the maps tab.`,
  },
  {
    question: 'How is the list of "best" mappers calculated?',
    answer: `All experienced mappers are the judges of this ranking. They vote with their favorites.<br />
      Every mapper's score is the (weighted) sum of favorites that their maps received from other mappers.
      Only mappers with 3+ ranked maps get their vote counted. If a mapper has 3 mapsets ranked, their vote is weighted as 0.125.
      If they have 10+ maps ranked, their vote is weighted as 1. Scales linearly between 3 and 10.<br />
      There are more than a thousand mappers who "participate" in judging this ranking.<br />
      Doesn't include self-favorites.<br />
      Note: if a mapper has more maps ranked, their score will be higher on average due to obvious reasons.`,
  },
  // {
  //   question: 'How is the list of quality mappers calculated?',
  //   answer: `I take the list of mappers who have ranked 3 or more maps. For std, there are around 1500 of them.
  //     They are my judges. I take lists of favorite maps for each of these judges. Then I calculate which mapper gets the most favorites in total, from other mappers.
  //     I have an assumption that most casual players fav maps because they like the song, because they want to get a good score on it, or simply because it's fun.
  //     But mappers most likely pay more attention to the map's structure, quality and creativity.
  //     This list is intended to show which mappers are most loved by other mappers, nothing special.`,
  // },
];

function Faq() {
  return (
    <ul className="faq">
      {faqs.map(item => {
        return (
          <li className="faq-qa">
            <div className="question">{item.question}</div>
            <div className="answer" dangerouslySetInnerHTML={{ __html: item.answer }}></div>
          </li>
        );
      })}
    </ul>
  );
}

export default Faq;
