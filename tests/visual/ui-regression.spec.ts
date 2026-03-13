import { expect, test, type Page } from "@playwright/test";

type Locale = "ar" | "en";
type Theme = "light" | "dark";

interface VisualScenario {
  id: string;
  path: string;
  readySelector: string;
  setup?: (page: Page) => Promise<void>;
  assert?: (page: Page, locale: Locale) => Promise<void>;
}

const scenarios: VisualScenario[] = [
  {
    id: "home",
    path: "/",
    readySelector: "main section",
    assert: async (page) => {
      const sections = page.locator("main section");
      await expect(page.locator("main h1")).toBeVisible();
      await expect(page.locator('main a[href="/mushaf"]').first()).toBeVisible();
      expect(await sections.count()).toBeGreaterThanOrEqual(4);
    },
  },
  {
    id: "mushaf",
    path: "/mushaf",
    readySelector: ".mushaf-page-view",
    assert: async (page, locale) => {
      await expect(page.locator(".mushaf-page-view [data-verse-key]").first()).toBeVisible();
      await expect(
        page.getByLabel(locale === "ar" ? /^الصفحة \d+ من \d+$/ : /^Page \d+ of \d+$/),
      ).toBeVisible();
    },
  },
  {
    id: "mushaf-index-open",
    path: "/mushaf",
    readySelector: ".mushaf-page-view",
    setup: async (page) => {
      await page.getByTestId("open-index-panel").click();
      await page.getByTestId("mushaf-index-panel").waitFor({ state: "visible" });
    },
    assert: async (page) => {
      const panel = page.getByTestId("mushaf-index-panel");
      await expect(panel.locator("input").first()).toBeVisible();
      await expect(panel.getByRole("button").first()).toBeVisible();
    },
  },
  {
    id: "mushaf-verse-range-open",
    path: "/mushaf",
    readySelector: ".mushaf-page-view",
    setup: async (page) => {
      await page.getByTestId("open-verse-range-panel").click();
      await page.getByTestId("mushaf-verse-range-panel").waitFor({ state: "visible" });
    },
    assert: async (page) => {
      await expect(page.getByTestId("mushaf-verse-range-panel").locator("input").first()).toBeVisible();
    },
  },
  {
    id: "mushaf-audio-open",
    path: "/mushaf",
    readySelector: ".mushaf-page-view",
    setup: async (page) => {
      await page.getByTestId("open-audio-panel").click();
      await page.getByTestId("mushaf-audio-panel").waitFor({ state: "visible" });
    },
    assert: async (page) => {
      const controls = page.getByTestId("mushaf-audio-panel").getByRole("button");
      expect(await controls.count()).toBeGreaterThanOrEqual(5);
    },
  },
  {
    id: "mushaf-display-settings-open",
    path: "/mushaf",
    readySelector: ".mushaf-page-view",
    setup: async (page) => {
      await page.getByTestId("open-display-settings-panel").click();
      await page.getByTestId("mushaf-display-settings-panel").waitFor({ state: "visible" });
    },
    assert: async (page) => {
      const panel = page.getByTestId("mushaf-display-settings-panel");
      await expect(panel.getByRole("heading").first()).toBeVisible();
      expect(await panel.getByRole("button").count()).toBeGreaterThanOrEqual(4);
    },
  },
  {
    id: "mushaf-tafsir-open",
    path: "/mushaf",
    readySelector: ".mushaf-page-view",
    setup: async (page) => {
      await page.getByTestId("open-tafsir-panel").click();
      await page.getByTestId("tafsir-panel-root").waitFor({ state: "visible" });
    },
    assert: async (page) => {
      const panel = page.getByTestId("tafsir-panel-root");
      await expect(panel.getByRole("heading").first()).toBeVisible();
      await expect(panel.getByRole("button").first()).toBeVisible();
    },
  },
  {
    id: "admin",
    path: "/admin",
    readySelector: "main h1",
    assert: async (page) => {
      const dashboardLinks = page.locator('main a[href="/mushaf/students"], main a[href="/mushaf"]');
      await expect(page.locator("main h1")).toBeVisible();
      expect(await dashboardLinks.count()).toBe(2);
    },
  },
  {
    id: "login",
    path: "/login",
    readySelector: "main form",
    assert: async (page) => {
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    },
  },
];

const locales: Locale[] = ["ar", "en"];
const themes: Theme[] = ["light", "dark"];

const students = [
  { id: "student-1", name: "طالب تجريبي", created_at: "2026-01-01T00:00:00.000Z" },
  { id: "student-2", name: "Student Test", created_at: "2026-01-02T00:00:00.000Z" },
];

const annotations = [{ id: "annotation-1" }, { id: "annotation-2" }, { id: "annotation-3" }];
const mockChapters = [
  {
    id: 1,
    revelation_place: "makkah",
    revelation_order: 5,
    bismillah_pre: true,
    name_simple: "Al-Fatihah",
    name_complex: "Al-Fatihah",
    name_arabic: "الفاتحة",
    verses_count: 7,
    pages: [1, 1],
    translated_name: {
      language_name: "english",
      name: "The Opening",
    },
  },
  {
    id: 2,
    revelation_place: "madinah",
    revelation_order: 87,
    bismillah_pre: true,
    name_simple: "Al-Baqarah",
    name_complex: "Al-Baqarah",
    name_arabic: "البقرة",
    verses_count: 286,
    pages: [2, 49],
    translated_name: {
      language_name: "english",
      name: "The Cow",
    },
  },
] as const;
const mockVerseTexts = [
  "الم ذَٰلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ",
  "هُدًى لِلْمُتَّقِينَ",
  "الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ",
];

function createMockPageVerses(pageNumber: number) {
  const startVerse = Math.max(1, (pageNumber - 1) * mockVerseTexts.length + 1);

  return mockVerseTexts.map((text_uthmani, index) => ({
    id: pageNumber * 100 + index + 1,
    verse_number: startVerse + index,
    verse_key: `2:${startVerse + index}`,
    hizb_number: 1,
    rub_el_hizb_number: 1,
    ruku_number: 1,
    manzil_number: 1,
    sajdah_number: null,
    page_number: pageNumber,
    juz_number: 1,
    text_uthmani,
    chapter_id: 2,
  }));
}

async function mockSupabase(page: Page) {
  await page.route("**://placeholder.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;
    const accept = (await request.headerValue("accept")) || "";

    const jsonHeaders = {
      "access-control-allow-origin": "*",
      "content-type": "application/json; charset=utf-8",
    };

    if (path.startsWith("/auth/v1/")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ user: null }),
      });
      return;
    }

    if (!path.startsWith("/rest/v1/")) {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify([]),
      });
      return;
    }

    const table = path.split("/").pop();
    const rows =
      table === "students"
        ? students
        : table === "annotations"
            ? annotations
            : [];

    if (method === "HEAD") {
      await route.fulfill({
        status: 200,
        headers: {
          ...jsonHeaders,
          "content-range": `0-0/${rows.length}`,
        },
        body: "",
      });
      return;
    }

    if (accept.includes("application/vnd.pgrst.object+json")) {
      const idFilter = url.searchParams.get("id");
      if (idFilter?.startsWith("eq.")) {
        const matched = rows.find((row) => row.id === idFilter.replace("eq.", ""));
        await route.fulfill({
          status: matched ? 200 : 404,
          headers: jsonHeaders,
          body: JSON.stringify(matched || {}),
        });
        return;
      }
    }

    await route.fulfill({
      status: 200,
      headers: {
        ...jsonHeaders,
        "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
      },
      body: JSON.stringify(rows),
    });
  });
}

async function mockQuranApi(page: Page) {
  await page.route("**://api.quran.com/api/v4/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    const jsonHeaders = {
      "access-control-allow-origin": "*",
      "content-type": "application/json; charset=utf-8",
    };

    if (path === "/api/v4/chapters") {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ chapters: mockChapters }),
      });
      return;
    }

    const versesByPageMatch = path.match(/^\/api\/v4\/verses\/by_page\/(\d+)$/);
    if (versesByPageMatch) {
      const pageNumber = Number(versesByPageMatch[1]);
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          verses: createMockPageVerses(pageNumber),
          pagination: { total_records: 604 * mockVerseTexts.length },
        }),
      });
      return;
    }

    const versesByChapterMatch = path.match(/^\/api\/v4\/verses\/by_chapter\/(\d+)$/);
    if (versesByChapterMatch) {
      const chapterId = Number(versesByChapterMatch[1]);
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          verses: createMockPageVerses(1).map((verse) => ({ ...verse, chapter_id: chapterId })),
          pagination: { total_pages: 1, total_records: mockVerseTexts.length },
        }),
      });
      return;
    }

    if (path === "/api/v4/juzs") {
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({ juzs: [] }),
      });
      return;
    }

    const tafsirMatch = path.match(/^\/api\/v4\/tafsirs\/(\d+)\/by_ayah\/(.+)$/);
    if (tafsirMatch) {
      const [, tafsirId, verseKey] = tafsirMatch;
      await route.fulfill({
        status: 200,
        headers: jsonHeaders,
        body: JSON.stringify({
          tafsir: {
            id: Number(tafsirId),
            resource_id: Number(tafsirId),
            text: `<p>Mock tafsir for ${verseKey}</p>`,
            verse_key: verseKey,
            verse_id: 1,
            language_name: "english",
            resource_name: "Mock Tafsir",
          },
        }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      headers: jsonHeaders,
      body: JSON.stringify({}),
    });
  });
}

async function prepareVisualState(page: Page, locale: Locale, theme: Theme) {
  await page.addInitScript(
    ({ activeLocale, activeTheme }) => {
      window.localStorage.setItem("locale", activeLocale);
      window.localStorage.setItem("theme", activeTheme);
    },
    { activeLocale: locale, activeTheme: theme },
  );
}

async function freezeAnimations(page: Page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation-duration: 0ms !important;
        animation-delay: 0ms !important;
        transition-duration: 0ms !important;
        transition-delay: 0ms !important;
      }
    `,
  });
}

async function assertDocumentState(page: Page, locale: Locale, theme: Theme) {
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe(locale);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.dir))
    .toBe(locale === "ar" ? "rtl" : "ltr");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.classList.contains("dark")))
    .toBe(theme === "dark");
}

async function assertLayoutShell(page: Page, readySelector: string) {
  const readyElement = page.locator(readySelector).first();
  await expect(page.locator("header").first()).toBeVisible();
  await expect(page.locator("main").first()).toBeVisible();
  await expect(readyElement).toBeVisible();

  const overflowX = await page.evaluate(() =>
    Math.max(document.documentElement.scrollWidth - document.documentElement.clientWidth, 0),
  );
  expect(overflowX).toBeLessThanOrEqual(4);
}

for (const locale of locales) {
  for (const theme of themes) {
    for (const scenario of scenarios) {
      test(`${scenario.id} | ${locale} | ${theme}`, async ({ page }) => {
        await mockSupabase(page);
        await mockQuranApi(page);
        await prepareVisualState(page, locale, theme);

        await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        await page.locator(scenario.readySelector).first().waitFor({ state: "visible" });
        await assertDocumentState(page, locale, theme);
        if (scenario.setup) {
          await scenario.setup(page);
        }
        await freezeAnimations(page);
        await page.waitForTimeout(120);
        await assertLayoutShell(page, scenario.readySelector);
        if (scenario.assert) {
          await scenario.assert(page, locale);
        }
      });
    }
  }
}
