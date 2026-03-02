import { expect, test, type Page } from "@playwright/test";

type Locale = "ar" | "en";
type Theme = "light" | "dark";

interface VisualScenario {
  id: string;
  path: string;
  readySelector: string;
}

const scenarios: VisualScenario[] = [
  { id: "home", path: "/", readySelector: "main section" },
  { id: "mushaf", path: "/mushaf", readySelector: ".mushaf-page-view" },
  { id: "library", path: "/library", readySelector: "main h1" },
  { id: "admin", path: "/admin", readySelector: "main h1" },
  { id: "login", path: "/login", readySelector: "main form" },
];

const locales: Locale[] = ["ar", "en"];
const themes: Theme[] = ["light", "dark"];

const libraryApps = [
  {
    id: "app-1",
    title: "أذكار الصباح",
    title_en: "Morning Athkar",
    description: "تطبيق بسيط لأذكار الصباح",
    description_en: "Simple app for morning athkar",
    file_path: "athkar.html",
    icon_url: null,
    created_at: "2026-01-10T08:00:00.000Z",
  },
  {
    id: "app-2",
    title: "عداد التسبيح",
    title_en: "Tasbeeh Counter",
    description: "عداد تسبيح بسيط",
    description_en: "Simple tasbeeh counter",
    file_path: "tasbeeh.html",
    icon_url: null,
    created_at: "2026-01-09T08:00:00.000Z",
  },
];

const students = [
  { id: "student-1", name: "طالب تجريبي", created_at: "2026-01-01T00:00:00.000Z" },
  { id: "student-2", name: "Student Test", created_at: "2026-01-02T00:00:00.000Z" },
];

const annotations = [{ id: "annotation-1" }, { id: "annotation-2" }, { id: "annotation-3" }];

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
        : table === "library_apps"
          ? libraryApps
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

for (const locale of locales) {
  for (const theme of themes) {
    for (const scenario of scenarios) {
      test(`${scenario.id} | ${locale} | ${theme}`, async ({ page }) => {
        await mockSupabase(page);
        await prepareVisualState(page, locale, theme);

        await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle");
        await page.locator(scenario.readySelector).first().waitFor({ state: "visible" });
        await page.waitForFunction(
          (activeLocale) => document.documentElement.dir === (activeLocale === "ar" ? "rtl" : "ltr"),
          locale,
        );
        await freezeAnimations(page);
        await page.waitForTimeout(120);

        await expect(page).toHaveScreenshot(`${scenario.id}-${locale}-${theme}.png`, {
          animations: "disabled",
          caret: "hide",
          fullPage: false,
        });
      });
    }
  }
}
