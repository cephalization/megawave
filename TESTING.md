# Testing Megawave

This guide describes a repeatable smoke-test flow for agents. It uses generated audio files, an isolated SQLite database, curl checks against the API, and browser checks against the UI.

## Prerequisites

- Run commands from the repository root.
- Install dependencies with `pnpm install`.
- Install `ffmpeg` for generating test tracks.
- Install `jq` for the curl examples.
- Keep test data outside the repo, under `/tmp/megawave-test`.

## Generate Tracks

Create a small deterministic library with tagged MP3 files:

```sh
TEST_ROOT=/tmp/megawave-test
rm -rf "$TEST_ROOT"
mkdir -p "$TEST_ROOT/music/Album One" "$TEST_ROOT/music/Album Two" "$TEST_ROOT/db"

ffmpeg -y -f lavfi -i sine=frequency=440:duration=2 \
  -metadata title="Alpha Wave" \
  -metadata artist="Agent Artist" \
  -metadata album="Album One" \
  -metadata track="1" \
  "$TEST_ROOT/music/Album One/01 Alpha Wave.mp3"

ffmpeg -y -f lavfi -i sine=frequency=554:duration=2 \
  -metadata title="Beta Wave" \
  -metadata artist="Agent Artist" \
  -metadata album="Album One" \
  -metadata track="2" \
  "$TEST_ROOT/music/Album One/02 Beta Wave.mp3"

ffmpeg -y -f lavfi -i sine=frequency=660:duration=2 \
  -metadata title="Gamma Pulse" \
  -metadata artist="Second Artist" \
  -metadata album="Album Two" \
  -metadata track="1" \
  "$TEST_ROOT/music/Album Two/01 Gamma Pulse.mp3"
```

Expected library:

- 3 tracks
- 2 albums
- 2 artists

## Start Dev Servers

Use package-specific commands for deterministic background processes. This avoids Turbo's interactive TUI during automated testing.

```sh
TEST_ROOT=/tmp/megawave-test
MUSIC_LIBRARY_PATH="$TEST_ROOT/music" \
DATABASE_PATH="$TEST_ROOT/db" \
pnpm --filter api dev > "$TEST_ROOT/api.log" 2>&1 &
echo $! > "$TEST_ROOT/api.pid"

until curl -fsS http://localhost:5001/api/health >/dev/null; do sleep 1; done

pnpm --filter web exec vite --host 0.0.0.0 --port 5173 --strictPort > "$TEST_ROOT/web.log" 2>&1 &
echo $! > "$TEST_ROOT/web.pid"

until curl -fsS http://localhost:5173 >/dev/null; do sleep 1; done
```

If a previous run left stale servers behind, stop only the known dev ports:

```sh
for port in 5001 5173; do
  lsof -ti ":$port" | while read -r pid; do
    [ -z "$pid" ] || kill "$pid"
  done
done
```

To stop the test servers from this run:

```sh
kill "$(cat /tmp/megawave-test/api.pid)" "$(cat /tmp/megawave-test/web.pid)"
```

## API Curl Tests

Set a base URL:

```sh
BASE=http://localhost:5001
```

Check health:

```sh
curl -fsS "$BASE/api/health" | jq .
```

Wait for startup scan to finish:

```sh
until [ "$(curl -fsS "$BASE/api/library/status" | jq -r '.scanActive')" = "false" ]; do
  curl -fsS "$BASE/api/library/status" | jq '{status, scanActive, filesProcessed, tracksAdded, tracksUpdated, tracksErrored, lastError}'
  sleep 1
done
```

Verify status:

```sh
curl -fsS "$BASE/api/library/status" | jq '{status, scanActive, filesDiscovered, filesProcessed, tracksAdded, tracksUpdated, tracksErrored, lastError}'
```

Expected result:

- `scanActive` is `false`
- `tracksErrored` is `0`
- `lastError` is `null`
- `filesProcessed` is `3`

Verify songs:

```sh
curl -fsS "$BASE/api/library/songs?limit=10" | jq '{total: .meta.total, names: [.data[].name]}'
```

Expected result:

- `total` is `3`
- names include `Alpha Wave`, `Beta Wave`, and `Gamma Pulse`

Verify search:

```sh
curl -fsS "$BASE/api/library/songs?filter=Alpha" | jq '{total: .meta.total, names: [.data[].name]}'
```

Expected result:

- `total` is `1`
- names include `Alpha Wave`

Verify albums:

```sh
curl -fsS "$BASE/api/library/albums" | jq '{count: length, albums: [.[] | {id, name, trackCount}]}'
```

Expected result:

- count is `2`
- `Album One` has `trackCount` `2`
- `Album Two` has `trackCount` `1`

Verify album tracks:

```sh
ALBUM_ID=$(curl -fsS "$BASE/api/library/albums?filter=Album%20One" | jq -r '.[0].id')
curl -fsS "$BASE/api/library/albums/$ALBUM_ID/tracks" | jq '{total: .meta.total, names: [.data[].name]}'
```

Expected result:

- `total` is `2`
- names include `Alpha Wave` and `Beta Wave`

Verify artists:

```sh
curl -fsS "$BASE/api/library/artists" | jq '{count: length, artists: [.[] | {id, name, trackCount, albumCount}]}'
```

Expected result:

- count is `2`
- `Agent Artist` has `trackCount` `2`
- `Second Artist` has `trackCount` `1`

Verify artist tracks:

```sh
ARTIST_ID=$(curl -fsS "$BASE/api/library/artists?filter=Agent%20Artist" | jq -r '.[0].id')
curl -fsS "$BASE/api/library/artists/$ARTIST_ID/tracks" | jq '{total: .meta.total, names: [.data[].name]}'
```

Expected result:

- `total` is `2`
- names include `Alpha Wave` and `Beta Wave`

Verify streaming with a byte range:

```sh
TRACK_ID=$(curl -fsS "$BASE/api/library/songs?filter=Alpha" | jq -r '.data[0].id')
curl -fsS -H 'Range: bytes=0-99' -D "$TEST_ROOT/stream.headers" -o "$TEST_ROOT/stream.bin" "$BASE/api/library/songs/$TRACK_ID"
grep -q '206 Partial Content' "$TEST_ROOT/stream.headers"
test -s "$TEST_ROOT/stream.bin"
```

Trigger a manual rescan:

```sh
curl -fsS -X POST "$BASE/api/library/rescan" | jq '{status, scanActive, filesDiscovered, filesProcessed}'
```

Expected result:

- response is valid JSON status
- if scan starts, polling `/api/library/status` eventually returns `scanActive: false`

## Agent-Browser UI Tests

Run agent-browser against `http://localhost:5173` after the API curl tests pass.

Use this checklist:

- Open `http://localhost:5173`.
- Wait for the library loading state to finish.
- Confirm the track view shows `Alpha Wave`, `Beta Wave`, and `Gamma Pulse`.
- Confirm the count area reports 3 tracks, 2 albums, and 2 artists, or equivalent UI text.
- Search for `Alpha` and confirm only `Alpha Wave` remains visible.
- Clear search and switch to the albums view.
- Confirm `Album One` and `Album Two` are visible.
- Open or filter `Album One` and confirm `Alpha Wave` and `Beta Wave` are visible.
- Switch to the artists view.
- Confirm `Agent Artist` and `Second Artist` are visible.
- Open or filter `Agent Artist` and confirm `Alpha Wave` and `Beta Wave` are visible.
- Click `Alpha Wave` and confirm playback controls enter a playing state.
- Click next and confirm the active track advances to `Beta Wave`.
- Change volume, reload the page, and confirm the chosen volume is preserved by Zustand localStorage persistence.
- Open the queue/history panel and confirm queue/history entries are populated after playback.

Useful browser state checks:

```js
localStorage.getItem('megawave-player');
```

The persisted value should contain a `volume` value between `0` and `1`.

## Optional Auth Tests

Use a separate database directory so auth tables and seeded users do not affect the unauthenticated smoke tests:

```sh
TEST_ROOT=/tmp/megawave-auth-test
rm -rf "$TEST_ROOT"
mkdir -p "$TEST_ROOT/music" "$TEST_ROOT/db"

ffmpeg -y -f lavfi -i sine=frequency=440:duration=2 \
  -metadata title="Auth Track" \
  -metadata artist="Auth Artist" \
  -metadata album="Auth Album" \
  "$TEST_ROOT/music/auth-track.mp3"

MEGAWAVE_AUTH=true \
MEGAWAVE_SECRET="12345678901234567890123456789012" \
MEGAWAVE_AUTH_SEED_EMAIL="admin@example.com" \
MEGAWAVE_AUTH_SEED_PASSWORD="password123" \
MEGAWAVE_AUTH_SIGNUP_WHITELIST=true \
MUSIC_LIBRARY_PATH="$TEST_ROOT/music" \
DATABASE_PATH="$TEST_ROOT/db" \
pnpm --filter api dev > "$TEST_ROOT/api.log" 2>&1 &
echo $! > "$TEST_ROOT/api.pid"

until curl -fsS http://localhost:5001/api/health >/dev/null; do sleep 1; done
```

Verify library routes are guarded:

```sh
curl -i -s http://localhost:5001/api/library/status
```

Expected result:

- status is `401 Unauthorized`

Sign in with the seeded admin and access a guarded route:

```sh
curl -fsS -c "$TEST_ROOT/cookies.txt" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password123"}' \
  http://localhost:5001/api/auth/sign-in/email >/dev/null

curl -fsS -b "$TEST_ROOT/cookies.txt" http://localhost:5001/api/library/status | jq '{scanActive, tracksErrored}'
```

Verify admin whitelist controls:

```sh
curl -fsS -b "$TEST_ROOT/cookies.txt" \
  -H 'Content-Type: application/json' \
  -d '{"email":"allowed@example.com"}' \
  http://localhost:5001/api/admin/signup-whitelist >/dev/null

curl -fsS -b "$TEST_ROOT/cookies.txt" http://localhost:5001/api/admin/signup-whitelist \
  | jq -e '.entries | any(.email == "allowed@example.com")' >/dev/null

curl -fsS -b "$TEST_ROOT/cookies.txt" \
  -X DELETE \
  http://localhost:5001/api/admin/signup-whitelist/allowed%40example.com >/dev/null
```

Verify auth reset clears auth data without deleting library data:

```sh
DATABASE_PATH="$TEST_ROOT/db" pnpm auth:reset -- --yes
curl -i -s http://localhost:5001/api/library/status
```

Expected result after restarting the API with the same auth env:

- seeded admin can be recreated from env vars
- library data remains in the same database
- existing sessions are gone

For UI auth tests with agent-browser:

- Open `http://localhost:5173/login` after starting the web server against the auth-enabled API.
- Sign in with `admin@example.com` and `password123`.
- Confirm `/` loads after sign-in.
- Confirm `/admin` loads for the seeded admin.
- Add and remove a signup whitelist email from `/admin`.
- Sign out and confirm guarded pages redirect to `/login`.

## Cleanup

Stop servers:

```sh
kill "$(cat /tmp/megawave-test/api.pid)" "$(cat /tmp/megawave-test/web.pid)"
```

Remove generated test data:

```sh
rm -rf /tmp/megawave-test
```

If only the API server needs to be stopped:

```sh
lsof -ti :5001 | while read -r pid; do
  [ -z "$pid" ] || kill "$pid"
done
```
