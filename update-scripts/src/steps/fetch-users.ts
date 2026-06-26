import { DEBUG } from '../config.ts';
import type { Mode } from '../modes.ts';
import { files } from '../paths.ts';
import { fetchCountryRanking } from '../osu-api/api.ts';
import type { UserListEntry } from '../data/types.ts';
import { fileExists, readJson, writeJson } from '../utils/io.ts';
import { uniqBy } from '../utils/misc.ts';

const USER_LIST_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const MAX_COUNTRIES = 60;

/**
 * Step 1: builds the list of active players by walking the performance rankings of the
 * top countries. Reuses the previous list if it is younger than two weeks.
 */
export async function fetchUsers(mode: Mode): Promise<void> {
  console.log(`1. FETCHING USERS LIST - ${mode.text}`);

  if (!DEBUG && (await hasFreshUserList(mode))) {
    return;
  }

  if (!DEBUG) {
    // Clear the old list so a crash mid-fetch doesn't leave a stale list with a fresh date
    await writeJson(files.userIdsList(mode), []);
  }

  const countries = await readJson<string[]>(files.countriesList(mode));
  const countriesToFetch = countries.slice(0, DEBUG ? 1 : MAX_COUNTRIES);
  console.log(`Fetching rankings of ${countriesToFetch.length} countries for ${mode.text}...`);

  let users: UserListEntry[] = [];
  for (const country of countriesToFetch) {
    const ranking = await fetchCountryRanking(mode, country);
    const countryUsers = ranking.map((entry) => ({
      name: entry.user.username,
      id: entry.user.id,
      pp: entry.pp,
    }));
    users = uniqBy(users.concat(countryUsers), (user) => user.id);
    console.log(`Found ${users.length} unique users in ${country}`);
  }

  await writeJson(files.userIdsList(mode), users);
  await writeJson(files.userIdsDate(mode), new Date());
  console.log(`Done fetching list of users! (${mode.text})`);
}

async function hasFreshUserList(mode: Mode): Promise<boolean> {
  if (!fileExists(files.userIdsDate(mode))) {
    console.log('No previous user list found');
    return false;
  }
  try {
    const lastUpdated = await readJson<string>(files.userIdsDate(mode));
    const age = Date.now() - new Date(lastUpdated).getTime();
    if (age < USER_LIST_MAX_AGE_MS) {
      const users = await readJson<UserListEntry[]>(files.userIdsList(mode));
      console.log(
        `Last update for ${mode.text} was at ${lastUpdated}, using cached list with ${users.length} user ids`
      );
      return true;
    }
    console.log(`Last update was at ${lastUpdated}`);
  } catch (error) {
    console.log('Error checking user list age', error);
  }
  return false;
}
