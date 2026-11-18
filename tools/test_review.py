#!/usr/bin/env python3
"""Regression checks for reviewer selection and Windows mode, without starting a reviewer.

Run with `python -B tools/test_review.py`.
"""

from __future__ import annotations

import argparse
import contextlib
import importlib.util
import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "ai-shipping/skills/independent-review/scripts/review.py"
spec = importlib.util.spec_from_file_location("review", SCRIPT)
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


class ReviewerSelectionTests(unittest.TestCase):
    def test_auto_picks_the_first_installed_reviewer(self):
        for codex, claude, grok, expected in (
            ("codex-bin", "claude-bin", "grok-bin", ("codex", "codex-bin")),
            (None, "claude-bin", "grok-bin", ("claude", "claude-bin")),
            (None, None, "grok-bin", ("grok", "grok-bin")),
        ):
            with self.subTest(expected=expected), \
                    mock.patch.object(review, "find_codex_bin", return_value=codex), \
                    mock.patch.object(review, "find_claude_bin", return_value=claude), \
                    mock.patch.object(review, "find_grok_bin", return_value=grok):
                self.assertEqual(review.pick_reviewer("auto"), expected)

    def test_claude_out_of_usage_suggests_codex_before_grok(self):
        with mock.patch.object(sys, "argv", [str(SCRIPT), "--reviewer", "claude"]), \
                mock.patch.object(review, "find_codex_bin", return_value="codex-bin"), \
                mock.patch.object(review, "find_grok_bin", return_value="grok-bin"), \
                contextlib.redirect_stderr(io.StringIO()) as errors:
            with self.assertRaises(SystemExit) as failure:
                review.out_of_usage("claude", "usage balance exhausted")
            self.assertEqual(failure.exception.code, 3)
            self.assertIn("next installed reviewer, codex", errors.getvalue())
            self.assertIn("--reviewer codex", errors.getvalue())


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


class GitRepo(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.cwd = Path(temp.name).resolve()
        self.git("init", "-q")
        self.commit("baseline")

    def git(self, *args):
        return subprocess.run(["git", "-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                               "-c", "commit.gpgsign=false", *args], cwd=self.cwd, check=True,
                              capture_output=True, text=True, encoding="utf-8").stdout

    def write(self, name, content):
        path = self.cwd / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content + "\n", encoding="utf-8")

    def commit(self, message):
        self.git("add", ".")
        self.git("commit", "-q", "--allow-empty", "-m", message)

    def subject(self, rng, **options):
        path, _ = review.write_subject(self.cwd, rng, **options)
        return path, path.read_text(encoding="utf-8")


class SubjectTests(GitRepo):
    def test_net_keeps_the_commit_list_and_drops_intermediate_patches(self):
        self.write("src/main.txt", "intermediate")
        self.commit("first change")
        self.write("src/main.txt", "final")
        self.commit("second change")
        _, body = self.subject("HEAD~2..HEAD", net=True)
        self.assertIn("first change", body)
        self.assertIn("second change", body)
        self.assertIn("+final", body)
        self.assertNotIn("intermediate", body)
        _, ordinary = self.subject("HEAD~2..HEAD")
        self.assertIn("+intermediate", ordinary)

    def test_net_refuses_a_bare_ref(self):
        with self.assertRaises(SystemExit):
            self.subject("HEAD", net=True)

    def test_exclude_leaves_paths_out_of_commits_and_the_working_tree(self):
        self.write("src/main.txt", "kept")
        self.write("notes/round.md", "committed note")
        self.commit("change")
        self.write("notes/draft.md", "untracked note")
        self.write("src/main.txt", "kept, edited")
        for net in (False, True):
            _, body = self.subject("HEAD~1..HEAD", net=net, exclude=("notes/**",))
            self.assertIn("+kept", body)
            self.assertNotIn("committed note", body)
            self.assertNotIn("untracked note", body)
            self.assertIn("Left out by --exclude: notes/**", body)


class ShortReportTests(GitRepo):
    def round(self, report, *commands):
        events = [{"type": "item.completed", "item": {"type": "command_execution", "command": c,
                                                      "status": "completed", "exit_code": 0}}
                  for c in commands]
        events.append({"type": "item.completed", "item": {"type": "agent_message", "text": report}})
        events.append({"type": "turn.completed"})
        return review.CodexEvents("\n".join(json.dumps(e) for e in events))

    def setUp(self):
        super().setUp()
        self.write("src/app.py", "print(1)")
        self.commit("change")
        self.path, _ = self.subject("HEAD~1..HEAD")

    def test_a_hung_round_fails(self):
        events = review.CodexEvents(json.dumps({"type": "item.completed",
                                                "item": {"type": "agent_message", "text": "x" * 123}}))
        self.assertEqual(review.subject_read(events, self.path), "")

    def test_a_named_read_of_the_subject_or_a_changed_file_passes(self):
        events = self.round(f"Read {self.path.name}; no findings.", f"cat {self.path}")
        self.assertEqual(review.subject_read(events, self.path), self.path.name)
        events = self.round("Read src/app.py; no findings.", "sed -n 1,40p src/app.py")
        self.assertEqual(review.subject_read(events, self.path), "src/app.py")

    def test_an_unnamed_read_or_a_read_of_another_file_fails(self):
        self.assertEqual(review.subject_read(self.round("No findings.", f"cat {self.path}"), self.path), "")
        events = self.round("Read README.md and src/app.py.", "cat README.md")
        self.assertEqual(review.subject_read(events, self.path), "")


if __name__ == "__main__":
    unittest.main()
