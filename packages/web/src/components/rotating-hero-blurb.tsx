"use client"

/**
 * Animated rotating hero headline and supporting highlight text.
 */

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

import { getHeroRotationBatch, HERO_ROTATE_MS } from "@/lib/hero-blurbs"

const EMPHASIS_CLASS =
  "bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent"

/**
 * Cycles 5 blurbs at a time in rotation (2 from top-5, 2 from middle 6-15, 1 from bottom 16-25)
 * with Framer Motion transitions and dot navigation.
 *
 * @returns Animated hero headline block.
 */
export function RotatingHeroBlurb(): React.JSX.Element {
  const [rotationCycle, setRotationCycle] = useState(0)
  const [itemIndex, setItemIndex] = useState(0)

  const activeBatch = useMemo(
    () => getHeroRotationBatch(rotationCycle),
    [rotationCycle],
  )
  const part = activeBatch[itemIndex] ?? activeBatch[0]

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setItemIndex((current) => {
        if (current + 1 < activeBatch.length) {
          return current + 1
        }
        setRotationCycle((cycle) => cycle + 1)
        return 0
      })
    }, HERO_ROTATE_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [activeBatch.length])

  return (
    <div className="mx-auto max-w-4xl">
      <h1
        aria-live="polite"
        className="min-h-[2.6em] text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:min-h-[2.2em] lg:text-6xl"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={`${rotationCycle}-${itemIndex}`}
            animate={{ opacity: 1, y: 0 }}
            className="block"
            exit={{ opacity: 0, y: -12 }}
            initial={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {part.prefix}
            <br />
            <span className={EMPHASIS_CLASS}>{part.emphasis}</span>
          </motion.span>
        </AnimatePresence>
      </h1>

      <div className="relative mx-auto mt-6 min-h-[4.5rem] max-w-2xl">
        <AnimatePresence mode="wait">
          <motion.p
            key={`highlight-${rotationCycle}-${itemIndex}`}
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 text-lg leading-relaxed text-muted-foreground"
            exit={{ opacity: 0, y: -8 }}
            initial={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {part.highlight}
          </motion.p>
        </AnimatePresence>
      </div>

      <div
        aria-hidden="true"
        className="mt-8 flex items-center justify-center gap-2"
      >
        {activeBatch.map((entry, dotIndex) => (
          <button
            key={entry.emphasis}
            type="button"
            aria-label={`Show hero message ${dotIndex + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              dotIndex === itemIndex
                ? "w-6 bg-primary"
                : "w-1.5 bg-border hover:bg-muted-foreground/40"
            }`}
            onClick={() => {
              setItemIndex(dotIndex)
            }}
          />
        ))}
      </div>
    </div>
  )
}
