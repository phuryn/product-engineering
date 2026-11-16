#!/usr/bin/env python3
"""Regression checks for the Windows review mode, without starting a reviewer.

Run with `python -B tools/test_review.py`.
"""

from __future__ import annotations

import argparse
import contextlib
import importlib.util
import io
import os
import sys
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "ai-shipping/skills/independent-review/scripts/review.py"
spec = importlib.util.spec_from_file_location("review", SCRIPT)
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class WindowsSandboxTests(unittest.TestCase):
    def setUp(self):
        # Supply config bytes without touching the user's files or starting a CLI.
        env = mock.patch.dict(os.environ, {"CODEX_HOME": str(ROOT / "review-test-config")})
        env.start()
        self.addCleanup(env.stop)
        config = mock.patch.object(review.Path, "read_text", side_effect=FileNotFoundError("test config"))
        self.read_config = config.start()
        self.addCleanup(config.stop)
        windows = mock.patch.object(review.platform, "system", return_value="Windows")
        windows.start()
        self.addCleanup(windows.stop)

    def set_config(self, contents):
        self.read_config.side_effect = FileNotFoundError("test config") if contents is None else None
        self.read_config.return_value = contents

    def command(self, override=None):
        return review.build_codex_command("codex", argparse.Namespace(
            windows_sandbox=override, model="test-model", effort="xhigh", cwd_resolved=ROOT))

    def test_default_uses_config_and_keeps_read_only(self):
        for mode in ("elevated", "unelevated"):
            with self.subTest(mode=mode):
                self.set_config(f'[windows]\nsandbox = "{mode}"\n')
                command = self.command()
                self.assertIn(f'windows.sandbox="{mode}"', command)
                self.assertEqual(command[command.index("-s") + 1], "read-only")

    def test_override_wins_over_config_in_both_directions(self):
        for configured, override in (("elevated", "unelevated"), ("unelevated", "elevated")):
            with self.subTest(override=override):
                self.set_config(f'[windows]\nsandbox = "{configured}"\n')
                command = self.command(override)
                self.assertIn(f'windows.sandbox="{override}"', command)
                self.assertNotIn(f'windows.sandbox="{configured}"', command)

    def test_override_does_not_need_readable_or_valid_config(self):
        for contents in (None, '[windows]\nsandbox = "unsupported"\n'):
            with self.subTest(contents=contents):
                self.set_config(contents)
                self.assertIn('windows.sandbox="unelevated"', self.command("unelevated"))
                self.read_config.assert_not_called()

    def test_missing_or_ambiguous_config_still_fails_without_override(self):
        for contents in (None, '[windows]\nsandbox = "unsupported"\n',
                         '[windows]\nsandbox = "elevated"\nsandbox = "unelevated"\n'):
            with self.subTest(contents=contents):
                self.set_config(contents)
                with self.assertRaises(SystemExit):
                    self.command()

    def test_invalid_flag_fails_before_looking_for_a_reviewer(self):
        with mock.patch.object(sys, "argv", [str(SCRIPT), "--check", "--windows-sandbox", "unsafe"]), \
                mock.patch.object(review, "pick_reviewer") as pick, \
                contextlib.redirect_stderr(io.StringIO()) as errors:
            with self.assertRaises(SystemExit) as failure:
                review.main()
            self.assertEqual(failure.exception.code, 2)
            self.assertIn("invalid choice", errors.getvalue())
            pick.assert_not_called()

    def test_check_prints_the_selected_mode_and_its_source(self):
        self.set_config('[windows]\nsandbox = "elevated"\n')
        flags = {"--json", "--disable", "--ephemeral", "--ignore-user-config", "--ignore-rules",
                 "--sandbox", "--model", "--config", "--cd"}
        for extra, mode, source in (([], "elevated", "restored from user config"),
                                    (["--windows-sandbox", "unelevated"], "unelevated", "from --windows-sandbox")):
            with self.subTest(extra=extra), \
                    mock.patch.object(sys, "argv", [str(SCRIPT), "--check", *extra]), \
                    mock.patch.object(review, "pick_reviewer", return_value=("codex", "codex")), \
                    mock.patch.object(review, "supported_flags", return_value=flags), \
                    mock.patch.object(review, "warn_codex_administrator_files"), \
                    mock.patch.object(review, "missing_codex_features", return_value=[]), \
                    contextlib.redirect_stdout(io.StringIO()) as output:
                review.main()
                self.assertIn(f"Windows sandbox mode {source}: {mode}", output.getvalue())
                self.assertIn(f'windows.sandbox=', output.getvalue())

    def test_non_windows_command_does_not_read_windows_config(self):
        with mock.patch.object(review.platform, "system", return_value="Linux"), \
                mock.patch.object(review, "windows_sandbox_mode") as mode:
            command = self.command("unelevated")
            mode.assert_not_called()
            self.assertFalse(any("windows.sandbox" in arg for arg in command))


if __name__ == "__main__":
    unittest.main()
