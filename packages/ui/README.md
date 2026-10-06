# `@limetry/ui`

Shared React Native and web UI for Limetry: buttons, form controls, page chrome, navigation helpers, and icons.

## Install

```bash
npm install @limetry/ui react react-native react-native-svg
```

This installs published packages, so npm, Yarn, or pnpm are valid choices.
For a cloned Limetry repository, use the root Yarn Berry workspace instructions
instead of installing from the workspace.

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
