// flight-deck's owner page (agent-harness/skills/flight-deck/assets/owner-page.html) in a real browser:
// both modes, answers, drafts, tabs, boards, failures and both themes, against an injected database.
// Requires Playwright (`playwright` or `playwright-core`, installed or on NODE_PATH) and a Chromium.
// Run: node tools/test_owner_page.cjs
// Optional: CHROMIUM_EXECUTABLE_PATH (an installed Chrome); CAPTURE_DIR for screenshots of both themes.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
let chromium;
try { ({ chromium } = require("playwright")); }
catch { ({ chromium } = require("playwright-core")); }
const html = fs.readFileSync(path.join(__dirname, "../agent-harness/skills/flight-deck/assets/owner-page.html"), "utf8");

// The harness is injected before the shipped script. No fixture or stub goes in the page.
function inject({ data, remembered, storageBlocked, unavailable }) {
  if (storageBlocked) Object.defineProperty(window, "localStorage", { get() { throw new Error("Unavailable"); } });
  else if (remembered) localStorage.setItem("flight-deck-tab", remembered);
  const callbacks = {}, failures = {};
  window.testDb = {
    data, subscriptions: [], writes: [], failSave: null, delaySave: 0,
    push(name, docs) {
      data[name] = docs;
      callbacks[name]({ docs: Object.entries(docs).map(([id, value]) => ({ id, data: () => value })) });
    },
    fail(name) { failures[name](new Error("Unavailable")); },
  };
  if (unavailable === "absent") return;
  window.claude = { async use(name) {
    if (unavailable === "rejected") throw new Error("Unavailable");
    if (unavailable === "null") return null;
    if (name !== "db") throw new Error("Unexpected capability");
    return { collection(name) {
      return {
        onSnapshot(success, failure) {
          testDb.subscriptions.push(name);
          callbacks[name] = success; failures[name] = failure;
          queueMicrotask(() => testDb.push(name, data[name]));
        },
        doc(id) { return { async set(value) {
          testDb.writes.push({ name, id, value });
          if (testDb.delaySave) await new Promise((resolve) => setTimeout(resolve, testDb.delaySave));
          if (testDb.failSave) throw { code: testDb.failSave };
          testDb.push(name, { ...data[name], [id]: value });
        } }; },
      };
    } };
  } };
}

const task = (area, title, group = "now", order = 1) => ({ area, title, kind: "task", group, order, what: "Check the current settings.", after: "Continue the work." });
const fixture = () => ({
  status: {
    api: { name: "Service", where: "Repository: service, branch: integration", kind: "code", phase: "Phase 2 of 4: integration", percent: 40, order: 1,
      touched: "2026-11-06T14:10:00Z", done: ["The request handler"], now: ["Testing the integration"], next: ["The first release"],
      board: [
        { title: "Release checks", column: "next" },
        { title: "Integration tests", column: "now" },
        { title: "Account access", column: "blocked", note: "Waiting on the owner for access" },
        { title: "Request handler", column: "done", note: "Checks passed" },
        { title: "Error handling", column: "done", note: "Failure cases verified" },
      ] },
    study: { name: "Pricing study", where: "Working folder: pricing study", kind: "other", phase: "Phase 1 of 3: scope", order: 2,
      touched: "Waiting for the first session", done: ["Defined the comparison"], now: ["Comparing plans"], next: ["Test assumptions"], board: [] },
  },
  items: {
    release: { ...task("api", "Approve the first release", "later", 99), kind: "gate" },
    access: task("api", "Grant account access", "now", 3),
    choose: { ...task("study", "Choose the study scope", "decide"), kind: "decision", options: [{ id: "small", label: "Focused", recommended: true }, { id: "wide", label: "Broad" }] },
    later: task("study", "Review the comparison", "later"),
    orphan: task("missing", "Confirm where this belongs", "now", 4),
    legacy: { ...task(undefined, "Name this area", "now", 5) },
    answered: task("api", "Check the settings", "now", 0),
  },
  answers: { answered: { done: true, note: "Checked", at: "2026-11-06T14:15:00Z" }, release: { note: "Check the rollback first", at: "2026-11-06T14:15:00Z" } },
});

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH } : {}) });
  const contexts = [];
  async function open(data = fixture(), extra = {}) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
    contexts.push(context);
    const errors = [];
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e));
    await page.route("https://flight-deck.test/**", (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: html }));
    await page.addInitScript(inject, { data, ...extra });
    await page.goto("https://flight-deck.test/");
    await page.waitForFunction(() => document.querySelector(".item, .empty, .notice"));
    return { page, errors };
  }
  try {
    const { page, errors } = await open();
    assert.deepEqual(await page.evaluate(() => testDb.subscriptions), ["status", "items", "answers"]);
    assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Overview (6)");
    assert.deepEqual(await page.locator("#root .item h3").allInnerTexts(), ["Approve the first release", "Check the settings", "Grant account access", "Confirm where this belongs", "Name this area", "Choose the study scope", "Review the comparison"]);
    assert.equal(await page.locator("#root .tag", { hasText: "No area" }).count(), 2);
    assert.equal(await page.locator(".board").count(), 0); // Only the active tab is rendered.
    assert((await page.locator("#status").innerText()).includes(await page.evaluate(() => new Date("2026-11-06T14:10:00Z").toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }))));
    assert((await page.locator("#status").innerText()).includes("Waiting for the first session"));
    await page.locator("#item-release textarea").fill("Verify the rollback before the go");
    await page.locator("#item-release button").click();
    await page.waitForFunction(() => testDb.data.answers.release.note === "Verify the rollback before the go");
    assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Overview (6)");
    assert.equal(await page.locator("#item-release .go").count(), 1);

    const choice = page.locator("#item-choose");
    assert(await choice.locator('input[value="small"]').isChecked());
    await choice.locator('input[value="wide"]').check();
    await choice.locator("textarea").fill("Keep this draft across tabs");
    await page.getByRole("tab", { name: "Service (2)", exact: true }).click();
    assert.equal(await page.locator("#root .board-card").count(), 5);
    assert.equal(await page.locator("#item-choose").count(), 0);
    assert.equal(await page.locator("#item-answered textarea").inputValue(), "Checked");
    await page.locator("#item-access input[type=checkbox]").check();
    await page.locator("#item-access textarea").fill("Access is ready");
    const input = await page.locator("#item-access textarea").elementHandle();
    await page.evaluate(() => testDb.push("status", { ...testDb.data.status, api: { ...testDb.data.status.api, phase: "A changed phase" } }));
    assert(await input.evaluate((node) => node === document.activeElement && node.isConnected));
    assert(!(await page.locator("#status").innerText()).includes("A changed phase"));
    await page.locator("h1").click();
    await page.waitForFunction(() => document.querySelector("#status").innerText.includes("A changed phase"));
    assert.equal(await page.locator("#item-access textarea").inputValue(), "Access is ready");
    await page.getByRole("tab", { name: "Pricing study (2)", exact: true }).click();
    assert.equal(await choice.locator("textarea").inputValue(), "Keep this draft across tabs");
    assert(await choice.locator('input[value="wide"]').isChecked());
    await choice.getByRole("button", { name: "Save", exact: true }).click();
    await page.waitForFunction(() => testDb.data.answers.choose);
    assert.equal(await page.evaluate(() => testDb.data.answers.choose.choice), "wide");
    await page.getByRole("tab", { name: "Overview (5)", exact: true }).click();
    assert.equal(await choice.count(), 1); // An answered item stays, showing its saved answer, until the agent reads it.
    assert((await choice.locator(".saved").innerText()).startsWith("Saved "));
    assert.equal(await page.locator("#item-release").count(), 1); // A gate still waits after a note.

    await page.getByRole("tab", { name: "Service (2)", exact: true }).click();
    assert(await page.locator("#item-access input[type=checkbox]").isChecked());
    await page.evaluate(() => { testDb.failSave = "invalid_argument"; });
    await page.locator("#item-access button").click();
    await page.getByText("This view can't save answers.", { exact: true }).waitFor();
    assert.equal(await page.locator("#item-access textarea").inputValue(), "Access is ready");
    await page.evaluate(() => { testDb.failSave = null; testDb.delaySave = 300; });
    await page.locator("#item-access button").click();
    await page.locator("#item-access textarea").fill("A newer draft during Save");
    await page.waitForFunction(() => testDb.data.answers.access);
    await page.locator("h1").click();
    assert.equal(await page.locator("#item-access textarea").inputValue(), "A newer draft during Save");
    await page.evaluate(() => testDb.push("status", { study: testDb.data.status.study }));
    assert.equal(await page.getByRole("tab", { selected: true }).innerText(), "Overview (4)");
    assert.equal(await page.evaluate(() => localStorage.getItem("flight-deck-tab")), "overview");
    assert.equal(await page.locator("#item-release .tag").first().innerText(), "No area");
    assert.deepEqual(errors, []);

    const single = await open({ status: { current: { phase: "Phase 1", done: ["One", "Two", "Three", "Hidden fourth"] } }, items: { task: task(undefined, "A single ask") }, answers: {} });
    assert.equal(await single.page.getByRole("tab").count(), 0);
    assert.equal(await single.page.getByRole("tabpanel").count(), 0);
    assert.equal(await single.page.locator(".board").count(), 0);
    assert.equal(await single.page.locator(".status .lines li").count(), 3);
    assert.equal(await single.page.locator("#item-task .tag").count(), 1);
    await single.page.evaluate(() => testDb.push("status", { ...testDb.data.status, api: { phase: "New area", kind: "unrecognized" } }));
    assert.equal(await single.page.getByRole("tab").count(), 3); // current remains visible beside an area.
    assert.equal(await single.page.locator("#item-task .tag").first().innerText(), "No area");
    await single.page.getByRole("tab", { name: "current (0)", exact: true }).click();
    await single.page.evaluate(() => testDb.push("status", { current: { phase: "Phase 1", board: Array.from({ length: 12 }, (_, i) => ({ title: "Work " + i, column: i < 2 ? "unknown" : "done" })) } }));
    assert.equal(await single.page.getByRole("tab").count(), 0);
    assert.equal(await single.page.locator(".board-card").count(), 10);
    assert.deepEqual(await single.page.locator(".board-column").first().locator("h4").allInnerTexts(), ["Work 0", "Work 1"]);

    for (const extra of [{ remembered: "area:api" }, { remembered: "area:gone" }, { storageBlocked: true }]) {
      const opened = await open(fixture(), extra);
      assert.equal(await opened.page.getByRole("tab", { selected: true }).innerText(), extra.remembered === "area:api" ? "Service (2)" : "Overview (6)");
      assert.deepEqual(opened.errors, []);
    }
    for (const unavailable of ["absent", "null", "rejected"]) {
      const opened = await open(fixture(), { unavailable });
      assert((await opened.page.locator(".notice").innerText()).includes(unavailable === "rejected" ? "couldn't load" : "claude.ai"));
      assert.deepEqual(opened.errors, []);
    }
    const failed = await open();
    await failed.page.evaluate(() => testDb.fail("status"));
    assert((await failed.page.locator("#status").innerText()).includes("The status couldn't load"));
    await failed.page.evaluate(() => testDb.fail("answers"));
    assert((await failed.page.locator("#root").innerText()).includes("The list couldn't load"));
    const keyboard = (await open()).page;
    await keyboard.getByRole("tab", { name: "Overview (6)", exact: true }).focus();
    await keyboard.keyboard.press("ArrowRight");
    assert.equal(await keyboard.getByRole("tab", { selected: true }).innerText(), "Service (2)");
    assert.equal(await keyboard.getByRole("tabpanel").getAttribute("aria-labelledby"), "tab-area:api");
    await keyboard.keyboard.press("End");
    assert.equal(await keyboard.getByRole("tab", { selected: true }).innerText(), "Pricing study (2)");

    const visual = (await open()).page;
    for (const theme of ["light", "dark"]) {
      await visual.emulateMedia({ colorScheme: theme });
      for (const width of [1440, 768, 390, 360, 320]) {
        await visual.setViewportSize({ width, height: 1000 });
        for (const tab of ["Overview (6)", "Service (2)", "Pricing study (2)"]) {
          await visual.getByRole("tab", { name: tab, exact: true }).click();
          assert(await visual.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth), `${theme}, ${width}, ${tab}: horizontal scroll`);
          if (tab === "Service (2)") {
            const boxes = await visual.locator(".board-column").evaluateAll((nodes) => nodes.map((n) => ({ x: n.getBoundingClientRect().x, y: n.getBoundingClientRect().y })));
            assert(width <= 640 ? boxes.every((b) => b.x === boxes[0].x) : boxes.every((b) => b.y === boxes[0].y));
          }
          if (process.env.CAPTURE_DIR && width >= 390) {
            fs.mkdirSync(process.env.CAPTURE_DIR, { recursive: true });
            const height = await visual.evaluate(() => document.documentElement.scrollHeight);
            for (let top = 0, part = 1; top < height; top += 2500, part++) {
              await visual.screenshot({ path: path.join(process.env.CAPTURE_DIR, `${theme}-${width}-${tab.split(" ")[0].toLowerCase()}-${part}.png`), fullPage: true, clip: { x: 0, y: top, width, height: Math.min(2500, height - top) } });
            }
          }
        }
      }
    }
    await visual.emulateMedia({ forcedColors: "active" });
    const selectedBorder = await visual.getByRole("tab", { selected: true }).evaluate((node) => getComputedStyle(node).borderBottomStyle);
    assert.equal(selectedBorder, "solid");
    const empty = await open({ status: { api: { phase: "Ready" } }, items: {}, answers: {} });
    assert.equal(await empty.page.getByRole("tab", { selected: true }).innerText(), "Overview (0)");
    assert.equal(await empty.page.locator("#root .empty").innerText(), "Nothing needs you right now.");
    await visual.evaluate(() => testDb.push("status", Object.fromEntries(Object.entries(testDb.data.status).map(([id, area]) => [id, { ...area, name: "Long".repeat(100), where: "Folder".repeat(100), board: [{ title: "Work".repeat(100), column: "now", note: "Evidence".repeat(100) }] }]))));
    for (const tab of ["Overview", "Long"]) {
      await visual.getByRole("tab", { name: new RegExp("^" + tab) }).first().click();
      assert(await visual.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth));
    }
    console.log("ok: owner page modes, answers, drafts, tabs, boards, failures and both themes at 1440/768/390/360/320");
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
