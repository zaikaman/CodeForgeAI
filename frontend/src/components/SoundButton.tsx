import React, { ButtonHTMLAttributes } from 'react'
import { useSoundEffects } from '../hooks/useSoundEffects'

interface SoundButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  soundType?: 'click' | 'success' | 'error' | 'toggle' | 'tab' | 'none'
  enableHoverSound?: boolean
}

/**
 * Button component with built-in sound effects
 * Use this instead of regular button for terminal UI consistency
 */
export const SoundButton: React.FC<SoundButtonProps> = ({
  soundType = 'click',
  enableHoverSound = false,
  onClick,
  onMouseEnter,
  children,
  className = '',
  ...props
}) => {
  const { playClick, playSuccess, playError, playToggle, playTabSwitch, playHover } = useSoundEffects()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Play appropriate sound
    switch (soundType) {
      case 'click':
        playClick()
        break
      case 'success':
        playSuccess()
        break
      case 'error':
        playError()
        break
      case 'toggle':
        playToggle()
        break
      case 'tab':
        playTabSwitch()
        break
      case 'none':
        // No sound
        break
    }

    // Call original onClick
    if (onClick) {
      onClick(e)
    }
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableHoverSound) {
      playHover()
    }

    if (onMouseEnter) {
      onMouseEnter(e)
    }
  }

  return (
    <button
      {...props}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </button>
  )
}
