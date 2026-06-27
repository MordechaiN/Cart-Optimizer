# Deployment

Cart Optimizer is **Docker first**. The supported way to run it is a single
container, ideal for a self-hosted home server. It is offline at runtime: once
the image is built, it needs no internet access.

## Requirements

- Docker (with the Compose plugin) on the host.
- ~1 GB of disk for the image (OR-Tools is large) and a little RAM.

## Build and run (Docker Compose)

From the repository root on your server:

```bash
docker compose -f docker/docker-compose.yml up --build -d
```

Then open `http://<server-ip>:8000`.

- `-d` runs it in the background.
- Logs: `docker compose -f docker/docker-compose.yml logs -f`
- Stop: `docker compose -f docker/docker-compose.yml down`
- Update after pulling new code: re-run the `up --build -d` command.

## Changing the port

The container listens on `8000`. To expose it on a different host port, set
`APP_PORT` (it maps `${APP_PORT}:8000`):

```bash
APP_PORT=9000 docker compose -f docker/docker-compose.yml up --build -d
# now reachable on http://<server-ip>:9000
```

## Health

The container has a built-in healthcheck hitting `/api/v1/health`. Check it with:

```bash
docker inspect --format '{{.State.Health.Status}}' cart-optimizer
```

## Security posture

The Compose file runs the app:

- as a **non-root** user (uid 10001),
- with a **read-only root filesystem** (plus a small in-memory `/tmp`),
- with `no-new-privileges`.

There is no authentication in v0, so expose it only on your trusted network (or
behind your own reverse proxy / VPN). See
[ADR-0005](architecture/adr/0005-v0-scope-and-data-model.md).

## Running without Docker

Not the supported path, but possible for development — see
[development.md](development.md).
