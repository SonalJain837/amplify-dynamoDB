// Optimized messaging service using Amplify GraphQL API
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

let client: ReturnType<typeof generateClient<Schema>> | null = null;

// Initialize client with error handling
const getClient = () => {
  if (!client) {
    try {
      client = generateClient<Schema>();
      
      // Verify the client has the required models
      if (!client || !client.models) {
        console.warn('Amplify client created but models not available yet');
        // Don't throw error immediately, let the calling code handle this
        return client;
      }
      
    } catch (error) {
      console.error('Failed to initialize Amplify client:', error);
      throw new Error('Amplify client initialization failed. Please ensure Amplify is properly configured.');
    }
  }
  return client;
};

export interface ConversationItem {
  conversationId: number | string;
  sender: string;
  senderImageURL: string | null;
  senderGender: string;
  senderUserCode: string | null;
  paidCompanion: boolean;
  confirmationCode: string;
  lastMessage: string;
  sent: string;
}

export interface ConversationMessage {
  message: string;
  sent: string;
  sentBy: string;
}

export interface ConversationsResponse {
  responseStatus: string;
  messages: string[];
  conversations: ConversationItem[];
}

export interface ConversationResponse {
  responseStatus: string;
  messages: string[];
  conversationId: number | string;
  conversationMessages: ConversationMessage[];
}

export interface SendMessageResponse {
  responseStatus: string;
  messages: string[];
  conversationId: number | string;
}

export class AmplifyMessagingService {
  // Enhanced cache for conversations with LRU-like behavior
  private static conversationsCache = new Map<string, { data: ConversationsResponse; timestamp: number; accessCount: number }>();
  private static messageCache = new Map<string, { data: ConversationResponse; timestamp: number; accessCount: number }>();
  private static userDisplayNameCache = new Map<string, { name: string; timestamp: number }>();
  private static CACHE_DURATION = 30000; // 30 seconds
  private static MAX_CACHE_SIZE = 100; // Maximum cache entries
  private static _hasLoggedModelsUnavailable = false;
  private static _pendingRequests = new Map<string, Promise<any>>();
  
  // Helper to create conversation ID from two emails
  private static createConversationId(email1: string, email2: string): string {
    return [email1, email2].sort().join('_').replace(/[@.]/g, '_');
  }

  // Helper to get the other participant email from a conversation
  static async getConversationParticipantEmail(conversationId: string, currentUserEmail: string): Promise<string | null> {
    try {
      const clientInstance = getClient();
      const { data: participants } = await clientInstance.models.ConversationParticipants.list({
        filter: { conversationId: { eq: conversationId } },
      });
      
      const otherParticipant = participants.find(p => p.userEmail !== currentUserEmail);
      return otherParticipant ? otherParticipant.userEmail : null;
    } catch (error) {
      console.error('Error getting conversation participant:', error);
      return null;
    }
  }

  // Helper to format time ago
  private static formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - messageTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  }

  // Optimized helper to get user display name with caching
  private static async getUserDisplayName(email: string): Promise<string> {
    // Check cache first
    const cached = this.userDisplayNameCache.get(email);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.name;
    }

    // Check for pending request to avoid duplicate API calls
    const pendingKey = `user_${email}`;
    if (this._pendingRequests.has(pendingKey)) {
      return this._pendingRequests.get(pendingKey)!;
    }

    const promise = this._fetchUserDisplayName(email);
    this._pendingRequests.set(pendingKey, promise);

    try {
      const name = await promise;
      // Cache the result
      this.userDisplayNameCache.set(email, {
        name,
        timestamp: Date.now()
      });
      
      // Clean cache if it gets too large
      if (this.userDisplayNameCache.size > this.MAX_CACHE_SIZE) {
        const oldestKey = this.userDisplayNameCache.keys().next().value;
        this.userDisplayNameCache.delete(oldestKey);
      }
      
      return name;
    } finally {
      this._pendingRequests.delete(pendingKey);
    }
  }

  private static async _fetchUserDisplayName(email: string): Promise<string> {
    try {
      const clientInstance = getClient();
      const { data: user } = await clientInstance.models.Users.get({ email });
      if (user) {
        return `${user.firstName} ${user.lastName}`.trim();
      }
    } catch (error) {
      console.warn('Error fetching user details:', error);
    }
    return email.split('@')[0]; // Fallback to email username
  }

  // Generate confirmation code
  private static generateConfirmationCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Send a message to a user
  static async sendMessage(
    senderEmail: string,
    receiverEmail: string,
    message: string,
    tripId?: string
  ): Promise<SendMessageResponse> {
    try {
      const clientInstance = getClient();
      
      // Check if models are available before proceeding
      if (!clientInstance || !clientInstance.models || !clientInstance.models.Conversations) {
        // Only log once to avoid console spam
        if (!this._hasLoggedModelsUnavailable) {
          console.warn('Amplify client models not available yet - this is normal during app initialization');
          this._hasLoggedModelsUnavailable = true;
        }
        return {
          responseStatus: 'ERROR',
          messages: ['Messaging service not initialized yet'],
          conversationId: '',
        };
      }

      // Reset the logging flag since models are now available
      this._hasLoggedModelsUnavailable = false;

      const conversationId = this.createConversationId(senderEmail, receiverEmail);
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();

      // Check if conversation exists, create if not (skip if tables don't exist)
      let conversation = null;
      let conversationTablesExist = true;
      
      try {
        if (clientInstance.models.Conversations) {
          const result = await clientInstance.models.Conversations.get({ conversationId });
          conversation = result.data;
        }
      } catch (error) {
        // Check if it's a table not found error
        if (error && typeof error === 'object' && 'errors' in error) {
          const errors = (error as any).errors;
          if (errors && errors.some((e: any) => e.errorType === 'DynamoDB:ResourceNotFoundException')) {
            console.log('Conversation tables do not exist, using Messages-only mode');
            conversationTablesExist = false;
          }
        }
        
        // If conversation tables exist but conversation doesn't, create it
        if (conversationTablesExist) {
          try {
            const createResult = await clientInstance.models.Conversations.create({
              conversationId,
              type: 'direct',
              createdAt: now,
              lastMessageAt: now,
            });
            conversation = createResult.data;

            // Add participants with verification
            const participantResults = await Promise.all([
              clientInstance.models.ConversationParticipants.create({
                conversationId,
                userEmail: senderEmail,
                joinedAt: now,
                role: 'member',
                isActive: true, // Explicitly set isActive since it doesn't have a default
              }),
              clientInstance.models.ConversationParticipants.create({
                conversationId,
                userEmail: receiverEmail,
                joinedAt: now,
                role: 'member',
                isActive: true, // Explicitly set isActive since it doesn't have a default
              }),
            ]);

            // Verify both participants were created successfully
            const senderParticipant = participantResults[0];
            const receiverParticipant = participantResults[1];
            
            if (!senderParticipant.data || !receiverParticipant.data) {
              throw new Error('Failed to create conversation participants');
            }

            console.log('Successfully created conversation participants:', {
              conversationId,
              senderEmail,
              receiverEmail,
              senderParticipantId: senderParticipant.data.userEmail,
              receiverParticipantId: receiverParticipant.data.userEmail
            });
          } catch (createError) {
            console.error('Failed to create conversation or participants:', createError);
            // If conversation table creation fails, continue with messages-only mode
            console.log('Falling back to messages-only mode due to conversation creation failure');
            conversationTablesExist = false;
          }
        }
      }

      // Create message with all required fields
      console.log('Creating message with data:', {
        messageId,
        conversationId,
        senderEmail,
        receiverEmail,
        contentLength: message.length,
        messageType: 'text',
        createdAt: now,
      });

      const messageResult = await clientInstance.models.Messages.create({
        messageId,
        conversationId,
        senderEmail,
        receiverEmail, // Add receiver email to message
        content: message,
        messageType: 'text', // Explicitly set messageType since it doesn't have a default
        createdAt: now,
      });

      if (!messageResult.data) {
        throw new Error('Failed to create message - no data returned from API');
      }

      console.log('Successfully created message:', {
        messageId: messageResult.data.messageId,
        conversationId: messageResult.data.conversationId,
        senderEmail: messageResult.data.senderEmail,
        receiverEmail: messageResult.data.receiverEmail,
      });

      // Update conversation's last message time using the existing conversation data (skip if tables don't exist)
      if (conversation && conversationTablesExist) {
        try {
          // Use the complete conversation object for update to avoid version conflicts
          await clientInstance.models.Conversations.update({
            conversationId: conversation.conversationId,
            lastMessageAt: now,
            // Include other required fields to ensure update compatibility
            type: conversation.type,
            createdAt: conversation.createdAt,
          });
        } catch (updateError) {
          console.warn('Failed to update conversation lastMessageAt, but message was sent:', updateError);
          // Don't fail the entire operation if we can't update the timestamp
        }
      } else if (!conversationTablesExist) {
        console.log('Skipping conversation update - using messages-only mode');
      }

      // Verify the message was created successfully
      const verified = await this.verifyMessageCreation(conversationId, messageId);
      if (!verified) {
        console.error('Message creation verification failed');
        return {
          responseStatus: 'ERROR',
          messages: ['Message was created but could not be verified'],
          conversationId,
        };
      }

      // Clear relevant caches when a new message is sent
      const conversationCacheKey = `conversation_${conversationId}_${senderEmail}`;
      const conversationsCacheKey = `conversations_${senderEmail}`;
      const receiverConversationsCacheKey = `conversations_${receiverEmail}`;
      
      this.messageCache.delete(conversationCacheKey);
      this.conversationsCache.delete(conversationsCacheKey);
      this.conversationsCache.delete(receiverConversationsCacheKey);

      console.log('Message sent and verified successfully:', {
        conversationId,
        messageId,
        senderEmail,
        receiverEmail,
      });

      return {
        responseStatus: 'OK',
        messages: ['Message sent successfully'],
        conversationId,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        responseStatus: 'ERROR',
        messages: ['Failed to send message'],
        conversationId: '',
      };
    }
  }

  // Enhanced cache management methods
  static clearCache(): void {
    this.conversationsCache.clear();
    this.messageCache.clear();
    this.userDisplayNameCache.clear();
    this._pendingRequests.clear();
    console.log('AmplifyMessagingService cache cleared');
  }

  static getCacheStats(): { conversations: number; messages: number; users: number; pending: number } {
    return {
      conversations: this.conversationsCache.size,
      messages: this.messageCache.size,
      users: this.userDisplayNameCache.size,
      pending: this._pendingRequests.size
    };
  }

  // Preload frequently used data
  static async preloadUserData(userEmails: string[]): Promise<void> {
    const promises = userEmails.map(email => this.getUserDisplayName(email));
    await Promise.all(promises);
  }

  // Clear all caches including Amplify internal cache
  static async clearAllCaches(): Promise<void> {
    this.clearCache();
    
    // Reset the client to force fresh initialization
    client = null;
    this._hasLoggedModelsUnavailable = false;
    
    console.log('All caches cleared, client reset');
  }

  // Debug method to check all conversation participants in the database
  static async debugAllParticipants(): Promise<void> {
    try {
      const clientInstance = getClient();
      console.log('=== DEBUG ALL PARTICIPANTS ===');
      
      const { data: allParticipants } = await clientInstance.models.ConversationParticipants.list();
      console.log('Total participants found:', allParticipants.length);
      
      allParticipants.forEach((participant, index) => {
        console.log(`Participant ${index + 1}:`, {
          conversationId: participant.conversationId,
          userEmail: participant.userEmail,
          isActive: participant.isActive,
          joinedAt: participant.joinedAt,
          role: participant.role
        });
      });
      
      const { data: allConversations } = await clientInstance.models.Conversations.list();
      console.log('Total conversations found:', allConversations.length);
      
      allConversations.forEach((conversation, index) => {
        console.log(`Conversation ${index + 1}:`, {
          conversationId: conversation.conversationId,
          type: conversation.type,
          createdAt: conversation.createdAt,
          lastMessageAt: conversation.lastMessageAt
        });
      });
      
      const { data: allMessages } = await clientInstance.models.Messages.list();
      console.log('Total messages found:', allMessages.length);
      
      allMessages.forEach((message, index) => {
        if (message) {
          console.log(`Message ${index + 1}:`, {
            messageId: message.messageId,
            conversationId: message.conversationId,
            senderEmail: message.senderEmail,
            receiverEmail: message.receiverEmail,
            content: message.content?.substring(0, 50) + '...',
            createdAt: message.createdAt
          });
        }
      });
      
    } catch (error) {
      console.error('Error debugging participants:', error);
    }
  }

  // Method to verify message was properly created and is retrievable
  static async verifyMessageCreation(conversationId: string, messageId: string): Promise<boolean> {
    try {
      const clientInstance = getClient();
      
      // Try to get the specific message
      const messageResult = await clientInstance.models.Messages.get({
        conversationId,
        messageId,
      });
      
      if (messageResult.data) {
        console.log('Message verification successful:', {
          messageId: messageResult.data.messageId,
          conversationId: messageResult.data.conversationId,
          senderEmail: messageResult.data.senderEmail,
          receiverEmail: messageResult.data.receiverEmail,
          content: messageResult.data.content,
          createdAt: messageResult.data.createdAt,
        });
        return true;
      } else {
        console.error('Message verification failed: Message not found');
        return false;
      }
    } catch (error) {
      console.error('Message verification error:', error);
      return false;
    }
  }

  // Debug method to test conversation functionality
  static async debugConversation(userEmail1: string, userEmail2: string): Promise<void> {
    try {
      const conversationId = this.createConversationId(userEmail1, userEmail2);
      console.log('=== DEBUG CONVERSATION ===');
      console.log('User Email 1:', userEmail1);
      console.log('User Email 2:', userEmail2);
      console.log('Generated Conversation ID:', conversationId);
      
      const clientInstance = getClient();
      console.log('Client available:', !!clientInstance);
      console.log('Models available:', !!clientInstance?.models);
      console.log('Messages model available:', !!clientInstance?.models?.Messages);
      
      if (clientInstance?.models?.Messages) {
        const { data: messages } = await clientInstance.models.Messages.list({
          filter: {
            conversationId: { eq: conversationId },
            deletedAt: { attributeExists: false },
          },
        });
        console.log('Messages found:', messages.length);
        console.log('Sample messages:', messages.slice(0, 2));
      }
      
      console.log('=== END DEBUG ===');
    } catch (error) {
      console.error('Debug conversation error:', error);
    }
  }

  // Get all conversations for a user
  static async getUserConversations(userEmail: string, useCache = true): Promise<ConversationsResponse> {
    // Check cache first with access tracking
    const cacheKey = `conversations_${userEmail}`;
    if (useCache && this.conversationsCache.has(cacheKey)) {
      const cached = this.conversationsCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        // Update access count for LRU behavior
        cached.accessCount++;
        this.conversationsCache.set(cacheKey, cached);
        console.log('Using cached conversations for', userEmail);
        return cached.data;
      } else {
        // Remove expired cache entry
        this.conversationsCache.delete(cacheKey);
      }
    }

    // Check for pending request to avoid duplicate API calls
    const pendingKey = `conversations_${userEmail}`;
    if (this._pendingRequests.has(pendingKey)) {
      return this._pendingRequests.get(pendingKey)!;
    }

    // Create promise for this request - try conversation tables first, fallback to messages-only
    const promise = this._fetchUserConversationsWithFallback(userEmail, useCache);
    this._pendingRequests.set(pendingKey, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this._pendingRequests.delete(pendingKey);
    }
  }

  // Extract the actual conversation fetching logic with fallback
  private static async _fetchUserConversationsWithFallback(userEmail: string, useCache: boolean): Promise<ConversationsResponse> {
    try {
      // First try the original conversation-table approach
      const originalResult = await this._fetchUserConversations(userEmail, useCache);
      if (originalResult.responseStatus === 'OK') {
        return originalResult;
      }
    } catch (error) {
      console.warn('Conversation tables approach failed, trying Messages-only fallback:', error);
    }

    // Fallback: Reconstruct conversations from Messages table only
    console.log('Using Messages-only fallback for user:', userEmail);
    return this._fetchConversationsFromMessagesOnly(userEmail, useCache);
  }

  // Fallback method: Build conversations from Messages table alone
  private static async _fetchConversationsFromMessagesOnly(userEmail: string, useCache: boolean): Promise<ConversationsResponse> {
    const cacheKey = `conversations_fallback_${userEmail}`;
    
    try {
      const clientInstance = getClient();
      if (!clientInstance.models || !clientInstance.models.Messages) {
        throw new Error('Messages model not available');
      }

      console.log('Fetching messages for user (fallback method):', userEmail);
      
      // Get all messages where user is sender or receiver
      const [sentMessages, receivedMessages] = await Promise.all([
        clientInstance.models.Messages.listUserMessages({ senderEmail: userEmail }),
        clientInstance.models.Messages.listReceivedMessages({ receiverEmail: userEmail })
      ]);

      const allUserMessages = [...(sentMessages.data || []), ...(receivedMessages.data || [])]
        .filter(msg => msg && msg.messageId && msg.senderEmail && msg.receiverEmail && msg.content)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      console.log('Found total user messages (fallback):', allUserMessages.length);

      // Group messages by conversation participants (create conversation ID from emails)
      const conversationMap = new Map<string, { 
        messages: any[], 
        otherUserEmail: string, 
        lastMessage: any 
      }>();

      for (const message of allUserMessages) {
        const otherUserEmail = message.senderEmail === userEmail ? message.receiverEmail : message.senderEmail;
        const conversationId = this.createConversationId(userEmail, otherUserEmail);
        
        if (!conversationMap.has(conversationId)) {
          conversationMap.set(conversationId, {
            messages: [],
            otherUserEmail,
            lastMessage: message
          });
        }
        
        conversationMap.get(conversationId)!.messages.push(message);
        
        // Update last message if this one is newer
        const existing = conversationMap.get(conversationId)!;
        if (new Date(message.createdAt) > new Date(existing.lastMessage.createdAt)) {
          existing.lastMessage = message;
        }
      }

      console.log('Created conversation map (fallback):', conversationMap.size, 'conversations');

      // Convert to ConversationItem format
      const conversations: ConversationItem[] = [];
      for (const [conversationId, convData] of conversationMap.entries()) {
        const senderName = await this.getUserDisplayName(convData.otherUserEmail);
        const lastMessageText = convData.lastMessage.content || 'No messages';
        const lastMessageTime = convData.lastMessage.createdAt;

        conversations.push({
          conversationId,
          sender: senderName,
          senderImageURL: null,
          senderGender: 'U',
          senderUserCode: null,
          paidCompanion: false,
          confirmationCode: this.generateConfirmationCode(),
          lastMessage: lastMessageText,
          sent: this.formatTimeAgo(lastMessageTime),
        });
      }

      // Sort by last message time (most recent first)
      conversations.sort((a, b) => b.conversationId.localeCompare(a.conversationId));

      const result = {
        responseStatus: 'OK',
        messages: ['Conversations fetched successfully (fallback mode)'],
        conversations,
      };

      // Cache the result
      if (useCache) {
        this.conversationsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          accessCount: 1
        });
      }

      console.log('Fallback method returned', conversations.length, 'conversations');
      return result;
    } catch (error) {
      console.error('Error in fallback conversation fetch:', error);
      return {
        responseStatus: 'ERROR',
        messages: ['Failed to load conversations (fallback failed)'],
        conversations: [],
      };
    }
  }

  // Original conversation fetching logic (kept for when tables exist)
  private static async _fetchUserConversations(userEmail: string, useCache: boolean): Promise<ConversationsResponse> {
    const cacheKey = `conversations_${userEmail}`;
    
    try {
      const clientInstance = getClient();
      // Verify client has the required models
      if (!clientInstance.models || !clientInstance.models.ConversationParticipants) {
        throw new Error('ConversationParticipants model not available. Please check your Amplify data schema.');
      }

      // Get user's conversation participations
      // Use regular list query with filter since secondary index might have different syntax
      let participations;
      try {
        console.log('Querying conversation participants for user:', userEmail);
        
        // First try the regular list query with filter
        const result = await clientInstance.models.ConversationParticipants.list({
          filter: { 
            userEmail: { eq: userEmail },
            isActive: { eq: true }
          },
        });
        participations = result.data || [];
        console.log('Found participations with regular query:', participations.length);
        
        // If no results and we want to try secondary index, do it as fallback
        if (participations.length === 0) {
          try {
            console.log('No results from regular query, trying secondary index...');
            const secondaryResult = await clientInstance.models.ConversationParticipants.listUserConversations({
              userEmail: userEmail,
            });
            if (secondaryResult.data && secondaryResult.data.length > 0) {
              participations = secondaryResult.data;
              console.log('Secondary index query found participations:', participations.length);
            }
          } catch (secondaryError) {
            console.warn('Secondary index query also failed:', secondaryError);
            // Keep the empty array from regular query
          }
        }
      } catch (queryError) {
        console.error('Error querying conversation participants:', queryError);
        // If we get a ResourceNotFoundException, this indicates the tables don't exist
        if (queryError && typeof queryError === 'object' && 'errors' in queryError) {
          const errors = (queryError as any).errors;
          if (errors && errors.some((e: any) => e.errorType === 'DynamoDB:ResourceNotFoundException')) {
            throw new Error('ConversationParticipants table does not exist');
          }
        }
        participations = [];
      }

      console.log('Raw participations response:', participations);

      // If no participations found, run debug to see what's in the database
      if (participations.length === 0) {
        console.log('No participations found, running debug...');
        await this.debugAllParticipants();
      }

      const conversations: ConversationItem[] = [];

      // Process each conversation
      for (const participation of participations) {
        const conversationId = participation.conversationId;

        // Get conversation details
        const { data: conversation } = await clientInstance.models.Conversations.get({ conversationId });
        if (!conversation) continue;

        // Get all participants
        const { data: allParticipants } = await clientInstance.models.ConversationParticipants.list({
          filter: { conversationId: { eq: conversationId } },
        });

        // Find the other participant (not the current user)
        const otherParticipant = allParticipants.find(p => p.userEmail !== userEmail);
        if (!otherParticipant) continue;

        // Get user details for the other participant
        const senderName = await this.getUserDisplayName(otherParticipant.userEmail);

        // Get recent messages for this conversation with improved error handling
        let messagesRaw = [];
        try {
          const messageResult = await clientInstance.models.Messages.list({
            filter: {
              conversationId: { eq: conversationId },
              deletedAt: { attributeExists: false },
            },
            limit: 10, // Get more messages to ensure we have the latest
          });
          messagesRaw = messageResult.data || [];
          console.log(`Found ${messagesRaw.length} raw messages for conversation ${conversationId}`);
        } catch (messageError) {
          console.warn(`Error fetching messages for conversation ${conversationId}:`, messageError);
          messagesRaw = [];
        }

        // Filter out any null messages that might exist with detailed logging
        const messages = messagesRaw.filter(message => {
          const isValid = message !== null && 
                         message !== undefined && 
                         message.messageId && 
                         message.senderEmail && 
                         message.receiverEmail && 
                         message.content !== null &&
                         message.content !== undefined;
          
          if (!isValid) {
            console.warn('Filtering out invalid message:', message);
          }
          
          return isValid;
        });

        console.log(`Filtered to ${messages.length} valid messages for conversation ${conversationId}`);

        // Sort messages to get the latest first
        const sortedMessages = messages.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const lastMessage = sortedMessages[0];
        const lastMessageText = lastMessage?.content || 'No messages yet';
        const lastMessageTime = lastMessage?.createdAt || conversation.lastMessageAt || conversation.createdAt;

        conversations.push({
          conversationId,
          sender: senderName,
          senderImageURL: null,
          senderGender: 'U', // Could be enhanced to get from user profile
          senderUserCode: null,
          paidCompanion: false,
          confirmationCode: this.generateConfirmationCode(),
          lastMessage: lastMessageText,
          sent: this.formatTimeAgo(lastMessageTime),
        });
      }

      // Sort conversations by last message time (most recent first)
      conversations.sort((a, b) => {
        // Parse the time ago strings to compare - for now use simple string comparison
        // In a real app, you'd store actual timestamps for better sorting
        return b.conversationId.toString().localeCompare(a.conversationId.toString());
      });

      const result = {
        responseStatus: 'OK',
        messages: ['Conversations fetched successfully'],
        conversations,
      };

      // Cache the result with access tracking
      if (useCache) {
        this.conversationsCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          accessCount: 1
        });
        
        // Clean cache if it gets too large (LRU eviction)
        if (this.conversationsCache.size > this.MAX_CACHE_SIZE) {
          let oldestKey = '';
          let oldestAccess = Infinity;
          
          for (const [key, value] of this.conversationsCache.entries()) {
            if (value.accessCount < oldestAccess) {
              oldestAccess = value.accessCount;
              oldestKey = key;
            }
          }
          
          if (oldestKey) {
            this.conversationsCache.delete(oldestKey);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      
      // If it's a table not found error, let the caller know to try fallback
      if (error instanceof Error && error.message.includes('table does not exist')) {
        throw error;
      }
      
      return {
        responseStatus: 'ERROR',
        messages: ['Failed to load conversations'],
        conversations: [],
      };
    }
  }

  // Get messages for a specific conversation
  static async getConversation(conversationId: number | string, userEmail: string, useCache = true): Promise<ConversationResponse> {
    // Check cache first with access tracking
    const cacheKey = `conversation_${conversationId}_${userEmail}`;
    if (useCache && this.messageCache.has(cacheKey)) {
      const cached = this.messageCache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_DURATION) {
        // Update access count for LRU behavior
        cached.accessCount++;
        this.messageCache.set(cacheKey, cached);
        console.log('Using cached conversation messages for', conversationId);
        return cached.data;
      } else {
        // Remove expired cache entry
        this.messageCache.delete(cacheKey);
      }
    }

    try {
      const clientInstance = getClient();
      
      // Additional check to ensure models are available
      if (!clientInstance || !clientInstance.models || !clientInstance.models.Conversations) {
        // Only log once to avoid console spam
        if (!this._hasLoggedModelsUnavailable) {
          console.warn('Amplify client models not available yet - this is normal during app initialization');
          this._hasLoggedModelsUnavailable = true;
        }
        return {
          responseStatus: 'ERROR',
          messages: ['Messaging service not initialized yet'],
          conversationId,
          conversationMessages: [],
        };
      }

      // Reset the logging flag since models are now available
      this._hasLoggedModelsUnavailable = false;

      // Ensure conversationId is a string for consistency
      const conversationIdStr = conversationId.toString();
      console.log('Fetching conversation with ID:', conversationIdStr);

      // First try to get messages directly - if there are messages, the conversation exists
      const { data: messagesRaw } = await clientInstance.models.Messages.list({
        filter: {
          conversationId: { eq: conversationIdStr },
          deletedAt: { attributeExists: false },
        },
      });

      // Filter out any null messages that might exist
      const messages = messagesRaw.filter(message => 
        message !== null && 
        message !== undefined && 
        message.messageId && 
        message.senderEmail && 
        message.receiverEmail && 
        message.content !== null &&
        message.content !== undefined
      );

      console.log('Found messages for conversation:', messages.length);

      // If no messages found, return empty conversation (valid state for new conversations)
      if (messages.length === 0) {
        return {
          responseStatus: 'OK',
          messages: ['No messages found in conversation'],
          conversationId,
          conversationMessages: [],
        };
      }

      // Sort messages by creation time (oldest first for chat display)
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const conversationMessages: ConversationMessage[] = sortedMessages.map(message => ({
        message: message.content || '',
        sent: this.formatTimeAgo(message.createdAt),
        sentBy: message.senderEmail === userEmail ? 'YOU' : 'THEM',
      }));

      console.log('Processed conversation messages:', conversationMessages.length);

      const result = {
        responseStatus: 'OK',
        messages: ['Conversation fetched successfully'],
        conversationId,
        conversationMessages,
      };

      // Cache the result with access tracking
      if (useCache) {
        this.messageCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          accessCount: 1
        });
        
        // Clean cache if it gets too large (LRU eviction)
        if (this.messageCache.size > this.MAX_CACHE_SIZE) {
          let oldestKey = '';
          let oldestAccess = Infinity;
          
          for (const [key, value] of this.messageCache.entries()) {
            if (value.accessCount < oldestAccess) {
              oldestAccess = value.accessCount;
              oldestKey = key;
            }
          }
          
          if (oldestKey) {
            this.messageCache.delete(oldestKey);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      
      // Check if it's a specific GraphQL error about getConversations
      if (error && typeof error === 'object' && 'errors' in error) {
        console.error('GraphQL errors:', (error as any).errors);
      }
      
      return {
        responseStatus: 'ERROR',
        messages: ['Failed to load conversation messages'],
        conversationId,
        conversationMessages: [],
      };
    }
  }

  // Subscribe to new messages in a conversation (real-time updates)
  static subscribeToConversation(conversationId: string, callback: (message: ConversationMessage) => void) {
    try {
      const clientInstance = getClient();
      const subscription = clientInstance.models.Messages.onCreate({
        filter: { conversationId: { eq: conversationId } }
      }).subscribe({
      next: (data) => {
        callback({
          message: data.content || '',
          sent: this.formatTimeAgo(data.createdAt),
          sentBy: 'THEM', // You'll need to determine this based on current user
        });
      },
      error: (error) => console.error('Subscription error:', error),
    });

    return subscription;
    } catch (error) {
      console.error('Failed to create conversation subscription:', error);
      return {
        unsubscribe: () => {}
      };
    }
  }

  // Subscribe to conversation list changes (real-time updates)
  static subscribeToConversations(userEmail: string, callback: () => void) {
    try {
      const clientInstance = getClient();
      
      // Subscribe to new conversations
      const conversationSub = clientInstance.models.Conversations.onCreate().subscribe({
        next: () => callback(),
        error: (error) => console.error('Conversation subscription error:', error),
      });

      // Subscribe to new messages (to update last message)
      const messageSub = clientInstance.models.Messages.onCreate().subscribe({
        next: () => callback(),
        error: (error) => console.error('Message subscription error:', error),
      });

      return {
        unsubscribe: () => {
          conversationSub.unsubscribe();
          messageSub.unsubscribe();
        }
      };
    } catch (error) {
      console.error('Failed to create conversations subscription:', error);
      return {
        unsubscribe: () => {}
      };
    }
  }
}

// Add debug methods to global window for easy testing
if (typeof window !== 'undefined') {
  (window as any).debugMessaging = {
    debugAllParticipants: () => AmplifyMessagingService.debugAllParticipants(),
    debugConversation: (email1: string, email2: string) => AmplifyMessagingService.debugConversation(email1, email2),
    clearCache: () => AmplifyMessagingService.clearCache(),
  };
}