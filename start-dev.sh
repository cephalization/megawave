#!/bin/bash

npx concurrently "cd packages/api; poetry run flask run" "cd packages/web; npm start"
