# FOUNDATION_EXCEPTION_REGISTRY — Phase 6.XB (Task 33)

- **Phase:** 6.XB
- **Status:** IMPLEMENTED
- **Key property:** a formal, frozen registry of **justified exceptions** to Foundation rules. Every
  exception is named, scoped, reason-linked, and re-audited on each phase — nothing "sneaks past"
  the Foundation by being unrecorded.

---

## 1. How an exception is granted

1. Must be a **page-specific** need that cannot be solved once in the Foundation without harming a
   certified contract (DS-016…DS-020).
2. Must be added to this registry with scope + rationale.
3. Must reference a decision row (`D-nnn`).
4. Must be reviewed every phase; expired when the Foundation can absorb it.

## 2. Active exceptions

| ID | Scope | Rule being waived | Rationale | Decision | Status |
|---|---|---|---|---|---|
| — | (none yet registered) | — | — | — | — |

As of 6.XB certification there are **no active exceptions**. All prior "one-off" findings were
either resolved in Foundation or are inventoried as **design debt** (T34) rather than exceptions,
so the debt list stays honest and migrates later.

## 3. Guidance

- Warnings produced by `foundation-audit.mjs` (px spacing, arbitrary values in consumers) are
  **not** exceptions — they are **debt** until the certified migration removes them.
- Only a decision-logged, this-registry row converts a finding into a legitimate exception.

## 4. Relation

- `FOUNDATION_DESIGN_DEBT.md` (T34) — the pending debts that are *not* exceptions.
- `FOUNDATION_VISUAL_CERTIFICATION.md` (6.XB) — certifies this registry has no active entries.