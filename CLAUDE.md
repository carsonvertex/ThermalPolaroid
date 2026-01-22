# AI Agent Instructions for React Native POS

## Project Context
You are working on a React Native Point of Sale (POS) application built with Expo. This project uses the Spec Kit methodology for feature development.

## Core References
Before implementing any feature, ALWAYS refer to:
1. **Constitution** (`memory/constitution.md`) - **NON-NEGOTIABLE** standards and principles
   - See `memory/constitution-summary.md` for quick reference
2. **Feature Specification** (in `specs/[feature-number]/spec.md`) - Detailed requirements
3. **Implementation Plan** (in `specs/[feature-number]/plan.md`) - Technical approach
4. **Task Breakdown** (in `specs/[feature-number]/tasks.md`) - Step-by-step tasks

### Constitution is Law
The constitution defines non-negotiable standards:
- **Code Quality**: TypeScript strict mode, zero linting errors, complete type coverage
- **Testing**: 80% coverage minimum, 100% for critical paths
- **User Experience**: WCAG AA accessibility, consistent design system
- **Performance**: Specific benchmarks (< 3s cold start, 60 FPS scrolling, < 5MB bundle)

**NEVER compromise these standards** unless explicitly approved with documented rationale.

## Workflow

### Planning Phase
1. Read and understand the feature specification
2. Review the constitution to ensure alignment
3. Create a detailed implementation plan
4. Generate task breakdown with dependencies
5. Validate the plan before implementation

### Implementation Phase
1. Follow the task breakdown sequentially
2. Respect task dependencies
3. Implement tests before code (when specified)
4. Run linting after each significant change
5. Test on both platforms (iOS/Android) where possible
6. Update documentation as needed

## React Native Specific Guidelines

### Component Development
- Use functional components with TypeScript
- Properly type all props and state
- Use React Hooks appropriately (useState, useEffect, etc.)
- Implement proper cleanup in useEffect
- Keep components focused and reusable

### Styling
- **NativeWind (Tailwind CSS)**: Primary styling approach for layout and utilities
- **Gluestack UI**: Use for complex, accessible components (forms, modals, toasts)
- **Custom Components**: Use NativeWind + CVA for custom UI components
- Create consistent design tokens/theme
- Use responsive units where appropriate
- Test layouts on different screen sizes

**Styling Priority:**
1. **Gluestack UI** - For all UI components (Button, Input, Card, Modal, Toast, etc.)
2. **NativeWind** - For layout, positioning, and utility styling
3. **Custom Components** - Only for project-specific business logic components

### Navigation
- Use Expo Router (file-based routing)
- Follow the established navigation patterns in `app/` directory
- Use proper TypeScript types for navigation params

### State Management
- Start with React Context for simple state
- Use local state when state is component-specific
- Consider Zustand or Redux only for complex global state
- Avoid prop drilling through proper state placement

### Performance
- Use React.memo for expensive components
- Use useCallback and useMemo appropriately
- Implement FlatList for long lists (not ScrollView)
- Optimize images with proper dimensions and formats

### Error Handling
- Implement error boundaries for critical sections
- Provide user-friendly error messages
- Log errors for debugging
- Handle async errors properly (try/catch or .catch())

## Commands and Tools

### Available Spec Kit Commands
- `/speckit.plan` - Generate implementation plan from spec
- `/speckit.tasks` - Generate task breakdown from plan
- `/speckit.implement` - Execute implementation following tasks

### Development Commands
```bash
# Start development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run linting
npm run lint

# Run tests (if configured)
npm test
```

## File Organization
```
react-native-pos/
├── app/                    # Expo Router screens
├── components/             # Reusable UI components
│   ├── ui/                # Base UI components (NativeWind + CVA)
│   └── shared/            # Shared components (search, filters, etc.)
├── lib/                    # Core libraries
│   ├── database/          # SQLite layer (repositories, migrations)
│   ├── api/               # API client and endpoints
│   ├── hooks/             # Custom React hooks
│   ├── stores/            # Zustand stores (auth, cart, ui, app)
│   ├── gluestack-ui/      # Gluestack UI config and components
│   └── utils/             # Utility functions
├── constants/              # App constants and theme
├── memory/                 # Spec Kit: Project memory
├── specs/                  # Spec Kit: Feature specifications
├── scripts/                # Build and utility scripts
├── templates/              # Spec Kit: Document templates
├── assets/                 # Images, fonts, etc.
└── CLAUDE.md               # This file
```

## Implementation Checklist
For each task:
- [ ] Read the task description and acceptance criteria
- [ ] **Verify alignment with constitution standards**
- [ ] Check dependencies are complete
- [ ] Review relevant files
- [ ] Implement the solution following constitution principles
- [ ] Verify TypeScript types are correct (strict mode, no `any`)
- [ ] Write/update tests (80% coverage target, 100% for critical paths)
- [ ] Run linting and fix any issues (zero errors/warnings)
- [ ] Test accessibility features (screen reader, touch targets)
- [ ] Test on both iOS and Android
- [ ] Check performance benchmarks (60 FPS, bundle size)
- [ ] Test the functionality manually
- [ ] Update documentation if needed
- [ ] Mark task as complete

### Quality Gates (Must Pass)
Before considering a task complete:
- ✅ TypeScript compiles with no errors (strict mode)
- ✅ ESLint passes with zero errors and warnings
- ✅ Tests pass and coverage meets threshold
- ✅ Performance benchmarks met
- ✅ Accessibility requirements met
- ✅ Works on both iOS and Android

## Common Pitfalls to Avoid
- ❌ Using web-only APIs (use React Native equivalents)
- ❌ Forgetting to handle Android and iOS differences
- ❌ Not handling keyboard dismissal properly
- ❌ Ignoring TypeScript errors
- ❌ Creating deeply nested navigation
- ❌ Overusing inline styles (use StyleSheet)
- ❌ Not testing on both platforms
- ❌ Hardcoding values that should be configurable
- ❌ Forgetting to handle loading and error states
- ❌ Not optimizing list rendering

## Testing Strategy
- **Manual Testing**: Test on iOS and Android simulators/devices
- **Type Safety**: Leverage TypeScript for compile-time checks
- **Linting**: Run ESLint before committing
- **Unit Tests**: Write tests for business logic (when applicable)
- **Integration Tests**: Test critical user flows (when applicable)

## Component Libraries

### Gluestack UI
- **Location**: `lib/gluestack-ui/`
- **Usage**: Import from `@/lib/gluestack-ui/components`
- **Best for**: Complex components (forms, modals, cards, avatars, toasts)
- **Documentation**: See `GLUESTACK-UI-SETUP.md`
- **Components**: Box, Button, Input, Card, Modal, Toast, Avatar, Badge, etc.

### NativeWind (Styling Only)
- **Usage**: For layout, positioning, and utility classes
- **Styling**: Tailwind CSS classes
- **Best for**: Container styling, spacing, colors, responsive design

### Shared Components
- **Location**: `components/shared/`
- **Usage**: Import from `@/components/shared`
- **Best for**: Reusable UI patterns
- **Components**: Header, SearchBar, FilterBar, EmptyState, ErrorBoundary, LoadingSkeleton

## When in Doubt
1. **ALWAYS** refer to the constitution (`memory/constitution.md`) first
2. Check constitution summary (`memory/constitution-summary.md`) for quick reference
3. Verify against quality gates and non-negotiable standards
4. Check Expo documentation: https://docs.expo.dev/
5. Check React Native documentation: https://reactnative.dev/
6. Check Gluestack UI documentation: https://gluestack.io/ui/docs
7. Follow the existing code patterns in the project
8. Ask for clarification if requirements are unclear

## Success Criteria
A task is complete ONLY when ALL of the following are met:

### Functionality
- ✅ Code is implemented according to specification
- ✅ Works correctly on both iOS and Android
- ✅ Edge cases are handled
- ✅ Error states are handled gracefully

### Code Quality
- ✅ TypeScript strict mode (no `any` types)
- ✅ Zero ESLint errors and warnings
- ✅ Code is properly documented (JSDoc for public APIs)
- ✅ Follows naming conventions
- ✅ Components < 250 lines of code

### Testing
- ✅ Tests written and passing
- ✅ 80% code coverage (100% for critical paths)
- ✅ Accessibility tests included
- ✅ Manual testing completed on both platforms

### Performance
- ✅ Performance benchmarks met
- ✅ No unnecessary re-renders
- ✅ Images optimized
- ✅ Lists use FlatList (not ScrollView)

### Accessibility
- ✅ All interactive elements have accessibility labels
- ✅ Touch targets meet minimum size (44x44pt)
- ✅ Color contrast meets WCAG AA
- ✅ Tested with screen reader

### Documentation
- ✅ Code comments for complex logic
- ✅ Documentation updated (if applicable)
- ✅ Breaking changes documented

