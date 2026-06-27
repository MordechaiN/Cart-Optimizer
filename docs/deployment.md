# Deployment

Cart Optimizer is **Docker first**. The primary `docker-compose.yml` lives at the
repository root and builds the image from `docker/Dockerfile` using the repo root
as the build context. The image is offline at runtime: once built, it needs no
internet access.

The recommended way to self-host is a **Portainer Stack deployed from Git**, so
updates never require SSH or manual Docker commands.

## Requirements

- Docker (with the Compose plugin) on the host. Portainer is recommended but
  optional.
- ~1 GB of disk for the image (OR-Tools is large) and a little RAM.

## Recommended: Portainer Stack (from Git)

### One-time setup

1. In Portainer: **Stacks → Add stack → Repository**.
2. **Repository URL:** your repo, e.g. `https://github.com/mordechain/cart-optimizer`.
3. **Repository reference:** `refs/heads/main`.
4. **Compose path:** `docker-compose.yml` (default; it is at the repo root).
5. *(Optional)* set `APP_PORT` under the stack's **Environment variables** to
   change the published host port (default `8000`).
6. **Deploy the stack.** Open `http://<server-ip>:8000`.

### Everyday update workflow

1. **Commit and push** to GitHub (`main`).
2. Portainer → **Stacks →** your stack → **Pull and redeploy**.

Portainer pulls the latest commit, rebuilds the image from `docker/Dockerfile`,
and recreates the container. No manual Docker commands are needed. You can also
enable Portainer **automatic updates** (polling or webhook) to skip the manual
redeploy click.

> The image is **not published to any registry**. The compose service has no
> `image:` tag and sets `pull_policy: build`, so Compose/Portainer always builds
> it locally and never tries (and fails) to pull it from a registry. If you tick
> Portainer's "Pull latest image versions" option, that's fine — there is
> nothing to pull, and the local build still runs.

## Alternative: plain Docker Compose

From the repository root on the host:

```bash
docker compose up --build -d        # build + start in the background
docker compose logs -f              # follow logs
docker compose down                 # stop
```

After pulling new code, re-run `docker compose up --build -d`.

## Changing the port

The container listens on `8000`. Publish it on a different host port with
`APP_PORT` (it maps `${APP_PORT}:8000`). In Portainer set it as a stack
environment variable; with the CLI:

```bash
APP_PORT=9000 docker compose up --build -d
# now reachable on http://<server-ip>:9000
```

## Health

The container has a built-in healthcheck hitting `/api/v1/health`. In Portainer
the container shows a health status; with the CLI:

```bash
docker inspect --format '{{.State.Health.Status}}' cart-optimizer
```

## Security posture

The app runs:

- as a **non-root** user (uid 10001),
- with a **read-only root filesystem** (plus a small in-memory `/tmp`),
- with `no-new-privileges`.

There is no authentication in v0, so expose it only on your trusted network (or
behind your own reverse proxy / VPN). See
[ADR-0005](architecture/adr/0005-v0-scope-and-data-model.md).

## What's inside the image

The image is self-contained: it bundles the optimization engine **and** the Web
UI (the static assets are installed into the package and verified at build
time). This is enforced by the packaging configuration in `pyproject.toml`
(`tool.setuptools.package-data`), which bundles everything under
`cart_optimizer/web/` — including any future CSS/JS/template subdirectories.

## Running without Docker

Not the supported path, but possible for development — see
[development.md](development.md).
