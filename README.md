# ~~ MEGAWAVE ~~

![Home screen image as of 3/16/2022](/images/home.png)

## Development

Development is tested and supported on Linux, Mac OS, and WSL 2

- (optional) Copy default vscode workspace setup for proper autocomplete and linting in Typescript, particularly for tailwindcss

  - `cp .vscode.default .vscode`

  - Install recommended extensions when prompted by vscode

- `cp .env.example .env`

- Configure music library path in `.env`

- Install dependencies from the root directory

  - `pnpm install`

- Run the development server and frontend

  - `pnpm dev`

- (optional) Run each app separately

  - `pnpm dev --filter=api`
  - `pnpm dev --filter=web`

## Deployment

- Install Docker

- `cp .env.example .env`

- Configure music library path in `.env`

- `docker-compose up --build`

- Go to [localhost](http://localhost:3294) or serve behind a reverse proxy
  - You can remember the port by the word "mega" - 3294
