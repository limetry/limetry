"use client"

/**
 * Animated rotating hero headline and supporting highlight text.
 */

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useRef, useState } from "react"

import { getHeroRotationBatch, HERO_ROTATE_MS } from "@/lib/hero-blurbs"

const EMPHASIS_CLASS =
  "bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent"

const SWIPE_THRESHOLD_PX = 48

/**
 * Cycles 5 blurbs at a time in rotation (2 from top-5, 2 from middle 6-15, 1 from bottom 16-25)
 * with horizontal transitions, swipe, and dot navigation.
 *
 * @returns Animated hero headline block.
 */
export function RotatingHeroBlurb(): React.JSX.Element {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [autoKey, setAutoKey] = useState(0)
  const pointerStartX = useRef<number | null>(null)

  const rotationCycle = Math.floor(index / 5)
  const itemIndex = index % 5

  const activeBatch = useMemo(
    () => getHeroRotationBatch(rotationCycle),
    [rotationCycle],
  )
  const part = activeBatch[itemIndex] ?? activeBatch[0]

  useEffect(() => {
    const timerId = window.setInterval(() => {
      setDirection(1)
      setIndex((current) => current + 1)
    }, HERO_ROTATE_MS)

    return () => {
      window.clearInterval(timerId)
    }
  }, [autoKey])

  const step = (delta: number): void => {
    setDirection(delta)
    setIndex((current) => Math.max(0, current + delta))
    setAutoKey((key) => key + 1)
  }

  return (
    <div
      className="mx-auto max-w-4xl touch-pan-y"
      onPointerDown={(event) => {
        pointerStartX.current = event.clientX
      }}
      onPointerUp={(event) => {
        if (pointerStartX.current == null) {
          return
        }
        const delta = event.clientX - pointerStartX.current
        pointerStartX.current = null
        if (delta <= -SWIPE_THRESHOLD_PX) {
          step(1)
        } else if (delta >= SWIPE_THRESHOLD_PX) {
          step(-1)
        }
      }}
      onPointerCancel={() => {
        pointerStartX.current = null
      }}
    >
      <h1
        aria-live="polite"
        className="min-h-[8.5rem] overflow-hidden text-4xl font-black tracking-tight text-foreground sm:min-h-[7.5rem] sm:text-5xl lg:min-h-[9.5rem] lg:text-6xl"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.span
            key={`${rotationCycle}-${itemIndex}`}
            custom={direction}
            animate={{ opacity: 1, x: 0 }}
            className="block"
            exit={{ opacity: 0, x: direction > 0 ? -28 : 28 }}
            initial={{ opacity: 0, x: direction > 0 ? 28 : -28 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {part.prefix}
            <br />
            <span className={EMPHASIS_CLASS}>{part.emphasis}</span>
          </motion.span>
        </AnimatePresence>
      </h1>

      <motion.p
        key={`highlight-${rotationCycle}-${itemIndex}`}
        animate={{ opacity: 1, x: 0 }}
        className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        {part.highlight}
      </motion.p>

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
              setDirection(dotIndex > itemIndex ? 1 : -1)
              setIndex(rotationCycle * 5 + dotIndex)
              setAutoKey((key) => key + 1)
            }}
          />
        ))}
      </div>
    </div>
  )
}
