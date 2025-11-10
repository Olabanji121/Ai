# AI Agent Instructions

This project uses **OpenSpec** for specification-driven development combined with **Test-Driven Development (TDD)**.

## OpenSpec Workflow

### Before Starting Any Feature

1. **Create a Change Proposal**
   - Navigate to `openspec/changes/`
   - Create a new folder: `openspec/changes/[feature-name]/`
   - Write `proposal.md` explaining why and what
   - Define specs in `openspec/changes/[feature-name]/specs/`
   - Create `tasks.md` with implementation checklist

2. **Review and Refine**
   - Ensure proposal aligns with `openspec/project.md` conventions
   - Get stakeholder agreement on specifications
   - Clarify any ambiguities before coding

3. **Implement with TDD**
   - Write failing tests first
   - Implement minimal code to pass tests
   - Refactor while keeping tests green
   - Follow task checklist in `tasks.md`

4. **Archive Completed Changes**
   - Run `openspec archive [change-name]`
   - This merges specs into `openspec/specs/`

## TDD Cycle

Every feature implementation must follow:

```
RED → GREEN → REFACTOR
```

1. **RED**: Write a failing test
   - Create test file in `tests/`
   - Run `npm test` to verify it fails
   - Test should define expected behavior

2. **GREEN**: Make test pass
   - Write minimal implementation
   - Run `npm test` until it passes
   - Don't optimize yet

3. **REFACTOR**: Improve code
   - Clean up implementation
   - Remove duplication
   - Improve readability
   - Tests must still pass

## Available Commands

### OpenSpec
- `openspec init` - Initialize OpenSpec (already done)
- `openspec archive [change-name]` - Archive completed change
- View specs: Check `openspec/specs/` and `openspec/changes/`

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - TDD watch mode
- `npm run test:coverage` - Coverage report

### Development
- `npm run dev` - Start server with auto-reload
- `npm start` - Start production server

## Project Structure

```
openspec/
├── specs/          # Current specifications (source of truth)
├── changes/        # Active proposals and implementations
├── archive/        # Completed changes
└── project.md      # Project conventions

src/               # Application code
tests/             # Test files
```

## Important Rules

1. **No Code Without Tests**: Always write tests first
2. **No Code Without Specs**: Create OpenSpec proposal before implementing
3. **Keep Specs Updated**: Specifications are the source of truth
4. **Run Tests Often**: Tests should pass before commits
5. **Follow Conventions**: Check `openspec/project.md` for standards

## Example Workflow

```bash
# 1. Create new feature proposal
mkdir -p openspec/changes/add-user-auth
# Write proposal.md, specs/, and tasks.md

# 2. Start TDD cycle
npm run test:watch

# 3. Write failing test
# Create tests/auth.test.js

# 4. Implement feature
# Create src/auth.js

# 5. Refactor and ensure tests pass
npm test

# 6. Commit changes
git add .
git commit -m "Add user authentication (openspec: add-user-auth)"

# 7. Archive completed change
openspec archive add-user-auth
```

## Integration with AI Assistants

This file is automatically read by AI coding assistants like:
- Claude Code
- Cursor
- GitHub Copilot
- Cline

When working with AI assistants, they will follow this workflow automatically.
