# خطة تعديلات تنقل المصحف

## نظرة عامة
تعديل نظام التنقل في مكون المصحف (MushafViewer) لإزالة أسهم التنقل الجانبية وتبديل الأيقونات في أزرار التنقل السفلية.

## الملف المطلوب تعديله
- `src/components/mushaf/MushafViewer.tsx`

## التغييرات المطلوبة

### 1. إزالة أسهم التنقل الجانبية
**الموقع:** السطور 613-627

**الكود الحالي:**
```tsx
{/* Navigation Arrows */}
<button
  onClick={dir === "rtl" ? prevPage : nextPage}
  disabled={dir === "rtl" ? currentPage <= 1 : currentPage >= TOTAL_PAGES}
  className="fixed start-2 top-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-full hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
>
  <ChevronLeft size={20} />
</button>
<button
  onClick={dir === "rtl" ? nextPage : prevPage}
  disabled={dir === "rtl" ? currentPage >= TOTAL_PAGES : currentPage <= 1}
  className="fixed end-2 top-1/2 -translate-y-1/2 p-3 bg-card border border-border rounded-full hover:bg-muted transition-colors duration-200 disabled:opacity-30 disabled:cursor-not-allowed z-10"
>
  <ChevronRight size={20} />
</button>
```

**الإجراء:** حذف هذا القسم بالكامل

---

### 2. تبديل الأيقونات في أزرار التنقل السفلية
**الموقع:** السطور 630-655

**الكود الحالي:**
```tsx
{/* Bottom Navigation */}
<div className="flex items-center justify-between px-4 py-2 bg-card border-t border-border">
  <button
    onClick={prevPage}
    disabled={currentPage <= 1}
    className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
  >
    <SkipBack size={14} />
    {t.mushaf.prevPage}
  </button>

  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      {currentPage} / {TOTAL_PAGES}
    </span>
  </div>

  <button
    onClick={nextPage}
    disabled={currentPage >= TOTAL_PAGES}
    className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
  >
    {t.mushaf.nextPage}
    <SkipForward size={14} />
  </button>
</div>
```

**الكود بعد التعديل:**
```tsx
{/* Bottom Navigation */}
<div className="flex items-center justify-between px-4 py-2 bg-card border-t border-border">
  <button
    onClick={prevPage}
    disabled={currentPage <= 1}
    className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
  >
    <SkipForward size={14} />
    {t.mushaf.prevPage}
  </button>

  <div className="flex items-center gap-2">
    <span className="text-sm font-medium">
      {currentPage} / {TOTAL_PAGES}
    </span>
  </div>

  <button
    onClick={nextPage}
    disabled={currentPage >= TOTAL_PAGES}
    className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-muted rounded-lg transition-colors disabled:opacity-30"
  >
    {t.mushaf.nextPage}
    <SkipBack size={14} />
  </button>
</div>
```

**التغييرات:**
- زر الصفحة السابقة: تغيير `<SkipBack />` إلى `<SkipForward />`
- زر الصفحة التالية: تغيير `<SkipForward />` إلى `<SkipBack />`

---

## ملخص التغييرات

| التغيير | الموقع | الإجراء |
|---------|--------|---------|
| إزالة أسهم التنقل الجانبية | السطور 613-627 | حذف القسم بالكامل |
| تبديل أيقونة زر السابق | السطر 637 | SkipBack → SkipForward |
| تبديل أيقونة زر التالي | السطر 653 | SkipForward → SkipBack |

## النتيجة المتوقعة
- إزالة الزرين الثابتين على جوانب الشاشة
- الحفاظ على التنقل فقط عبر الأزرار السفلية
- تبديل الأيقونات في الأزرار السفلية (أيقونة "التالي" تصبح في زر "السابق" والعكس)
