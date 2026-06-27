# ADR-0004: License — Apache-2.0

- Status: Accepted
- Date: 2026-06-27

## Context

The project must let anyone use, modify, and self-host it, while **always
requiring proper attribution** to the original project. It may become public, so
it needs open-source-grade licensing hygiene.

Options considered:

- **MIT** — simplest and most permissive; attribution is satisfied only by
  retaining the license notice (the weakest standard form); no patent grant.
- **Apache-2.0** — permissive, with a structured attribution mechanism (the
  `NOTICE` file), an explicit patent grant, and trademark protection.
- **AGPL-3.0** — copyleft; would force modified network services to publish
  their source. Strong protection, but deters some adopters/contributors, and
  attribution is not its primary purpose.

A visible runtime "Powered by" badge was also considered and rejected: enforcing
it requires non-standard "badgeware" terms that harm open-source friendliness.

## Decision

Adopt **Apache License 2.0**.

It best matches the requirement: permissive enough for anyone to use and
self-host, with a real, structured attribution requirement via the `NOTICE`
file (§4(d) of the license), plus patent and trademark protections that suit a
project that may become public.

The repository's initial MIT license is replaced by Apache-2.0, and a `NOTICE`
file is added carrying the project's attribution.

## Consequences

- Anyone may use, modify, and self-host the project; redistributions must retain
  the license, copyright, and `NOTICE` attribution.
- We gain an explicit patent grant and trademark protection.
- Contributions are, by default, licensed under Apache-2.0 (§5 of the license).
- If the project ever needs to prevent closed-source SaaS forks, AGPL-3.0 can be
  revisited in a future ADR — but that is a different goal from attribution.
