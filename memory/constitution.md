# Project Constitution

## Project Overview
This is a React Native Point of Sale (POS) application built with Expo. This constitution defines the non-negotiable standards and principles that guide all development decisions.

## Core Principles

### 1. Code Quality Standards

#### 1.1 TypeScript Requirements
- **Strict Mode**: Always use TypeScript strict mode (`strict: true`)
- **No Implicit Any**: Never use `any` type; use `unknown` with type guards when necessary
- **Complete Type Coverage**: All functions, components, and modules must have explicit types
- **Type Safety**: All API responses, props, and state must have defined interfaces/types
- **No Type Assertions**: Avoid `as` type assertions; use proper type narrowing

#### 1.2 Code Style & Formatting
- **ESLint**: Zero linting errors and warnings allowed in committed code
- **Consistent Formatting**: Use Prettier or consistent manual formatting
- **Naming Conventions**:
  - Components: PascalCase (e.g., `ProductCard.tsx`)
  - Hooks: camelCase with "use" prefix (e.g., `useCart.ts`)
  - Utilities: camelCase (e.g., `formatCurrency.ts`)
  - Constants: UPPER_SNAKE_CASE (e.g., `MAX_ITEMS`)
  - Interfaces/Types: PascalCase with descriptive names
- **File Organization**: One component per file, co-locate related files

#### 1.3 Code Documentation
- **Public APIs**: All exported functions/components must have JSDoc comments
- **Complex Logic**: Document why, not what (code should be self-explanatory for what)
- **Business Rules**: Document business logic and POS-specific rules inline
- **TODOs**: Include ticket references and expected resolution timeline
- **Type Documentation**: Use JSDoc for complex type definitions

#### 1.4 Code Review Standards
- All code must be peer-reviewed before merging
- PRs should be < 400 lines of code when possible
- Self-review checklist completed before requesting review
- All review comments addressed or explicitly deferred with reason

### 2. Testing Standards

#### 2.1 Testing Pyramid
- **Unit Tests**: 70% of test coverage
  - Test pure functions and business logic
  - Test custom hooks in isolation
  - Test utility functions with edge cases
- **Integration Tests**: 20% of test coverage
  - Test component interactions
  - Test state management flows
  - Test data transformations
- **E2E Tests**: 10% of test coverage
  - Test critical user journeys (checkout flow, returns)
  - Test on both iOS and Android

#### 2.2 Coverage Requirements
- **Minimum Coverage**: 80% overall code coverage
- **Critical Paths**: 100% coverage for:
  - Payment processing logic
  - Inventory calculations
  - Tax calculations
  - Currency formatting and math
  - Authentication flows
- **New Features**: Must include tests before PR approval
- **Bug Fixes**: Must include regression tests

#### 2.3 Testing Best Practices
- **Test Behavior, Not Implementation**: Focus on user-facing behavior
- **Arrange-Act-Assert**: Use clear AAA pattern in tests
- **Descriptive Test Names**: Use "should [expected behavior] when [condition]"
- **No Test Interdependencies**: Each test must run independently
- **Mock External Dependencies**: Mock APIs, storage, navigation
- **Test Accessibility**: Include accessibility checks in component tests
- **Performance Tests**: Test list rendering and scroll performance

#### 2.4 Testing Tools
- **Unit/Integration**: Jest + React Native Testing Library
- **E2E**: Detox or Maestro (when needed)
- **Mocking**: Jest mocks for modules, MSW for API mocking
- **Coverage**: Jest coverage reports (aim for 80%+ coverage)

#### 2.5 Test Maintenance
- Tests must pass before any PR can be merged
- Flaky tests must be fixed or removed within 1 sprint
- Update tests when refactoring (tests are living documentation)

### 3. User Experience Consistency

#### 3.1 Design System
- **Color Palette**: Consistent theme with defined primary, secondary, accent colors
  - Support light and dark modes
  - Ensure WCAG AA contrast ratios (4.5:1 for text)
- **Typography Scale**: Defined hierarchy (heading1, heading2, body, caption)
  - Support dynamic type sizing (respect user's font size settings)
- **Spacing System**: Use consistent spacing scale (4, 8, 12, 16, 24, 32, 48px)
- **Component Library**: Reusable components for buttons, inputs, cards, modals

#### 3.2 Interaction Patterns
- **Touch Targets**: Minimum 44x44pt touch targets (iOS HIG guideline)
- **Feedback**: Immediate visual feedback for all user interactions
  - Button press states with opacity or scale animation
  - Loading indicators for async operations (>300ms)
  - Success/error feedback via toast notifications or inline messages
- **Gestures**: Support platform-standard gestures
  - Swipe to delete/archive
  - Pull to refresh on lists
  - Pinch to zoom on images (when applicable)
- **Animations**: Smooth, purposeful animations
  - Duration: 200-300ms for transitions
  - Use Reanimated 2 for complex animations
  - Respect user's "Reduce Motion" preference

#### 3.3 Platform Conventions
- **iOS**:
  - Use iOS-style navigation (back button, swipe from edge)
  - Bottom tab bar for main navigation
  - Action sheets for destructive actions
  - SF Symbols for icons
- **Android**:
  - Material Design principles
  - Floating action buttons for primary actions
  - Bottom navigation or drawer for main navigation
  - Material icons
- **Conditional Rendering**: Use Platform.select() for platform-specific UI

#### 3.4 Layout & Responsiveness
- **Responsive Design**: Support phones (small, large) and tablets
- **Safe Areas**: Respect safe area insets (notches, home indicators)
- **Keyboard Handling**: Proper KeyboardAvoidingView usage
- **Orientation**: Support portrait (primary) and landscape (when applicable)
- **Screen Sizes**: Test on multiple screen sizes (iPhone SE, iPhone 14 Pro Max, Android variants)

#### 3.5 Content Guidelines
- **Microcopy**: Clear, concise, friendly tone
- **Error Messages**: Actionable and empathetic
- **Empty States**: Helpful messaging with clear next steps
- **Loading States**: Show skeleton screens or loading indicators
- **Success Messages**: Positive confirmation of completed actions

### 4. Performance Requirements

#### 4.1 Performance Benchmarks
- **App Launch**: Cold start < 3 seconds, warm start < 1 second
- **Screen Navigation**: Transitions < 300ms
- **List Scrolling**: Maintain 60 FPS (16.67ms per frame)
- **API Response Handling**: Update UI within 100ms of receiving data
- **Bundle Size**: JavaScript bundle < 5MB
- **Memory Usage**: < 150MB RAM under normal operation
- **Battery Impact**: Minimal battery drain (no location tracking unless needed)

#### 4.2 Rendering Performance
- **FlatList/SectionList**: Always use for lists > 10 items (never ScrollView)
- **List Item Optimization**:
  - Use `React.memo` for list item components
  - Implement `keyExtractor` properly
  - Use `getItemLayout` when item heights are fixed
  - Set appropriate `windowSize` and `maxToRenderPerBatch`
- **Re-render Prevention**:
  - Use `React.memo` for expensive components
  - Use `useCallback` for function props passed to memoized components
  - Use `useMemo` for expensive calculations
  - Avoid inline object/array creation in render methods
- **State Updates**: Batch state updates when possible

#### 4.3 Image Optimization
- **Format**: Use WebP when possible, fallback to PNG/JPEG
- **Sizing**: Serve images at appropriate resolution (use @2x, @3x variants)
- **Caching**: Implement image caching (expo-image recommended)
- **Lazy Loading**: Load images as they enter viewport
- **Compression**: Compress images before bundling
- **Icons**: Use vector icons (Expo Icons) not image-based icons

#### 4.4 Bundle Optimization
- **Code Splitting**: Use dynamic imports for rarely-used features
- **Tree Shaking**: Ensure imports don't include unused code
- **Dependencies**: Audit bundle for unnecessary dependencies
- **Native Modules**: Minimize native module count
- **Asset Bundling**: Only bundle assets used in app

#### 4.5 Network Performance
- **API Calls**: Implement request debouncing (300ms for search)
- **Caching**: Cache API responses with appropriate TTL
- **Offline Support**: Cache critical data locally
- **Optimistic Updates**: Update UI immediately, rollback on failure
- **Retry Logic**: Implement exponential backoff for failed requests
- **Compression**: Use gzip/brotli for API responses

#### 4.6 Performance Monitoring
- **Measure**: Use React DevTools Profiler for render performance
- **Monitor**: Track app performance in production (Sentry, Firebase Performance)
- **Baseline**: Establish performance baselines for critical flows
- **Regression Testing**: Automated performance regression checks
- **Device Testing**: Test on low-end devices (3+ years old)

### 5. Architecture Principles

#### 5.1 Component Architecture
- **Functional Components**: Always use function components (no class components)
- **Component Size**: Keep components < 250 lines of code
- **Single Responsibility**: One component, one purpose
- **Presentational vs Container**:
  - Presentational: Stateless, receive data via props
  - Container: Handle business logic, data fetching, state management
- **Composition over Inheritance**: Build complex UIs through composition
- **Prop Drilling Limit**: Max 2 levels; use context/state management beyond that

#### 5.2 State Management
- **Local State First**: Use useState for component-local state
- **Context for Shared State**: Use Context API for low-frequency updates
- **Global State Library**: Use Zustand for complex global state needs
  - Avoid Redux unless absolutely necessary (minimize boilerplate)
- **Server State**: Use React Query/TanStack Query for API state
- **State Collocation**: Keep state as close to where it's used as possible
- **Immutable Updates**: Always update state immutably

#### 5.3 Code Organization
```
feature/
├── components/          # Feature-specific components
│   ├── FeatureCard.tsx
│   └── FeatureList.tsx
├── hooks/              # Feature-specific hooks
│   └── useFeature.ts
├── screens/            # Feature screens (if multiple)
│   └── FeatureDetailScreen.tsx
├── types.ts            # Feature types/interfaces
├── utils.ts            # Feature utilities
├── api.ts              # Feature API calls
└── index.ts            # Public exports
```

#### 5.4 Dependency Management
- **Minimize Dependencies**: Only add dependencies when truly needed
- **Audit New Dependencies**: Check bundle size, maintenance, and security
- **Update Regularly**: Keep dependencies up-to-date for security
- **Peer Dependencies**: Ensure compatibility with React Native version

### 6. Development Workflow

#### 6.1 Git Workflow
- **Branch Naming**: `feature/`, `bugfix/`, `hotfix/` prefixes
- **Commit Messages**: Follow Conventional Commits
  ```
  feat: add product search functionality
  fix: resolve crash on empty cart
  docs: update API documentation
  test: add tests for checkout flow
  refactor: simplify payment processing
  ```
- **PR Requirements**:
  - All tests passing
  - No linting errors
  - Code review approval
  - Updated documentation
  - Tested on both platforms
- **Branch Protection**: Never commit directly to main/master

#### 6.2 Pre-Commit Checklist
- [ ] Code compiles without TypeScript errors
- [ ] All tests pass
- [ ] No ESLint errors or warnings
- [ ] Code is formatted consistently
- [ ] New features have tests
- [ ] Breaking changes documented
- [ ] Tested on iOS and Android

#### 6.3 Testing Workflow
- **Test-Driven Development**: Write tests before implementation for critical features
- **Continuous Integration**: All tests run automatically on PR
- **Manual Testing**: Test on real devices before release
- **Regression Testing**: Run full test suite before each release

### 7. Accessibility Standards (WCAG 2.1 Level AA)

#### 7.1 Screen Reader Support
- **Labels**: All interactive elements must have `accessibilityLabel`
- **Hints**: Provide `accessibilityHint` for non-obvious actions
- **Roles**: Use correct `accessibilityRole` (button, link, header, etc.)
- **States**: Announce states with `accessibilityState` (selected, disabled, etc.)
- **Live Regions**: Use `accessibilityLiveRegion` for dynamic content
- **Testing**: Test with VoiceOver (iOS) and TalkBack (Android)

#### 7.2 Visual Accessibility
- **Color Contrast**: WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
- **Color Independence**: Never use color alone to convey information
- **Text Scaling**: Support Dynamic Type up to 200% scaling
- **Focus Indicators**: Clear visual focus indicators for all interactive elements
- **Animations**: Respect "Reduce Motion" system preference

#### 7.3 Interactive Accessibility
- **Touch Targets**: Minimum 44x44pt (iOS) / 48x48dp (Android)
- **Spacing**: Minimum 8pt between interactive elements
- **Keyboard Navigation**: Support external keyboard navigation
- **Timeout Warnings**: Warn users before session timeouts
- **Error Identification**: Clearly identify and describe errors

#### 7.4 Accessibility Testing
- **Automated**: Use accessibility linter in tests
- **Manual**: Regular testing with assistive technologies
- **User Testing**: Include users with disabilities in testing when possible

### 8. Error Handling & Resilience

#### 8.1 Error Boundaries
- Implement error boundaries at feature level
- Show user-friendly error UI when errors occur
- Log errors to error tracking service (Sentry)
- Provide "retry" or "go back" actions

#### 8.2 Error Messages
- **User-Facing**: Clear, actionable, empathetic language
  - ❌ "Error 500: Internal Server Error"
  - ✅ "We couldn't save your changes. Please try again."
- **Developer Logs**: Detailed technical information for debugging
- **Error Codes**: Consistent error codes for tracking

#### 8.3 Network Resilience
- **Offline Detection**: Detect and inform users when offline
- **Request Retry**: Automatic retry with exponential backoff
- **Timeout Handling**: Reasonable timeouts (5s for API calls)
- **Cache Fallback**: Show cached data when network fails
- **Optimistic UI**: Update UI immediately, rollback on failure

#### 8.4 Data Validation
- **Input Validation**: Validate all user inputs before submission
- **Type Guards**: Use TypeScript type guards for runtime validation
- **Sanitization**: Sanitize inputs to prevent injection attacks
- **Error Recovery**: Gracefully handle invalid data

## Technical Stack

### Core Technologies
- **Framework**: React Native with Expo SDK 50+
- **Language**: TypeScript 5+ (strict mode)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: React Native StyleSheet (primary)
- **State Management**: 
  - Local: useState, useReducer
  - Shared: Context API
  - Global: Zustand (when needed)
  - Server: React Query / TanStack Query
- **UI Components**: Custom component library with theme support

### Development Tools
- **Testing**: 
  - Jest for unit/integration tests
  - React Native Testing Library for component tests
  - Detox/Maestro for E2E (when needed)
- **Linting**: ESLint with TypeScript and React Native plugins
- **Formatting**: Prettier (if adopted)
- **Type Checking**: TypeScript compiler in strict mode
- **Git Hooks**: Husky for pre-commit checks (optional)

### Quality Assurance
- **Error Tracking**: Sentry or similar
- **Analytics**: Firebase Analytics or similar
- **Performance Monitoring**: React DevTools Profiler
- **Code Coverage**: Jest coverage reports (80% target)

## Constraints
- Must work on both iOS and Android
- Should work with Expo Go for development
- Minimize use of native modules to maintain Expo compatibility
- Keep bundle size reasonable for mobile devices
- Support offline functionality where appropriate

## Decision-Making Guidelines

### When Making Technical Decisions
1. **Simplicity First**: Choose the simplest solution that meets requirements
2. **Measure First**: Base decisions on data, not assumptions
3. **User Impact**: Prioritize user experience over developer convenience
4. **Maintainability**: Choose solutions that are easy to maintain long-term
5. **Expo-Compatible**: Prefer Expo-compatible solutions over custom native modules
6. **Community Standards**: Follow React Native community best practices
7. **Progressive Enhancement**: Build core features first, enhance later
8. **Mobile-Native Feel**: Make it feel like a native mobile app, not a web app
9. **Security by Default**: Consider security implications in every decision
10. **Performance Budget**: Every feature must stay within performance budgets

### Trade-off Framework
When faced with competing priorities, prioritize in this order:
1. **Correctness** - Does it work correctly?
2. **Security** - Is it secure?
3. **User Experience** - Is it pleasant to use?
4. **Performance** - Is it fast enough?
5. **Maintainability** - Can we maintain it?
6. **Developer Experience** - Is it easy to work with?

### When to Compromise Standards
Standards may be relaxed when:
- Prototyping or spike work (must be marked and refactored before merge)
- Technical debt is explicitly accepted with a tracking issue
- Emergency hotfixes (must be refactored in follow-up PR)

Standards should NEVER be compromised for:
- Security requirements
- Accessibility requirements (WCAG AA compliance)
- Type safety (no `any` types)
- Test coverage for critical paths (payments, inventory)

## Out of Scope

### Not Supported
- Web support (unless specifically requested)
- Complex native modules requiring custom native code
- Features requiring iOS/Android specific capabilities not available in Expo
- Support for React Native versions older than 0.71
- Support for iOS < 13 or Android < 8

### Explicitly Excluded
- Server-side rendering
- Desktop applications (Windows, macOS, Linux)
- Watch apps or TV apps
- Wearable device support

## Quality Gates

### Code Cannot Be Merged Unless:
- ✅ All tests pass (unit, integration)
- ✅ TypeScript compilation succeeds with no errors
- ✅ ESLint passes with zero errors and warnings
- ✅ Code coverage meets 80% threshold
- ✅ Performance benchmarks are met
- ✅ Accessibility checks pass
- ✅ Tested on both iOS and Android
- ✅ Code review approved by at least one peer
- ✅ PR description includes testing steps
- ✅ Breaking changes are documented

### Pre-Release Checklist
- [ ] All quality gates passed
- [ ] E2E tests pass on real devices
- [ ] Performance profiling completed
- [ ] Accessibility audit completed
- [ ] Security audit completed (for sensitive changes)
- [ ] Release notes prepared
- [ ] Rollback plan documented

## Continuous Improvement

### Regular Reviews
- **Weekly**: Review failed tests and fix flaky tests
- **Monthly**: Review performance metrics and optimization opportunities
- **Quarterly**: Review and update this constitution based on learnings
- **Per Feature**: Retrospective on what went well and what could improve

### Metrics to Track
- Test coverage percentage
- Build time
- App bundle size
- Crash-free rate
- Performance metrics (FPS, load times)
- Accessibility compliance score
- Code review turnaround time

### Learning Culture
- Document learnings from incidents
- Share knowledge through code comments and documentation
- Conduct post-mortems for production issues
- Encourage experimentation in feature branches

---

**Last Updated**: October 16, 2025  
**Version**: 2.0  
**Status**: Active

This constitution is a living document. Propose changes through pull requests with clear rationale.

