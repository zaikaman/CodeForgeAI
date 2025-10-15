"""
Background mode fix for /background command
This module provides a simple, testable approach to toggle between
'REAL-TIME' and 'BACKGROUND' modes for users of the Telegram bot.

Assumptions:
- User states are persisted in a JSON file (default: user_prefs.json)
- The bot calls update_user_mode(user_id, mode) whenever /background is toggled
- A toggle from 'REAL-TIME' to 'BACKGROUND' will set the mode accordingly and
  ensure any real-time processing is paused when background mode is active.

Note: This is a minimal, self-contained implementation to aid the PR workflow.
Adapt the storage mechanism to your existing bot's persistence layer.
"""
import json
import os
from typing import Dict

class BackgroundManager:
    DEFAULT_MODE = "background"  # default to background for safety

    def __init__(self, storage_path: str = "user_prefs.json"):
        self.storage_path = storage_path
        self._prefs: Dict[str, str] = {}
        self._load()

    def _load(self):
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        self._prefs = data
                    else:
                        self._prefs = {}
            except Exception:
                self._prefs = {}
        else:
            self._prefs = {}
            self._persist()

    def _persist(self):
        with open(self.storage_path, "w", encoding="utf-8") as f:
            json.dump(self._prefs, f, indent=2)

    def set_mode(self, user_id: str, mode: str) -> None:
        mode = mode.strip().lower()
        if mode not in ("real-time", "background"):
            raise ValueError("Invalid mode. Use 'real-time' or 'background'.")
        self._prefs[str(user_id)] = mode
        self._persist()

    def get_mode(self, user_id: str) -> str:
        return self._prefs.get(str(user_id), self.DEFAULT_MODE)

    def toggle(self, user_id: str) -> str:
        current = self.get_mode(user_id)
        new_mode = "real-time" if current == "background" else "background"
        self.set_mode(user_id, new_mode)
        return new_mode

# Example usage (not executed by bot, just for demonstration)
if __name__ == "__main__":
    bm = BackgroundManager()
    uid = "12345"
    print(f"Current mode for {uid}: {bm.get_mode(uid)}")
    print(f"Toggling -> new mode: {bm.toggle(uid)}")
