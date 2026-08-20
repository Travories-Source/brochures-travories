# Travories Brochure Service

Server-side PDF generation for package brochures. It is the single source of
truth for brochure layout and must be deployed privately or behind an internal
gateway.

## API

`POST /v1/package-brochures` accepts `{ package, party?, packageUrl? }` and
returns `application/pdf`. Callers must send the internal
`x-brochure-service-token` header. Never expose this token to a browser; the
frontend and admin applications should call it through authenticated server
routes.

## Environment

`BROCHURE_SERVICE_TOKEN` is required. `PORT` defaults to `3001`.

# brochures-travories

