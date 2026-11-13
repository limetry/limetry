import { Image, Text, View, type ImageSourcePropType } from "react-native"

import type { LogoVariant } from "./logo.web"

export type { LogoVariant }

export type LogoProps = {
  /** Native image source for the icon mark. */
  iconSource?: ImageSourcePropType
  /** Native image source for the full product logo. */
  productSource?: ImageSourcePropType
  /** Render only the icon mark. */
  variant?: LogoVariant
  /** NativeWind classes applied to the outer logo. */
  className?: string
  /** Accessible label for the mark. */
  label?: string
}

/** Shared Limetry native logo. */
export function Logo({
  iconSource,
  productSource,
  variant = "wordmark",
  className,
  label = "Limetry",
}: LogoProps): React.JSX.Element {
  if (variant === "product" && productSource) {
    return (
      <Image
        source={productSource}
        accessibilityLabel={label}
        resizeMode="contain"
        className={className ?? "h-7 w-28"}
      />
    )
  }

  return (
    <View
      accessibilityLabel={label}
      className={`flex-row items-center gap-2 ${variant === "mark" ? "h-8 w-8" : "h-8"} ${className ?? ""}`}
    >
      {iconSource ? (
        <Image
          source={iconSource}
          accessibilityLabel={label}
          resizeMode="contain"
          className="h-8 w-8 shrink-0"
        />
      ) : null}
      {variant === "wordmark" ? (
        <Text className="font-sans text-[1.35rem] font-bold tracking-tight text-[#21b263]">
          Limetry
        </Text>
      ) : null}
    </View>
  )
}
