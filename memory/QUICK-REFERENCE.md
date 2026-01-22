# 🚀 Quick Reference Card - React Native POS

## ⚡ Non-Negotiable Standards

### TypeScript
- ✅ Strict mode enabled
- ❌ NO `any` types
- ✅ Complete type coverage

### Code Quality
- ❌ Zero ESLint errors/warnings
- ✅ Components < 250 lines
- ✅ JSDoc for public APIs

### Testing
- ✅ 80% overall coverage
- ✅ 100% coverage: payments, inventory, tax, auth
- ✅ Tests required before merge

### Accessibility
- ✅ WCAG 2.1 Level AA
- ✅ 44x44pt minimum touch targets
- ✅ Color contrast 4.5:1
- ✅ Screen reader labels

### Performance
- ✅ Cold start < 3s
- ✅ Navigation < 300ms
- ✅ 60 FPS scrolling
- ✅ Bundle < 5MB
- ✅ FlatList for lists > 10 items

## 📋 Pre-Commit Checklist
- [ ] TypeScript compiles (no errors)
- [ ] Tests pass
- [ ] ESLint clean
- [ ] 80% coverage
- [ ] Tested iOS & Android
- [ ] Accessibility labels added
- [ ] Performance benchmarks met

## 🎨 Design System

### Spacing Scale
`4, 8, 12, 16, 24, 32, 48px`

### Touch Targets
**iOS**: 44x44pt minimum  
**Android**: 48x48dp minimum

### Animations
**Duration**: 200-300ms  
**FPS**: 60 (16.67ms/frame)

### Contrast Ratios
**Normal text**: 4.5:1  
**Large text**: 3:1

## 🏗️ Architecture

### State Management
1. **Local**: `useState`, `useReducer`
2. **Shared**: Context API
3. **Global**: Zustand
4. **Server**: React Query

### File Organization
```
feature/
├── components/    # UI components
├── hooks/        # Custom hooks
├── screens/      # Screens
├── types.ts      # Types
├── utils.ts      # Utils
└── api.ts        # API calls
```

## 🧪 Testing

### Coverage Targets
- **Overall**: 80%
- **Critical**: 100% (payments, inventory, tax, auth)

### Test Types
- **Unit**: 70% (pure functions, hooks, utils)
- **Integration**: 20% (component interactions)
- **E2E**: 10% (critical flows)

## ♿ Accessibility Quick Checks

```typescript
// Required for interactive elements
<TouchableOpacity
  accessibilityRole="button"
  accessibilityLabel="Add to cart"
  accessibilityHint="Adds item to shopping cart"
  accessibilityState={{ disabled: false }}
>
```

## 🚨 Common Mistakes to Avoid

❌ Using `any` type  
❌ Using ScrollView for long lists  
❌ Missing accessibility labels  
❌ Inline styles in render  
❌ Not memoizing list items  
❌ Forgetting Android testing  
❌ Color-only indicators  
❌ Small touch targets  

## ✅ Always Remember

1. **Constitution is law** - Never compromise standards
2. **Test on both platforms** - iOS and Android
3. **Accessibility first** - Not an afterthought
4. **Performance matters** - Profile and measure
5. **Type everything** - No `any` types
6. **Document business logic** - Future you will thank you
7. **FlatList for lists** - Never ScrollView for >10 items
8. **80% coverage** - 100% for critical paths

## 🔗 Quick Links

- **Constitution**: `memory/constitution.md`
- **Summary**: `memory/constitution-summary.md`
- **Agent Instructions**: `CLAUDE.md`
- **Spec Kit Guide**: `SPEC-KIT-GUIDE.md`

---

**Print this and keep it visible during development! 📌**

