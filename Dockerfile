FROM oven/bun:1

RUN apt-get update && apt-get install -y \
    openjdk-17-jre-headless \
    python3 \
    python3-pip \
    build-essential \
    node-gyp \
    libsqlite3-dev \
    npm \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN rm -rf node_modules && bun install --no-cache

RUN bun run tools/cache/pack.ts

EXPOSE 8888
EXPOSE 43594
EXPOSE 43500
EXPOSE 43501
EXPOSE 45099

CMD ["bun", "src/app.ts"]
