# Self-hosted TermLoop server. Runs the published `termloop` npm package directly
# instead of building this monorepo from source — the image build needs nothing but
# npm/npx, and always runs the exact same thing `npx termloop` runs anywhere else.
FROM node:24-alpine

# Run as a non-root user — ~/.termloop holds real secrets (SSH keys/passwords in its
# sqlite store), so it shouldn't end up owned by root inside the container.
RUN addgroup -S termloop \
  && adduser -S termloop -G termloop -h /home/termloop \
  && mkdir -p /home/termloop/.termloop \
  && chown -R termloop:termloop /home/termloop

COPY --chown=termloop:termloop docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER termloop
WORKDIR /home/termloop

# Pre-fetch the package into npx's cache at build time, so a fresh container can still
# start (from cache) even if the registry is briefly unreachable. ssh2's cpu-features/nan
# native addons are optional — without a C toolchain here, npm just skips them and ssh2
# falls back to its pure-JS implementation.
RUN npx --yes termloop --version

# The port TermLoop actually listens on is controlled by the PORT env var at runtime
# (see docker-entrypoint.sh), defaulting to 3721 — this just documents that default.
EXPOSE 3721

# Connections, SSH keys, and the sqlite store all live here — mount a volume so they
# survive container restarts/upgrades instead of being lost with the container.
VOLUME /home/termloop/.termloop

ENTRYPOINT ["docker-entrypoint.sh"]
