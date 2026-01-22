# Constitution Summary

This document summarizes the key standards defined in the project constitution.

## 🎯 Key Standards Overview

### Code Quality (Section 1)
- **TypeScript**: Strict mode, no `any` types, complete type coverage
- **Code Style**: Zero linting errors/warnings, consistent naming conventions
- **Documentation**: JSDoc for public APIs, document business logic
- **Code Review**: All code peer-reviewed, PRs < 400 lines

### Testing Standards (Section 2)
- **Coverage**: 80% overall, 100% for critical paths (payments, inventory, tax)
- **Testing Pyramid**: 70% unit, 20% integration, 10% E2E
- **Tools**: Jest + React Native Testing Library + Detox/Maestro
- **Requirements**: Tests required before PR approval, regression tests for bugs

### User Experience Consistency (Section 3)
- **Design System**: Consistent colors, typography, spacing scale
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Touch Targets**: Minimum 44x44pt (iOS) / 48x48dp (Android)
- **Platform Conventions**: iOS (bottom tabs, swipe) vs Android (Material Design)
- **Animations**: 200-300ms transitions, respect "Reduce Motion"

### Performance Requirements (Section 4)
- **Launch Time**: Cold start < 3s, warm start < 1s
- **Navigation**: Transitions < 300ms
- **Scrolling**: 60 FPS consistently
- **Bundle Size**: < 5MB JavaScript bundle
- **Memory**: < 150MB RAM under normal use
- **Lists**: Always use FlatList for > 10 items, never ScrollView

## 📊 Quality Gates

### Cannot Merge Code Unless:
✅ All tests pass (unit, integration)  
✅ TypeScript compiles with no errors  
✅ ESLint passes (zero errors/warnings)  
✅ 80% code coverage threshold met  
✅ Performance benchmarks met  
✅ Accessibility checks pass  
✅ Tested on both iOS and Android  
✅ Code review approved  
✅ Testing steps documented  
✅ Breaking changes documented  

## 🚨 Non-Negotiable Standards

These standards should NEVER be compromised:
- **Security requirements**
- **Accessibility requirements (WCAG AA)**
- **Type safety (no `any` types)**
- **Test coverage for critical paths** (payments, inventory, tax)

## 🎨 Design System Requirements

### Colors
- Support light and dark modes
- WCAG AA contrast ratios (4.5:1 for text, 3:1 for large text)

### Typography
- Defined hierarchy (heading1, heading2, body, caption)
- Support Dynamic Type up to 200% scaling

### Spacing
- Use consistent scale: 4, 8, 12, 16, 24, 32, 48px

### Components
- Reusable component library
- Theme support built-in

## 🏗️ Architecture Principles

### Component Structure
- Functional components only (no classes)
- < 250 lines per component
- Single responsibility principle
- Composition over inheritance

### State Management
1. **Local State**: useState for component-local state
2. **Shared State**: Context API for low-frequency updates
3. **Global State**: Zustand for complex needs
4. **Server State**: React Query / TanStack Query

### Code Organization
```
feature/
├── components/        # Feature components
├── hooks/            # Feature hooks
├── screens/          # Feature screens
├── types.ts          # Types/interfaces
├── utils.ts          # Utilities
├── api.ts            # API calls
└── index.ts          # Public exports
```

## 🧪 Testing Requirements by Category

### Critical Paths (100% Coverage Required)
- Payment processing logic
- Inventory calculations
- Tax calculations
- Currency formatting and math
- Authentication flows

### Test-Driven Development
Write tests BEFORE implementation for:
- Business logic functions
- Payment/checkout flows
- Inventory management
- Tax calculations

### Testing Best Practices
- Test behavior, not implementation
- Use Arrange-Act-Assert pattern
- Descriptive test names: "should [behavior] when [condition]"
- No test interdependencies
- Mock external dependencies

## ♿ Accessibility Requirements

### Screen Reader Support
- All interactive elements have `accessibilityLabel`
- Provide `accessibilityHint` for non-obvious actions
- Use correct `accessibilityRole`
- Test with VoiceOver (iOS) and TalkBack (Android)

### Visual Accessibility
- Color contrast meets WCAG AA (4.5:1 for text)
- Never use color alone to convey information
- Support text scaling up to 200%
- Clear focus indicators

### Interactive Accessibility
- Touch targets: 44x44pt (iOS) / 48x48dp (Android)
- Minimum 8pt spacing between interactive elements
- Support external keyboard navigation

## 🚀 Performance Benchmarks

| Metric | Target |
|--------|--------|
| Cold start | < 3 seconds |
| Warm start | < 1 second |
| Screen navigation | < 300ms |
| List scrolling | 60 FPS |
| API response handling | < 100ms to update UI |
| Bundle size | < 5MB |
| Memory usage | < 150MB RAM |

## 🔍 Performance Optimization Techniques

### Lists
- Use FlatList/SectionList (not ScrollView)
- Implement proper `keyExtractor`
- Use `getItemLayout` for fixed heights
- Apply `React.memo` to list items

### Re-render Prevention
- Use `React.memo` for expensive components
- Use `useCallback` for function props
- Use `useMemo` for expensive calculations
- Avoid inline object/array creation

### Images
- Use WebP format when possible
- Serve at appropriate resolution (@2x, @3x)
- Implement image caching (expo-image)
- Use vector icons (Expo Icons)

## 📈 Metrics to Track

### Code Quality
- Test coverage percentage
- TypeScript error count
- ESLint error/warning count
- Code review turnaround time

### Performance
- Build time
- App bundle size
- Crash-free rate
- FPS metrics
- Load times

### User Experience
- Accessibility compliance score
- User satisfaction metrics
- Error rates

## 🔄 Trade-off Framework

When faced with competing priorities, prioritize:
1. **Correctness** - Does it work correctly?
2. **Security** - Is it secure?
3. **User Experience** - Is it pleasant to use?
4. **Performance** - Is it fast enough?
5. **Maintainability** - Can we maintain it?
6. **Developer Experience** - Is it easy to work with?

## 📅 Regular Reviews

- **Weekly**: Review and fix flaky tests
- **Monthly**: Review performance metrics
- **Quarterly**: Review and update constitution
- **Per Feature**: Conduct retrospective

---

**Version**: 2.0  
**Last Updated**: October 16, 2025

For complete details, see [`constitution.md`](./constitution.md)

