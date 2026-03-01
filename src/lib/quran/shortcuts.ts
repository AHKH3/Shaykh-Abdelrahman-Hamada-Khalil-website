export interface MushafShortcut {
  id: string;
  keys: string[];
  descriptionAr: string;
  descriptionEn: string;
}

export const MUSHAF_SHORTCUTS: MushafShortcut[] = [
  {
    id: "context-left",
    keys: ["←"],
    descriptionAr: "السياق الذكي: آية تالية أو صفحة تالية",
    descriptionEn: "Smart context: next verse or next page",
  },
  {
    id: "context-right",
    keys: ["→"],
    descriptionAr: "السياق الذكي: آية سابقة أو صفحة سابقة",
    descriptionEn: "Smart context: previous verse or previous page",
  },
  {
    id: "force-page-nav",
    keys: ["Shift+←", "Shift+→"],
    descriptionAr: "تقليب الصفحات مباشرة (تجاوز تنقل الآيات)",
    descriptionEn: "Force page navigation (skip verse navigation)",
  },
  {
    id: "open-search",
    keys: ["F"],
    descriptionAr: "فتح نافذة البحث",
    descriptionEn: "Open search dialog",
  },
  {
    id: "toggle-range-panel",
    keys: ["V"],
    descriptionAr: "فتح/إغلاق لوحة مدى الآيات",
    descriptionEn: "Toggle verse range panel",
  },
  {
    id: "focus-range",
    keys: ["R"],
    descriptionAr: "التركيز على مدخلات مدى الآيات",
    descriptionEn: "Focus verse range inputs",
  },
  {
    id: "toggle-audio",
    keys: ["Space"],
    descriptionAr: "تشغيل/إيقاف الصوت",
    descriptionEn: "Play/pause audio",
  },
  {
    id: "close-active",
    keys: ["Esc"],
    descriptionAr: "إغلاق النافذة أو القائمة النشطة",
    descriptionEn: "Close active panel or menu",
  },
  {
    id: "show-shortcuts",
    keys: ["?"],
    descriptionAr: "عرض الاختصارات",
    descriptionEn: "Show shortcuts",
  },
];
