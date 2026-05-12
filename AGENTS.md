# aero-stream-example Agent Bootstrap

Use the shared AeroStream context before operating in this repository.

## Mandatory First Steps

1. Read `../AGENTS.md`.
2. Read `../aero-stream-context/AGENTS.md`.
3. Read `../aero-stream-context/.agents/context-index.yaml`.
4. Select the smallest matching route from the context index.
5. Read `../aero-stream-context/.agents/role-evaluation.md` and invoke the matching role skill.
6. Read the active requirement, contracts, task, allowed files, and policies before editing.

## Role Gate

Do not assume this repository needs implementation work. First decide whether the request belongs to:

- PM / PO Agent: create or update the requirement process in `../aero-stream-context/.specs/`.
- Lead Agent: review planning or task PRs.
- Service Developer Agent: implement one approved task on a task subbranch.
- QA / Integrity Agent: validate requirement-branch behavior or regression coverage.
- Human Reviewer: approve protected merges or external setup.

## Process Creation Gate

If there is no approved requirement and task for the requested change, do not edit code. Route to the PM / PO Agent so a Requirement Context PR and Technical Planning PR can be created in `../aero-stream-context`.

## Branch Rules

- Requirement branch: `<change-type>/<RequirementId>/req`.
- Task branch: `<change-type>/<RequirementId>/T-001-<task-slug>`.
- QA defect branch: `<change-type>/<RequirementId>/fix-001-<fix-slug>`.

Use `feature` for new or improvement work and `fix` when the requirement itself is corrective.

## Stop Conditions

Return `BLOCKED` if the selected route, role, approved task, contract, allowed files, requirement branch, or required quality checks are missing.
