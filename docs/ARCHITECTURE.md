# Architecture

Fix Happens is organized around a shared diagnostic core that powers both desktop and mobile clients.

## Core layers
- Workflow engine
- Evidence engine
- Hypothesis engine
- Verification engine
- Knowledge pack loader
- SQLite persistence

## Clients
- macOS: Electron desktop app
- Android: Flutter field companion

## Data model
- Assets
- Cases
- Evidence
- Hypotheses
- Commands
- Repairs
- Knowledge articles
