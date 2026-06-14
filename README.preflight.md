# Trae Preflight

This folder is prepared for `wangxt-1016-1`.

Use `.env` for stable local ports and compose project identity:

- APP_PORT: 18316
- API_PORT: 19316
- WEB_PORT: 20316
- DB_PORT: 21316
- REDIS_PORT: 22316

Smoke entry:

```bash
bash scripts/smoke.sh
```

The preflight files are environment scaffolding only. The generated business
project can replace or extend them when needed.
