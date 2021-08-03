#!/bin/bash

npx concurrently -p "[{name}]" -n "API,WEB" -c "bgGreen.bold,bgBlue.bold" "cd packages/api; poetry run python main.py" "cd packages/web; npm start"