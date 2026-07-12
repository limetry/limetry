/**
 * MDX component map for fumadocs pages, including Mintlify-style callout aliases.
 */

import { Callout } from "fumadocs-ui/components/callout"
import { Step as FumaStep, Steps } from "fumadocs-ui/components/steps"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { ComponentProps, ReactNode } from "react"

type CalloutType = NonNullable<ComponentProps<typeof Callout>["type"]>

/**
 * Props for Mintlify-compatible callout aliases.
 */
interface MintlifyCalloutProps {
  children?: ReactNode
  title?: ReactNode
}

/**
 * Props for Mintlify-compatible step wrappers.
 */
interface MintlifyStepProps {
  children?: ReactNode
  title?: ReactNode
}

/**
 * Factory for Mintlify callout names mapped onto fumadocs `Callout` types.
 *
 * @param type - Fumadocs callout type.
 * @returns React component accepting {@link MintlifyCalloutProps}.
 */
function mintlifyCallout(type: CalloutType) {
  function MintlifyCallout({
    children,
    title,
  }: MintlifyCalloutProps): React.JSX.Element {
    return (
      <Callout type={type} title={title}>
        {children}
      </Callout>
    )
  }

  return MintlifyCallout
}

/**
 * Step wrapper that renders an optional title heading inside fumadocs `Step`.
 *
 * @param props - Step title and children.
 * @returns Step element.
 */
function Step({ title, children }: MintlifyStepProps): React.JSX.Element {
  return (
    <FumaStep>
      {title ? <h3>{title}</h3> : null}
      {children}
    </FumaStep>
  )
}

/**
 * Fumadocs MDX components plus Mintlify callout, card, and step aliases.
 */
export const docsMdxComponents = {
  ...defaultMdxComponents,
  Note: mintlifyCallout("info"),
  Info: mintlifyCallout("info"),
  Tip: mintlifyCallout("idea"),
  Warning: mintlifyCallout("warn"),
  Danger: mintlifyCallout("error"),
  Check: mintlifyCallout("success"),
  CardGroup: defaultMdxComponents.Cards,
  Steps,
  Step,
}
