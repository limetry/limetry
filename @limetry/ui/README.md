[**Limetry v1.2.55**](../../README.md)

***

[Limetry](../../README.md) / @limetry/ui

# `@limetry/ui`

Shared React Native and web UI for Limetry: buttons, form controls, page chrome, navigation helpers, and icons.

## Install

```bash
npm install @limetry/ui react react-native react-native-svg
```

Use the package manager you prefer; the equivalent Yarn or pnpm command works
the same way.

Peers are `react` 18 or newer, `react-native` 0.73 or newer, and `react-native-svg` 15 or newer. Styles use NativeWind.

## Use a component

```tsx
import { Button, Card, PageHeader } from "@limetry/ui"

export function Approvals() {
  return (
    <Card>
      <PageHeader title="Approvals" />
      <Button>Review</Button>
    </Card>
  )
}
```

Subpath exports:

- `@limetry/ui/drawer` for the drawer menu
- `@limetry/ui/tailwind` for the shared Tailwind config
- `@limetry/ui/global.css` for the global stylesheet

## License

MIT

Shared NativeWind / React Native UI primitives for Limetry web and Expo apps
(`\@limetry/ui`).

Re-exports buttons, form controls, layout chrome, navigation helpers, and
platform-resolved Lucide icon wrappers used by `\@limetry/web` and the Expo app.

## Type Aliases

- [NavItem](type-aliases/NavItem.md)

## Functions

- [AlertBanner](functions/AlertBanner.md)
- [Badge](functions/Badge.md)
- [Button](functions/Button.md)
- [Card](functions/Card.md)
- [CardHeader](functions/CardHeader.md)
- [ChartIcon](functions/ChartIcon.md)
- [cn](functions/cn.md)
- [EmptyState](functions/EmptyState.md)
- [findActiveNavHref](functions/findActiveNavHref.md)
- [FormSection](functions/FormSection.md)
- [HomeIcon](functions/HomeIcon.md)
- [Input](functions/Input.md)
- [isHighlightedNavItem](functions/isHighlightedNavItem.md)
- [isItemHighlighted](functions/isItemHighlighted.md)
- [isNavItemActive](functions/isNavItemActive.md)
- [isNavItemOrChildActive](functions/isNavItemOrChildActive.md)
- [KeyIcon](functions/KeyIcon.md)
- [MenuIcon](functions/MenuIcon.md)
- [normalizePathname](functions/normalizePathname.md)
- [PageHeader](functions/PageHeader.md)
- [RulesIcon](functions/RulesIcon.md)
- [ShieldIcon](functions/ShieldIcon.md)
- [StatCard](functions/StatCard.md)
- [TerminalIcon](functions/TerminalIcon.md)
- [TextArea](functions/TextArea.md)
- [UserIcon](functions/UserIcon.md)
- [XIcon](functions/XIcon.md)
