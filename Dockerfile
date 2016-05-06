FROM risingstack/alpine:3.3-v4.2.6-1.1.3

# Bash useful for debugging but app still works without it
RUN apk add --update bash

EXPOSE 8080

COPY bower_components /app/bower_components
COPY index.html /app/
COPY dist /app/dist

WORKDIR /app
RUN /usr/bin/npm install http-server

ENTRYPOINT ["./node_modules/http-server/bin/http-server", "."]
