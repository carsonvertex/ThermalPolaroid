// Shared Components
export { Header } from './header';
export type { HeaderProps } from './header';

export { MainNav } from './main-nav';

export { StatusIndicator, SyncStatusIndicator } from './status-indicator';
export type { StatusIndicatorProps, StatusType, SyncStatusIndicatorProps } from './status-indicator';

export { SearchBar } from './search-bar';
export type { SearchBarProps } from './search-bar';

export { FilterBar } from './filter-bar';
export type { FilterBarProps, FilterOption } from './filter-bar';

export { EmptyState } from './empty-state';
export type { EmptyStateProps } from './empty-state';

export { ErrorBoundary } from './error-boundary';

export { CardSkeleton, ListItemSkeleton, ProductCardSkeleton, Skeleton } from './loading-skeleton';
export type { SkeletonProps } from './loading-skeleton';

export { ExternalLink } from './external-link';

export { default as AppSnackbar } from './app-snackbar';

export { PrintReceipt } from './print-receipt';
export type { FinancialSummary, PrintReceiptProps } from './print-receipt';

export { default as DeviceRegistrationModal } from './device-registration-modal';
export type { default as DeviceRegistrationModalProps } from './device-registration-modal';
