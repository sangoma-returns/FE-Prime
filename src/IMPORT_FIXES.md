# 🔧 Import Fixes - Implementation Guide

## Summary
After creating the proper `package.json`, we need to remove all version specifiers from import statements since package.json now manages versions.

---

## Files to Fix

### ✅ COMPLETED

1. `/components/ui/sonner.tsx` - Fixed sonner and next-themes imports

---

### 🔄 PENDING - Radix UI Imports

Remove `@X.X.X` from all Radix UI imports:

1. `/components/ui/accordion.tsx` - `@radix-ui/react-accordion@1.2.3` → `@radix-ui/react-accordion`
2. `/components/ui/alert-dialog.tsx` - `@radix-ui/react-alert-dialog@1.1.6` → `@radix-ui/react-alert-dialog`
3. `/components/ui/aspect-ratio.tsx` - `@radix-ui/react-aspect-ratio@1.1.2` → `@radix-ui/react-aspect-ratio`
4. `/components/ui/avatar.tsx` - `@radix-ui/react-avatar@1.1.3` → `@radix-ui/react-avatar`
5. `/components/ui/badge.tsx` - `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`
6. `/components/ui/breadcrumb.tsx` - `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`
7. `/components/ui/button.tsx` - `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`
8. `/components/ui/checkbox.tsx` - `@radix-ui/react-checkbox@1.1.4` → `@radix-ui/react-checkbox`
9. `/components/ui/collapsible.tsx` - `@radix-ui/react-collapsible@1.1.3` → `@radix-ui/react-collapsible`
10. `/components/ui/context-menu.tsx` - `@radix-ui/react-context-menu@2.2.6` → `@radix-ui/react-context-menu`
11. `/components/ui/dialog.tsx` - `@radix-ui/react-dialog@1.1.6` → `@radix-ui/react-dialog`
12. `/components/ui/dropdown-menu.tsx` - `@radix-ui/react-dropdown-menu@2.1.6` → `@radix-ui/react-dropdown-menu`
13. `/components/ui/form.tsx` - `@radix-ui/react-label@2.1.2` AND `@radix-ui/react-slot@1.1.2`
14. `/components/ui/hover-card.tsx` - `@radix-ui/react-hover-card@1.1.6` → `@radix-ui/react-hover-card`
15. `/components/ui/label.tsx` - `@radix-ui/react-label@2.1.2` → `@radix-ui/react-label`
16. `/components/ui/menubar.tsx` - `@radix-ui/react-menubar@1.1.6` → `@radix-ui/react-menubar`
17. `/components/ui/navigation-menu.tsx` - `@radix-ui/react-navigation-menu@1.2.5` → `@radix-ui/react-navigation-menu`
18. `/components/ui/popover.tsx` - `@radix-ui/react-popover@1.1.6` → `@radix-ui/react-popover`
19. `/components/ui/progress.tsx` - `@radix-ui/react-progress@1.1.2` → `@radix-ui/react-progress`
20. `/components/ui/radio-group.tsx` - `@radix-ui/react-radio-group@1.2.3` → `@radix-ui/react-radio-group`
21. `/components/ui/scroll-area.tsx` - `@radix-ui/react-scroll-area@1.2.3` → `@radix-ui/react-scroll-area`
22. `/components/ui/select.tsx` - `@radix-ui/react-select@2.1.6` → `@radix-ui/react-select`
23. `/components/ui/separator.tsx` - `@radix-ui/react-separator@1.1.2` → `@radix-ui/react-separator`
24. `/components/ui/sheet.tsx` - `@radix-ui/react-dialog@1.1.6` → `@radix-ui/react-dialog`
25. `/components/ui/sidebar.tsx` - `@radix-ui/react-slot@1.1.2` → `@radix-ui/react-slot`
26. `/components/ui/slider.tsx` - `@radix-ui/react-slider@1.2.3` → `@radix-ui/react-slider`
27. `/components/ui/switch.tsx` - `@radix-ui/react-switch@1.1.3` → `@radix-ui/react-switch`
28. `/components/ui/tabs.tsx` - `@radix-ui/react-tabs@1.1.3` → `@radix-ui/react-tabs`
29. `/components/ui/toggle-group.tsx` - `@radix-ui/react-toggle-group@1.1.2` → `@radix-ui/react-toggle-group`
30. `/components/ui/toggle.tsx` - `@radix-ui/react-toggle@1.1.2` → `@radix-ui/react-toggle`
31. `/components/ui/tooltip.tsx` - `@radix-ui/react-tooltip@1.1.8` → `@radix-ui/react-tooltip`

---

### 🔄 PENDING - Lucide React Imports

Remove `@0.487.0` from all lucide-react imports:

1. `/components/ui/accordion.tsx` - `lucide-react@0.487.0` → `lucide-react`
2. `/components/ui/breadcrumb.tsx` - `lucide-react@0.487.0` → `lucide-react`
3. `/components/ui/calendar.tsx` - `lucide-react@0.487.0` → `lucide-react`
4. `/components/ui/carousel.tsx` - `lucide-react@0.487.0` → `lucide-react`
5. `/components/ui/checkbox.tsx` - `lucide-react@0.487.0` → `lucide-react`
6. `/components/ui/command.tsx` - `lucide-react@0.487.0` → `lucide-react`
7. `/components/ui/context-menu.tsx` - `lucide-react@0.487.0` → `lucide-react`
8. `/components/ui/dialog.tsx` - `lucide-react@0.487.0` → `lucide-react`
9. `/components/ui/dropdown-menu.tsx` - `lucide-react@0.487.0` → `lucide-react`
10. `/components/ui/input-otp.tsx` - `lucide-react@0.487.0` → `lucide-react`
11. `/components/ui/menubar.tsx` - `lucide-react@0.487.0` → `lucide-react`
12. `/components/ui/navigation-menu.tsx` - `lucide-react@0.487.0` → `lucide-react`
13. `/components/ui/pagination.tsx` - `lucide-react@0.487.0` → `lucide-react`
14. `/components/ui/radio-group.tsx` - `lucide-react@0.487.0` → `lucide-react`
15. `/components/ui/resizable.tsx` - `lucide-react@0.487.0` → `lucide-react`
16. `/components/ui/select.tsx` - `lucide-react@0.487.0` → `lucide-react`
17. `/components/ui/sheet.tsx` - `lucide-react@0.487.0` → `lucide-react`
18. `/components/ui/sidebar.tsx` - `lucide-react@0.487.0` → `lucide-react`

---

### 🔄 PENDING - Class Variance Authority Imports

Remove `@0.7.1` from class-variance-authority imports:

1. `/components/ui/alert.tsx` - `class-variance-authority@0.7.1` → `class-variance-authority`
2. `/components/ui/badge.tsx` - `class-variance-authority@0.7.1` → `class-variance-authority`
3. `/components/ui/button.tsx` - `class-variance-authority@0.7.1` → `class-variance-authority`
4. `/components/ui/navigation-menu.tsx` - `class-variance-authority@0.7.1` → `class-variance-authority`
5. `/components/ui/sidebar.tsx` - `class-variance-authority@0.7.1` → `class-variance-authority`
6. `/components/ui/toggle-group.tsx` - `class-variance-authority@0.7.1` → `class-variance-authority`
7. `/components/ui/toggle.tsx` - `class-variance-authority@0.7.1` → `class-variance-authority`

---

## Automation Script

Since there are 50+ files to fix, here's a regex pattern to find all versioned imports:

```regex
Search: from ["'](.+)@[\d.]+["']
Replace: from "$1"
```

This should be run across all `/components/ui/*.tsx` files.

---

## Testing After Fixes

1. ✅ Run `npm install` 
2. ✅ Check TypeScript compilation: `npm run type-check`
3. ✅ Run development server: `npm run dev`
4. ✅ Verify no import errors in browser console
5. ✅ Test all UI components render correctly

---

## Status: Ready for Batch Processing

Due to the large number of files (50+), the most efficient approach is:

**Option A (Recommended):** Use IDE's Find & Replace with regex across `/components/ui/` directory
- Pattern: `from ["'](.+)@[\d.]+["']`
- Replace: `from "$1"`

**Option B:** Fix files individually using edit_tool (time-consuming for 50+ files)

**Option C:** Ask user to run a simple script to batch fix all imports
