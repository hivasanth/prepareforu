# DESIGN SYSTEM WORKFLOW (IMPLEMENTATION PLAYBOOK)

# Document Authority

**Authority:** Canonical implementation workflow.
**Purpose:** Defines how work is performed — classification, ownership, implementation,
migration, verification, cleanup, and reporting. Contributors follow this document
during implementation.

---

**Classification:** Daily implementation handbook. Documentation only.
**Companion to:** `FOUNDATION_GOVERNANCE.md` (permanent rules) and
`FOUNDATION_FREEZE_REGISTER.md` (implementation history).

**Start here:** Read `PROJECT_ARCHITECTURE.md` before beginning any implementation.

---

## 1. Purpose

This document is the **practical implementation handbook** for the Design System. It
explains HOW to work within the existing governance for any task — human or AI.

It complements `FOUNDATION_GOVERNANCE.md`. It does **NOT** replace Governance.
Governance defines the rules; this playbook explains how to apply them.

Read this before every Design System task to eliminate ambiguity during
implementation.

---

## 2. Before Writing Code

Mandatory checklist — complete ALL before implementation:

- [ ] Read `FOUNDATION_GOVERNANCE.md`
- [ ] Read `FOUNDATION_FREEZE_REGISTER.md`
- [ ] Identify the rendered component (not the file you assume)
- [ ] Identify the owner of the visual property in question
- [ ] Determine the hierarchy level (L1 Primitive / L2 Composite / L3 Application / L4 Feature)
- [ ] Verify runtime (see the actual rendered UI, do not infer from source)

Only after completing these steps may implementation begin.

---

## 3. Classify The Work

Every task must first be classified into exactly one bucket:

- **Foundation Primitive** — Foundation owns the visual language (Card, Button, etc.)
- **Foundation Composite** — reusable Foundation pattern (PremiumIconContainer, etc.)
- **Application Component** — composes L1/L2 (ExamCard, TopicCard, etc.)
- **Feature Component** — page/feature (Dashboard, Exams, Performance, etc.)
- **Consumer Fix** — one consumer renders wrong; fix the consumer.
- **Foundation Bug** — multiple Foundation consumers render wrong; fix Foundation.
- **Foundation Evolution** — ≥3 consumers need a new capability; extend additively.
- **Feature Request** — a page wants unique treatment; build a Feature Component.

Never skip classification.

---

## 4. Ownership Checklist

For every visual issue, determine who owns each property. ONLY the owner may be
modified:

- background
- border
- shadow
- radius
- hover
- animation
- transition
- motion
- typography
- spacing
- theme

If a property is owned by Foundation, the consumer must not touch it. Multiple owners
= architectural defect (see Governance Rule 2).

---

## 5. Implementation Workflow

Every task follows this order — no shortcuts:

1. **Understand problem** — reproduce it in the running app.
2. **Locate runtime component** — the actually-rendered element.
3. **Determine owner** — Foundation or Consumer (Governance Rule 2/3).
4. **Compare with approved implementation** — the frozen reference in the register.
5. **Implement** — modify ONLY the owner.
6. **Remove duplicate code** — dead/duplicate CSS, utilities, wrappers.
7. **Runtime verification** — confirm in the rendered UI.
8. **Documentation** — update `FOUNDATION_FREEZE_REGISTER.md`.
9. **Freeze (if applicable)** — only when the Freeze Gate conditions are met.

---

## 6. Migration Workflow

Whenever duplicate UI is found:

1. **Locate owner** — which layer should own it.
2. **Determine hierarchy level** — L1 / L2 / L3.
3. **Reuse Foundation** — adopt the existing primitive/composite.
4. **Delete duplicate implementation** — remove the duplicate component.
5. **Delete duplicate styling** — remove the local visual rules.
6. **Delete dead code** — obsolete wrappers, helpers, tokens.
7. **Verify runtime** — confirm parity in the rendered app.

Never leave compatibility code behind (Governance Rule 8).

---

## 7. Debug Workflow

When something looks wrong — never guess, never recreate, never approximate:

1. **Verify runtime** — observe the actual rendered component.
2. **Find rendered component** — trace to the DOM element.
3. **Find owner** — which layer owns the property.
4. **Determine Consumer vs Foundation** — who owns the defect.
5. **Fix owner** — modify only that owner.

---

## 8. Verification Checklist

Every implementation must verify ALL of the following. Build success alone is NOT
acceptance:

- [ ] Light Mode
- [ ] Dark Mode
- [ ] Hover
- [ ] Animation
- [ ] Motion
- [ ] Shadow
- [ ] Border
- [ ] Elevation
- [ ] Responsive
- [ ] Accessibility
- [ ] Runtime

---

## 9. Cleanup Checklist

Whenever code is touched, remove:

- [ ] dead code
- [ ] dead CSS
- [ ] duplicate CSS
- [ ] duplicate utilities
- [ ] duplicate wrappers
- [ ] unused imports
- [ ] obsolete helpers
- [ ] obsolete variants
- [ ] obsolete tokens
- [ ] unreachable branches

Never postpone cleanup (Governance Rule 6).

---

## 10. Implementation Report Template

Every completed phase must report:

- **Objective**
- **Root Cause**
- **Ownership**
- **Files Modified**
- **Files Removed**
- **Dead Code Removed**
- **Duplicate Styling Removed**
- **Consumer Impact**
- **Backward Compatibility**
- **Runtime Verification**
- **Build Result**
- **TypeScript Result**
- **Freeze Decision**

---

## 11. Decision Matrix

| Situation | Action |
|---|---|
| One consumer broken | Fix Consumer |
| Multiple consumers broken | Fix Foundation |
| Three or more consumers need a capability | Foundation Evolution |
| One page wants a unique design | Feature Component (never modify Foundation) |

---

## 12. Reference Documents

- **`FOUNDATION_GOVERNANCE.md`** — Permanent architectural rules. Rarely changes.
- **`FOUNDATION_FREEZE_REGISTER.md`** — Implementation history. Continuously updated.
- **`DESIGN_SYSTEM_WORKFLOW.md`** — Daily implementation handbook (this document).

Each document has ONE responsibility. No duplicated content. No conflicting rules.
Clear separation of concerns.
