## Initial Build

cgywin, cd into directory
./build.sh

## Rebundle after making changes

cgywin, cd into directory
./node_modules/rollup/bin/rollup -c

## Configuration

Need to point application at the Spark data source by changing baseURL in app.js to the appropriate
value.