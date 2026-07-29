# Plugin Architecture

## Goals
- Extend Fix Happens without modifying the core.
- Support offline-first operation.
- Allow community and vendor knowledge packs.

## Plugin Types
- Diagnostic providers
- Knowledge packs
- Command libraries
- Verification modules
- Report exporters

## Plugin Manifest
- id
- name
- version
- author
- supportedPlatforms
- permissions
- entryPoint

## Lifecycle
1. Discover
2. Validate
3. Load
4. Execute
5. Unload
