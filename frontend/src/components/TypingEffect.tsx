import React, { useState, useEffect } from 'react'

interface TypingEffectProps {
  text: string
  speed?: number
  className?: string
  onComplete?: () => void
}

export const TypingEffect: React.FC<TypingEffectProps> = ({
  text,
  speed = 100,
  className = '',
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    // Cursor blink effect
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    } else if (onComplete) {
      onComplete()
      return undefined
    }
    return undefined
  }, [currentIndex, text, speed, onComplete])

  return (
    <h1 className={className}>
      {displayedText}
      <span
        style={{
          opacity: showCursor ? 1 : 0,
          transition: 'opacity 0.1s',
        }}
      >
        |
      </span>
    </h1>
  )
}
