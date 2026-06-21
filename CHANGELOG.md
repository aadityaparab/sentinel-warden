# Changelog

All notable changes are documented here. Format based on Keep a Changelog; versioning follows SemVer.

## [0.1.0] - 2026-06-21

### Added
- Initial public release.
- Static scanner for AI agent artifacts: Claude skills (`SKILL.md`), MCP server configs, Cursor/Copilot rules, and agent instruction files.
- 12 detection rules across prompt injection, data exfiltration, tool poisoning, obfuscation, destructive actions, rug-pulls, and exposed secrets.
- Reporters: human-readable, JSON, SARIF 2.1.0, agent Bill of Materials, and compliance evidence (SOC 2 / ISO 27001 / NIST / EU AI Act).
- Integrity baseline commands: `warden approve` and `warden verify`.
- GitHub Action for CI with SARIF upload to code scanning.
- Zero runtime dependencies; ships as ESM with type declarations.
