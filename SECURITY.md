# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | Yes       |

Only the latest minor release receives security patches.

## Reporting a vulnerability

**Do not open a public Issue.** Use [GitHub Security Advisories](https://github.com/your-username/idle_vibes/security/advisories/new) to report vulnerabilities privately.

Include:

- Description of the vulnerability
- Steps to reproduce
- Impact assessment (what an attacker could do)
- Suggested fix, if you have one

## Response timeline

- **Acknowledgement:** within 48 hours
- **Triage and severity assessment:** within 5 days
- **Critical patch:** within 14 days of confirmation
- **Non-critical patch:** included in the next scheduled release

## Scope

The following are considered security issues:

- Data exfiltration (the extension reading or transmitting file contents, code, or file paths)
- Secret leakage (API keys, tokens, or credentials exposed in logs, state, or network requests)
- Unauthorized network calls (any network activity not explicitly initiated by the user via cloud sync)
- API authorization bypass (accessing other users' data)
- Dependency vulnerabilities rated High or Critical by npm audit
- Extension permission escalation beyond declared activationEvents and contributes

The following are **not** in scope:

- Denial-of-service against the local VS Code instance (e.g., high CPU from game rendering) — these are bugs, not security issues. File a regular Issue.
- Vulnerabilities in VS Code itself — report those to Microsoft
- Social engineering attacks

## Security design

For details on how secrets, environment variables, and API security are handled,
see the [Game Design Document](idle_vibes_gdd.md), sections 20.2-20.6.
