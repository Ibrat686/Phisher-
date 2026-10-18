#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
git pull --ff-only 2>/dev/null || true
docker compose up -d --build
docker compose ps
