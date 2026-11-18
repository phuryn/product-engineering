#!/usr/bin/env python3
"""Regression checks for the codex-agents wrapper's session handling, without starting Codex.

Run with `python -B tools/test_codex.py`.
"""

from __future__ import annotations

import contextlib
import importlib.util
import io
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "agent-teams/skills/codex-agents/scripts/codex.py"
spec = importlib.util.spec_from_file_location("codex_wrapper", SCRIPT)
codex = importlib.util.module_from_spec(spec)
spec.loader.exec_module(codex)


def fake_codex(cmd, work_dir):
    """Answer as Codex CLI 0.169.0 did on 2026-11-17: `-s` sets a new session's sandbox,
    `-c sandbox_mode=...` a resume's, and a resume without either runs read-only."""
    sandbox = "read-only"
    if "-s" in cmd:
        sandbox = cmd[cmd.index("-s") + 1]
    for arg in cmd:
        if arg.startswith("sandbox_mode="):
            sandbox = arg.split("=", 1)[1].strip('"')
    shown = sandbox + (" [workdir, /tmp, $TMPDIR]" if sandbox == "workspace-write" else "")
    header = (f"OpenAI Codex v0.169.0\n--------\nworkdir: {work_dir}\nmodel: gpt-6.1-sol\n"
              f"sandbox: {shown}\nsession id: s-1\n--------\n")
    return subprocess.CompletedProcess(cmd, 0, stdout="ok\n", stderr=header)


class ResumeSandboxTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.marker = Path(tmp.name) / "marker"
        for patch in (mock.patch.object(codex, "ACTIVE_MARKER", self.marker),
                      mock.patch.object(codex, "find_codex_bin", return_value="codex")):
            patch.start()
            self.addCleanup(patch.stop)
        self.calls = []

    def run_wrapper(self, *args):
        def record(cmd, work_dir):
            self.calls.append(cmd)
            return fake_codex(cmd, work_dir)
        err = io.StringIO()
        with mock.patch.object(codex, "_run", side_effect=record), \
                mock.patch.object(sys, "argv", ["codex.py", "--cwd", str(ROOT), *args, "go"]), \
                contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(err):
            codex.main()
        return self.calls[-1], err.getvalue()

    def test_resume_resends_the_sessions_sandbox(self):
        self.run_wrapper("--new", "--sandbox", "danger-full-access")
        cmd, err = self.run_wrapper()
        self.assertEqual(cmd[1:3], ["exec", "resume"])
        self.assertIn('sandbox_mode="danger-full-access"', cmd)
        self.assertIn("sandbox: danger-full-access", err)
        self.assertNotIn("warning", err)

    def test_new_session_defaults_to_read_only(self):
        cmd, _ = self.run_wrapper("--new")
        self.assertEqual(cmd[cmd.index("-s") + 1], "read-only")
        self.assertEqual(json.loads(self.marker.read_text())["sandbox"], "read-only")

    def test_sandbox_on_a_resume_wins_and_is_recorded(self):
        self.run_wrapper("--new", "--sandbox", "read-only")
        cmd, _ = self.run_wrapper("--sandbox", "workspace-write")
        self.assertIn('sandbox_mode="workspace-write"', cmd)
        cmd, _ = self.run_wrapper()
        self.assertIn('sandbox_mode="workspace-write"', cmd)

    def test_session_id_takes_the_markers_sandbox_only_for_its_own_session(self):
        self.run_wrapper("--new", "--sandbox", "workspace-write")
        cmd, _ = self.run_wrapper("--session", "s-1")
        self.assertIn('sandbox_mode="workspace-write"', cmd)
        cmd, err = self.run_wrapper("--session", "s-other")
        self.assertFalse(any(a.startswith("sandbox_mode=") for a in cmd))
        self.assertIn("config default", err)

    def test_a_narrower_reported_sandbox_warns(self):
        self.run_wrapper("--new", "--sandbox", "workspace-write")
        with mock.patch.object(codex, "_sandbox_args", return_value=[]):
            _, err = self.run_wrapper()
        self.assertIn("warning: requested sandbox workspace-write but codex ran under read-only", err)


if __name__ == "__main__":
    unittest.main()
