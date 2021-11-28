# ~~ MEGAWAVE ~~

## Development

Development is tested and supported on Linux, Mac OS, and WSL 2

The only barrier supporting native windows development is .env parsing and management.

Follow these steps to get a development environment setup (approximately 5-10 minutes).

- (optional) Copy default vscode workspace setup for proper autocomplete and linting in python and javascript

  - `cp .vscode.default .vscode`

  - Install recommended extensions when prompted by vscode

- Install api [requirements](./packages/api/README.md#requirements)

- Install frontend [requirements](./packages/web/README.md#requirements)

- `cp .env.example .env`

- Configure music library path in `.env`

- Run `start-dev.sh`

- (optional) Run each app separately

  - Run api [locally](./packages/api/README.md#setup)

    - The api server will automatically reload to reflect (most) code changes

    - Re-run command if dependencies change

  - Run frontend [locally](./packages/web/README.md#npm-start)

    - The dev server will automatically reload to reflect code changes

    - Re-run command if dependencies change

## Deployment

Megawave is still not completely production ready but it can run in a production-like environment pretty quickly with Docker.

- Install Docker

- `cp .env.example .env`

- Configure music library path in `.env`

- `docker-compose up`

- Go to [localhost](http://localhost)
