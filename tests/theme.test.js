import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { applyTheme, getStoredTheme } from "../src/hooks/use-theme.js";

const themeKey = "salary-tracker-theme";

function mockBrowser(t, savedTheme) {
  const classes = new Set();
  const meta = new Map();
  const storage = new Map([
    [themeKey, savedTheme],
    ["expense-cache", "keep existing data"],
  ]);
  const root = {
    style: {},
    classList: {
      toggle(name, enabled) {
        if (enabled) classes.add(name);
        else classes.delete(name);
      },
    },
  };
  const globals = {
    document: {
      documentElement: root,
      querySelector(selector) {
        return { setAttribute: (name, value) => meta.set(`${selector}:${name}`, value) };
      },
    },
    localStorage: {
      getItem: (key) => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value),
    },
  };

  for (const [name, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  }

  return { classes, meta, root, storage };
}

for (const [theme, color, statusBar] of [
  ["light", "#eef7e8", "default"],
  ["dark", "#12281f", "black-translucent"],
]) {
  test(`restores the ${theme} theme and matching mobile chrome without changing stored data`, (t) => {
    const browser = mockBrowser(t, theme);
    const before = [...browser.storage];
    assert.equal(getStoredTheme(), theme);
    applyTheme(getStoredTheme());
    assert.equal(browser.classes.has("dark"), theme === "dark");
    assert.equal(browser.root.style.colorScheme, theme);
    assert.equal(browser.meta.get('meta[name="theme-color"]:content'), color);
    assert.equal(browser.meta.get('meta[name="apple-mobile-web-app-status-bar-style"]:content'), statusBar);
    assert.deepEqual([...browser.storage], before);
  });
}

test("switching back to light clears the dark class and restores mint browser chrome", (t) => {
  const browser = mockBrowser(t, "dark");
  applyTheme("dark");
  applyTheme("light");
  assert.equal(browser.classes.has("dark"), false);
  assert.equal(browser.root.style.colorScheme, "light");
  assert.equal(browser.meta.get('meta[name="theme-color"]:content'), "#eef7e8");
});

test("a missing or unrecognized saved theme keeps the existing light default", (t) => {
  const browser = mockBrowser(t, null);
  assert.equal(getStoredTheme(), "light");
  browser.storage.set(themeKey, "unknown");
  assert.equal(getStoredTheme(), "light");
});

test("both install manifests and startup chrome use the mint palette", () => {
  const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
  const manifest = JSON.parse(read("../public/manifest.json"));
  assert.deepEqual(manifest, JSON.parse(read("../public/manifest.webmanifest")));
  assert.equal(manifest.background_color, "#eef7e8");
  assert.equal(manifest.theme_color, "#eef7e8");
  const html = read("../index.html");
  assert.match(html, /<meta name="theme-color" content="#eef7e8"/);
  assert.match(html, /--startup-background: #eef7e8/);
  assert.match(html, /--startup-background: #12281f/);
});
