#!/bin/bash

npx concurrently -p "[{name}]" -n "API,WEB" -c "bgGreen.bold,bgBlue.bold" "cd packages/api; ./start.sh" "cd packages/web; npm run dev"