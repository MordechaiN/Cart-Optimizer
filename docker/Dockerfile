# syntax=docker/dockerfile:1

# ---- Build stage: install the package into an isolated virtualenv ----
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy only what is needed to build the package, then install it. ortools and
# the other wheels are fetched here so the runtime stage needs no build tools.
COPY pyproject.toml README.md ./
COPY src ./src
RUN pip install --upgrade pip && pip install .

# ---- Runtime stage: minimal, non-root, self-contained (offline) ----
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH" \
    APP_HOST=0.0.0.0 \
    APP_PORT=8000

# Run as an unprivileged user.
RUN useradd --create-home --uid 10001 appuser
COPY --from=builder /opt/venv /opt/venv

USER appuser
WORKDIR /home/appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request,sys; \
url='http://127.0.0.1:%s/api/v1/health' % os.environ.get('APP_PORT','8000'); \
sys.exit(0 if urllib.request.urlopen(url, timeout=3).status==200 else 1)"

# Use a shell so APP_HOST/APP_PORT env vars are expanded.
CMD ["sh", "-c", "uvicorn cart_optimizer.api:app --host ${APP_HOST} --port ${APP_PORT}"]
