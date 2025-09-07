import { adminDb, adminMessaging } from './firebase-admin'

export class NotificationService {
  static async sendToUser(userId, notification, data = {}) {
    try {
      // Get user's FCM token
      const userDoc = await adminDb.collection('users').doc(userId).get()
      const userData = userDoc.data()
      
      if (!userData?.mobileFcmToken) {
        console.log(`No FCM token found for user ${userId}`)
        return { success: false, reason: 'No FCM token' }
      }

      const message = {
        token: userData.mobileFcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          type: data.type || 'general',
          userId: userId,
          ...data
        },
        android: {
          notification: {
            channelId: this.getChannelId(data.type),
            priority: 'high',
            defaultSound: true,
            defaultVibratePattern: true
          }
        }
      }

      const response = await adminMessaging.send(message)
      console.log('Notification sent successfully:', response)
      
      return { success: true, messageId: response }
    } catch (error) {
      console.error('Error sending notification:', error)
      
      // Handle invalid token
      if (error.code === 'messaging/registration-token-not-registered') {
        await this.clearInvalidToken(userId)
      }
      
      return { success: false, error: error.message }
    }
  }

  static async sendToMultipleUsers(userIds, notification, data = {}) {
    const results = await Promise.allSettled(
      userIds.map(userId => this.sendToUser(userId, notification, data))
    )

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful

    return { successful, failed, total: results.length }
  }

  static async notifyNewPost(postId, authorId, content) {
    try {
      // Get followers of the post author
      const followersQuery = await adminDb
        .collection('follows')
        .where('followingId', '==', authorId)
        .get()

      const followerIds = followersQuery.docs.map(doc => doc.data().followerId)

      if (followerIds.length === 0) {
        return { success: true, sent: 0 }
      }

      const notification = {
        title: 'New Post',
        body: content.length > 100 ? content.substring(0, 100) + '...' : content
      }

      const data = {
        type: 'post',
        postId,
        authorId
      }

      const result = await this.sendToMultipleUsers(followerIds, notification, data)
      return { success: true, sent: result.successful }
    } catch (error) {
      console.error('Error sending new post notifications:', error)
      return { success: false, error: error.message }
    }
  }

  static async notifyNewReaction(postId, reactorId, postAuthorId, reactionType) {
    if (reactorId === postAuthorId) return { success: true, sent: 0 }

    try {
      const notification = {
        title: 'New Reaction',
        body: `Someone reacted ${reactionType} to your post`
      }

      const data = {
        type: 'reaction',
        postId,
        reactorId
      }

      const result = await this.sendToUser(postAuthorId, notification, data)
      return { success: true, sent: result.success ? 1 : 0 }
    } catch (error) {
      console.error('Error sending reaction notification:', error)
      return { success: false, error: error.message }
    }
  }

  static async notifyNewComment(postId, commentId, commenterId, postAuthorId, content) {
    if (commenterId === postAuthorId) return { success: true, sent: 0 }

    try {
      const notification = {
        title: 'New Comment',
        body: content.length > 100 ? content.substring(0, 100) + '...' : content
      }

      const data = {
        type: 'comment',
        postId,
        commentId,
        commenterId
      }

      const result = await this.sendToUser(postAuthorId, notification, data)
      return { success: true, sent: result.success ? 1 : 0 }
    } catch (error) {
      console.error('Error sending comment notification:', error)
      return { success: false, error: error.message }
    }
  }

  static async notifyNewChatMessage(chatId, senderId, recipientIds, messageText) {
    try {
      // Don't notify the sender
      const notifyIds = recipientIds.filter(id => id !== senderId)
      
      if (notifyIds.length === 0) {
        return { success: true, sent: 0 }
      }

      const notification = {
        title: 'New Message',
        body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText
      }

      const data = {
        type: 'chat',
        chatId,
        senderId
      }

      const result = await this.sendToMultipleUsers(notifyIds, notification, data)
      return { success: true, sent: result.successful }
    } catch (error) {
      console.error('Error sending chat notifications:', error)
      return { success: false, error: error.message }
    }
  }

  static async notifyNewAnnouncement(announcementId, title, content) {
    try {
      // Get all users with FCM tokens
      const usersQuery = await adminDb
        .collection('users')
        .where('mobileFcmToken', '!=', null)
        .get()

      const userIds = usersQuery.docs.map(doc => doc.id)

      if (userIds.length === 0) {
        return { success: true, sent: 0 }
      }

      const notification = {
        title: `Announcement: ${title}`,
        body: content.length > 100 ? content.substring(0, 100) + '...' : content
      }

      const data = {
        type: 'announcement',
        announcementId
      }

      const result = await this.sendToMultipleUsers(userIds, notification, data)
      return { success: true, sent: result.successful }
    } catch (error) {
      console.error('Error sending announcement notifications:', error)
      return { success: false, error: error.message }
    }
  }

  static getChannelId(type) {
    switch (type) {
      case 'post':
      case 'reaction':
        return 'olympcom_posts'
      case 'comment':
        return 'olympcom_comments'
      case 'chat':
        return 'olympcom_chat'
      case 'announcement':
        return 'olympcom_announcements'
      default:
        return 'olympcom_general'
    }
  }

  static async clearInvalidToken(userId) {
    try {
      await adminDb.collection('users').doc(userId).update({
        mobileFcmToken: null,
        lastTokenUpdate: new Date()
      })
      console.log(`Cleared invalid FCM token for user ${userId}`)
    } catch (error) {
      console.error('Error clearing invalid token:', error)
    }
  }
}
