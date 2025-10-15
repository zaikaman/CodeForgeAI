"""
Background fix for /background command

What this PR changes:
- Introduces a minimal BackgroundManager to store and toggle modes per user
- Ensures toggling from BACKGROUND to REAL-TIME and vice versa updates state
- Provides a simple script to demonstrate usage

How to integrate:
- Wire BackgroundManager into your telegram bot handlers
- Use BackgroundManager.set_mode or .toggle to manage user modes
- Replace the simple JSON storage with your existing persistence layer
"""
