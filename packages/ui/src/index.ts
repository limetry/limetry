/// <reference types="react-native-css-interop/types" />

/**
 * Shared NativeWind / React Native UI primitives for Limetry web and Expo apps
 * (`\@limetry/ui`).
 *
 * Re-exports buttons, form controls, layout chrome, navigation helpers, and
 * platform-resolved Lucide icon wrappers used by `\@limetry/web` and the Expo app.
 *
 * @packageDocumentation
 */

export { Badge } from "./components/badge"
export { Button } from "./components/button"
export { Card, CardHeader } from "./components/card"
export {
  ChartIcon,
  HomeIcon,
  KeyIcon,
  MenuIcon,
  RulesIcon,
  ShieldIcon,
  TerminalIcon,
  UserIcon,
  XIcon,
} from "./components/icons"
export { FormSection, Input, TextArea } from "./components/input"
export { AlertBanner, EmptyState, PageHeader } from "./components/page-header"
export { StatCard } from "./components/stat-card"
export { cn } from "./lib/cn"
export {
  findActiveNavHref,
  isHighlightedNavItem,
  isItemHighlighted,
  isNavItemActive,
  isNavItemOrChildActive,
  type NavItem,
  normalizePathname,
} from "./navigation/types"
