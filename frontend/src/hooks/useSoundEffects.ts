import { useCallback } from 'react'
import { soundEffects } from '../utils/soundEffects'
import { useUIStore } from '../stores/uiStore'

/**
 * Hook to play sound effects based on user preferences
 */
export const useSoundEffects = () => {
  const soundEffectsEnabled = useUIStore((state) => state.soundEffects)

  const playClick = useCallback(() => {
    console.log('[useSoundEffects] playClick called, enabled:', soundEffectsEnabled)
    if (soundEffectsEnabled) {
      soundEffects.playClick()
    }
  }, [soundEffectsEnabled])

  const playHover = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playHover()
    }
  }, [soundEffectsEnabled])

  const playTabSwitch = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playTabSwitch()
    }
  }, [soundEffectsEnabled])

  const playFileSelect = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playFileSelect()
    }
  }, [soundEffectsEnabled])

  const playSuccess = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playSuccess()
    }
  }, [soundEffectsEnabled])

  const playError = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playError()
    }
  }, [soundEffectsEnabled])

  const playType = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playType()
    }
  }, [soundEffectsEnabled])

  const playNotification = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playNotification()
    }
  }, [soundEffectsEnabled])

  const playMessageReceived = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playMessageReceived()
    }
  }, [soundEffectsEnabled])

  const playToggle = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playToggle()
    }
  }, [soundEffectsEnabled])

  const playStart = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playStart()
    }
  }, [soundEffectsEnabled])

  const playComplete = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playComplete()
    }
  }, [soundEffectsEnabled])

  const playWarning = useCallback(() => {
    if (soundEffectsEnabled) {
      soundEffects.playWarning()
    }
  }, [soundEffectsEnabled])

  return {
    playClick,
    playHover,
    playTabSwitch,
    playFileSelect,
    playSuccess,
    playError,
    playType,
    playNotification,
    playMessageReceived,
    playToggle,
    playStart,
    playComplete,
    playWarning,
    isEnabled: soundEffectsEnabled,
  }
}
