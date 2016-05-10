FROM risingstack/alpine:3.3-v4.2.6-1.1.3

# Bash useful for debugging but app still works without it
RUN apk add --update bash

EXPOSE 8080

COPY package.json /app/
COPY bower.json /app/
COPY rollup.config.js /app/
COPY src/ /app/src/
COPY index.html /app/

WORKDIR /app
RUN npm set progress=false; npm install; npm run build
RUN npm install http-server
RUN rm -rf src/

ENTRYPOINT ["./node_modules/http-server/bin/http-server", "."]
