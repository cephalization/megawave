#!/bin/bash

npx concurrently -p "[{name}]" -n "API,WEB" -c "bgGreen.bold,bgBlue.bold" "cd packages/api; poetry run flask run" "cd packages/web; npm start"