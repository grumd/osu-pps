# osu-pps - osu! farm maps

A [website made by grumd](https://osu-pps.com) with a list of most farmy maps in osu!.  
Supports osu!std, taiko, mania, fruits.

# Setup

You should have nodejs and npm installed first. The update scripts require node v24+ (they run TypeScript natively).  
For initial setup, run `npm i` in `/update-scripts` and in `/ui` if you want to run the front-end.  
To run update scripts, you also need to create a `/update-scripts/config.json` file with your [osu! OAuth app](https://osu.ppy.sh/home/account/edit#oauth) credentials:

```json
{
  "client_id": 123,
  "client_secret": "<your-oauth-client-secret>"
}
```

### Front-end
Open `/ui` and run `npm start`.

For debugging, you can change `VITE_LOCAL_FETCH` env variable in `/ui/.env` - front-end will search for json data files in `/react-app/public` instead of fething json from github.

### Back-end (data update scripts)
Open `/update-scripts` and run `npm start` (runs the daily scheduler), or
`npm run update-mode -- osu` to update a single mode once.

For debugging, run with `npm run start:debug` (or add `--debug --no-push`) - limits the update
process to just a few users/maps for testing, and doesn't push data to git.

See [`/update-scripts/DOCUMENTATION.md`](update-scripts/DOCUMENTATION.md) for a full description
of the update pipeline and all the data files it produces.

# Contributing

I didn't intend for this repository to have contributions, it's mostly here for my own convenience. The code is pretty messy and hard to understand.

But if you still want to contribute, you can create a merge request based on `develop` branch.
`master` branch shouldn't be touched, it's used for data updates and is force-pushed regularly.

# License

I'm using an MIT license, see [`LICENSE`](https://github.com/grumd/osu-pps/blob/develop/LICENSE).
