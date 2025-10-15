# GitHub Agent Memory Storage

This directory stores persistent memory for the GitHub Agent.

## Structure

`
memory/
   owner1/
      repo1_GITHUB_AGENT_MEMORY.md
      repo2_GITHUB_AGENT_MEMORY.md
   owner2/
       repo3_GITHUB_AGENT_MEMORY.md
`

## Memory Sections

Each memory file contains:

1. **Project Context** - Repository structure, architecture, key files
2. **Investigation Notes** - Findings, patterns, root causes
3. **Decisions Made** - Approaches chosen, alternatives considered
4. **Things to Remember** - User preferences, special requirements
5. **Codebase Insights** - Complex logic explained, gotchas discovered

## Usage

Memories are automatically saved/loaded by the GitHub Agent using:
- ot_github_save_memory() - Save context
- ot_github_load_memory() - Load context
- ot_github_clear_memory() - Clear context

## Benefits

-  Context persists across sessions
-  Avoid re-analyzing same code
-  Remember user preferences
-  Build knowledge over time
