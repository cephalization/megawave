#!/bin/sh

pnpm run db:migrate
node dist/index.js