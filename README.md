# ~~ MEGAWAVE ~~

## Development

- Install api [requirements](./packages/api/README.md#requirements)

- Install frontend [requirements](./packages/web/README.md#requirements)

- `cp .env.example .env`

- Configure music library path in `.env`

- Run `start-dev.sh`

- (optional) Run each app separately

  - Run api [locally](./packages/api/README.md#setup)

    - Redo this whenever you make changes

  - Run frontend [locally](./packages/web/README.md#npm-start)

    - The dev server will automatically reload to reflect code changes

    - Re-run command if dependencies change

## Deployment

- Install Docker

- `cp .env.example .env`

- Configure music library path in `.env`

- `docker-compose up`

- Go to [localhost](http://localhost)
