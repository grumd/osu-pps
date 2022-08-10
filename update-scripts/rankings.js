const _ = require('lodash/fp');
const Papa = require('papaparse');

// const { modes } = require('./constants');
const {
  simplifyMods,
  trimModsForRankings,
  writeFileSync,
  files,
  writeJson,
  readJson,
} = require('./utils');

module.exports = async (mode) => {
  console.log('3. CALCULATING RANKINGS');
  let players = await readJson(files.userIdsList(mode));
  players.sort((a, b) => b.pp - a.pp); // to get rank #
  players.forEach((pl, index) => {
    pl.rank1 = index + 1;
  });
  const scores = await readJson(files.userMapsList(mode));
  const updateDatePerUser = await readJson(files.userMapsDates(mode));
  const mapsData = await readJson(files.mapsDetailedList(mode));
  console.log('Calculating overweightness for every map');
  // Calculate maximum and average Overweightness
  let maxOW = 0;
  let sum = 0;
  let count = 0;
  const mapsDataWithAdjValue = mapsData.map((item) => {
    const x = +item.x / Math.pow(item.adj || 1, 0.65) / Math.pow(+item.h || 1, 0.35);
    maxOW = maxOW < x ? x : maxOW;
    if (x > 0.00005) {
      sum += x;
      count++;
    }
    return {
      ...item,
      x,
    };
  });

  const averageOW = sum / count;
  console.log('Max OW:', maxOW, 'Avg OW:', averageOW);

  console.log('Creating a maps dictionary');
  const mapsDictionary = _.groupBy('b', mapsDataWithAdjValue);

  const getFarmValue = (player) => {
    const playerScores = scores[player.id];
    if (playerScores) {
      let newScores = [];
      playerScores.forEach((scoreString) => {
        const scoreArray = scoreString.split('_');
        const score = {
          b: scoreArray[0],
          m: scoreArray[1],
          pp: scoreArray[2],
        };
        const allMaps = mapsDictionary[score.b];
        const nomodOrDtMaps = allMaps.filter((map) => map.m == trimModsForRankings(score.m));
        if (allMaps.length) {
          const thisMap = allMaps.find((map) => map.m == simplifyMods(score.m));
          const thisMapX = thisMap ? thisMap.x : 0;
          const maxLocal = allMaps.reduce((acc, map) => (acc > map.x ? acc : map.x), 0);
          const maxLocalNomodOrDt = nomodOrDtMaps.reduce(
            (acc, map) => (acc > map.x ? acc : map.x),
            0
          );
          const adjustedX = (maxLocal + maxLocalNomodOrDt + 3 * thisMapX) / 5;
          const adjust =
            adjustedX > averageOW
              ? Math.sqrt((adjustedX - averageOW) / (maxOW - averageOW))
              : Math.sqrt(adjustedX / averageOW) - 1;

          let pp = score.pp;
          pp *= 1 - adjust * (adjustedX > averageOW ? 0.2 : 0.125);
          newScores.push({
            n: `${allMaps[0].art} - ${allMaps[0].t} [${allMaps[0].v}]`, // map name
            m: score.m, // mods number
            b: allMaps[0].b, // beatmap id
            p1: Math.round(score.pp), // previous PP
            p2: Math.round(pp), // new PP
          });
        } else {
          console.log();
          console.log(player.name, '- not found any maps -', score);
          newScores.push({
            n: score.b, // map name
            m: score.m, // mods number
            b: score.b, // beatmap id
            p1: Math.round(score.pp), // previous PP
            p2: Math.round(score.pp), // new PP
          });
        }
      });
      newScores = newScores.sort((a, b) => b.p2 - a.p2);
      const ppDiff = newScores.reduce((ppDiffSum, score) => ppDiffSum + score.p2 - score.p1, 0);

      const ppNewTotal = newScores.reduce(
        (ppDiffSum, score, index) => ppDiffSum + score.p2 * Math.pow(0.95, index),
        0
      );
      const minuteUpdated = updateDatePerUser[player.id];
      return {
        n: player.name,
        id: player.id,
        // not trying to subtract totals, because old total is a total of ALL scores, not just top 100
        ppDiff,
        pp: player.pp,
        ppNew: ppNewTotal,
        minuteUpdated,
        s: newScores.slice(0, 50), // list of recalculated scores - only keep top 50 now!
        allScores: newScores,
      };
    }
  };

  const rankings = players.map(getFarmValue).filter((a) => a && a.s && a.s.length); // filter out no scores players

  console.log('Writing temp rankings data');
  await writeJson(files.dataRankings(mode), rankings);

  console.log('Compressing rankings');

  let csvPlayerRankings = [];
  for (const player of rankings) {
    csvPlayerRankings.push({
      id: player.id,
      name: player.n,
      ppOld: player.pp,
      ppNew: player.ppNew.toFixed(2),
      ppDiff: player.ppDiff,
      minuteUpdated: player.minuteUpdated,
    });

    const scores = player.allScores.map((score) => {
      return {
        title: score.n,
        mods: score.m,
        beatmapId: score.b,
        ppOld: score.p1,
        ppNew: score.p2,
      };
    });
    await writeJson(files.rankingsPlayerScores(mode, player.id), scores);
  }
  csvPlayerRankings = csvPlayerRankings.sort((a, b) => b.ppNew - a.ppNew);
  writeFileSync(files.rankingsCsv(mode), Papa.unparse(csvPlayerRankings));

  // TODO: remove saving of dataRankingsCompressed and dataRankingsInfo
  const diffInfoArray = [];
  const compressedData = rankings.map((player) => {
    const scores = player.s.map((score) => {
      const text = `${score.b} ${score.n}`;
      let index = diffInfoArray.indexOf(text);
      if (index === -1) {
        diffInfoArray.push(text);
        index = diffInfoArray.length - 1;
      }
      return `${index}_${score.m}_${score.p1}_${score.p2}`;
    });
    return [player.n, player.minuteUpdated, player.ppDiff, scores];
  });

  await writeJson(files.dataRankingsCompressed(mode), compressedData);
  await writeJson(files.dataRankingsInfo(mode), diffInfoArray);

  console.log('Finished calculating rankings!');
  /*
  return parallelRun({
    items: rankings,
    job: player => {
      return fetchUserRank({ userId: player.id, modeId: mode.id })
        .then(rank => {
          player.rank1 = rank;
        })
        .catch(e => {
          console.log();
          console.log(`Couldnt get rank for ${player.n}`);
          console.log(e.message);
        });
    },
  }).then(async () => {
    rankings = rankings.filter(player => player.rank1);
    rankings = rankings.sort((a, b) => a.rank1 - b.rank1);
    await writeJson(files.dataRankings(mode), rankings);
    console.log();
    console.log('Finished calculating rankings!');
  });
  */
};

// module.exports(modes.osu);
