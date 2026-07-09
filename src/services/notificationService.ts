import * as notificationRepo from '../lib/repositories/notification.repository'
import { logError } from '../utils/logger'

export async function fetchNotifications(userId: string): Promise<Record<string, unknown>[] | null> {
  try {
    return await notificationRepo.fetchNotifications(userId)
  } catch (error: any) {
    logError('notificationService.fetchNotifications.error', { message: error.message })
    throw new Error('Unable to load notifications.')
  }
}

export async function markRead(id: string, userId: string): Promise<void> {
  try {
    await notificationRepo.markNotificationRead(id, userId)
  } catch (error: any) {
    logError('notificationService.markRead.error', { message: error.message })
  }
}

export async function markAllRead(userId: string): Promise<void> {
  try {
    await notificationRepo.markAllNotificationsRead(userId)
  } catch (error: any) {
    logError('notificationService.markAllRead.error', { message: error.message })
  }
}

export async function deleteNotification(id: string, userId: string): Promise<void> {
  try {
    await notificationRepo.deleteNotification(id, userId)
  } catch (error: any) {
    logError('notificationService.deleteNotification.error', { message: error.message })
  }
}

export async function clearAll(userId: string): Promise<void> {
  try {
    await notificationRepo.clearAllNotifications(userId)
  } catch (error: any) {
    logError('notificationService.clearAll.error', { message: error.message })
  }
}
