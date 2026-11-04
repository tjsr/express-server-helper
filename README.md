# express-server-helper

Middleware wrapper for common express microservice usage.

## Requirements

The runtime dependency `@tjsr/simple-env-utils` requires Node.js 24.21.0 or newer and npm 12.1.0 or newer. The build workflow verifies Node.js 24 with npm 12.2.1. Node.js 22 is outside that dependency's declared support range.

## Repo configuration

The build workflow selects its Node.js and npm versions directly. The dependency-update and release workflows use repository variables. Configure them to match the build toolchain:

```bash
  gh auth login
  gh variable set NODE_VERSION -b "24"
  gh variable set NPM_VERSION -b "12.2.1"
```
