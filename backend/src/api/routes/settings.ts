import { Router } from 'express'
import { UserSettingsRepository } from '../../storage/repositories/UserSettingsRepository'
import { requireAuth } from '../middleware/supabaseAuth'

const router = Router()
const userSettingsRepo = new UserSettingsRepository()

/**
 * GET /api/settings
 * Get current user's settings
 */
router.get('/settings', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const settings = await userSettingsRepo.getByUserId(userId)

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        userId,
        theme: 'blue',
        crtEffects: true,
        phosphorGlow: true,
        autoScrollChat: true,
        soundEffects: false,
      })
    }

    // Don't send the full API key to the frontend, only indicate if it exists
    const response = {
      ...settings,
      hasApiKey: !!settings.apiKey,
      apiKey: undefined,
    }

    res.json(response)
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/settings/api-key
 * Update user's API key
 */
router.put('/settings/api-key', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id
    const { apiKey } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'Invalid API key' })
    }

    // Basic validation for OpenAI API key format
    if (!apiKey.startsWith('sk-')) {
      return res.status(400).json({ error: 'Invalid OpenAI API key format' })
    }

    await userSettingsRepo.updateApiKey(userId, apiKey)

    res.json({ success: true, message: 'API key saved successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * PUT /api/settings/preferences
 * Update user's UI preferences
 */
router.put('/settings/preferences', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id
    const { theme, crtEffects, phosphorGlow, autoScrollChat, soundEffects } = req.body

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const preferences: Record<string, any> = {}

    if (theme === 'blue' || theme === 'green') preferences.theme = theme
    if (typeof crtEffects === 'boolean') preferences.crtEffects = crtEffects
    if (typeof phosphorGlow === 'boolean') preferences.phosphorGlow = phosphorGlow
    if (typeof autoScrollChat === 'boolean') preferences.autoScrollChat = autoScrollChat
    if (typeof soundEffects === 'boolean') preferences.soundEffects = soundEffects

    await userSettingsRepo.updatePreferences(userId, preferences)

    res.json({ success: true, message: 'Preferences updated successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/settings/api-key
 * Remove user's API key
 */
router.delete('/settings/api-key', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await userSettingsRepo.updateApiKey(userId, '')

    res.json({ success: true, message: 'API key removed successfully' })
  } catch (error) {
    next(error)
  }
})

/**
 * DELETE /api/settings
 * Delete all user settings
 */
router.delete('/settings', requireAuth, async (req, res, next) => {
  try {
    const userId = (req as any).user?.id

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await userSettingsRepo.delete(userId)

    res.json({ success: true, message: 'Settings deleted successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
