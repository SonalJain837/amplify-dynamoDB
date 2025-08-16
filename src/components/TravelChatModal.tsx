import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import { AmplifyMessagingService } from '../services/amplifyMessagingService';

interface TravelerData {
  userEmail: string;
  ownerName?: string;
  firstName?: string;
  lastName?: string;
  from?: string;
  to?: string;
  date?: string;
  flight?: string;
  tripId?: string;
}

interface ChatMessage {
  message: string;
  sent: string;
  sentBy: string;
  id?: string;
  status?: 'sending' | 'sent' | 'failed';
}

interface TravelChatModalProps {
  open: boolean;
  onClose: () => void;
  travelerData: TravelerData | null;
  currentUserEmail: string;
  onMessageSent?: (success: boolean, message: string) => void;
}

const TravelChatModal: React.FC<TravelChatModalProps> = ({
  open,
  onClose,
  travelerData,
  currentUserEmail,
  onMessageSent,
}) => {
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingPreviousChats, setLoadingPreviousChats] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Get display name from traveler data
  const getDisplayName = (): string => {
    if (travelerData?.firstName && travelerData?.lastName) {
      return `${travelerData.firstName} ${travelerData.lastName}`;
    }
    if (travelerData?.ownerName) {
      return travelerData.ownerName;
    }
    if (travelerData?.userEmail) {
      return travelerData.userEmail.split('@')[0];
    }
    return 'Traveler';
  };

  // Helper to format time ago
  const formatTimeAgo = (timestamp: string): string => {
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
  };

  // Helper to create conversation ID from two emails (same logic as in AmplifyMessagingService)
  const createConversationId = (email1: string, email2: string): string => {
    return [email1, email2].sort().join('_').replace(/[@.]/g, '_');
  };

  // Load previous chat history when modal opens
  const loadPreviousChats = async (currentRetryCount = 0) => {
    if (!travelerData || !currentUserEmail || !open) return;

    const MAX_RETRY_ATTEMPTS = 3;
    const RETRY_DELAY = 2000;

    setLoadingPreviousChats(true);
    setError(null);

    try {
      // Create conversation ID using the same logic as the messaging service
      const conversationId = createConversationId(currentUserEmail, travelerData.userEmail);
      console.log('TravelChatModal: Loading conversation with ID:', conversationId);
      
      // If this is a retry due to GraphQL errors, clear caches first
      if (currentRetryCount > 0) {
        await AmplifyMessagingService.clearAllCaches();
      }
      
      
      // Try to get existing conversation messages
      const response = await AmplifyMessagingService.getConversation(conversationId, currentUserEmail, currentRetryCount === 0);
      
      console.log('TravelChatModal: Conversation response:', response);
      
      if (response.responseStatus === 'OK') {
        if (response.conversationMessages.length > 0) {
          // Convert conversation messages to chat messages format
          const previousMessages: ChatMessage[] = response.conversationMessages.map(msg => ({
            message: msg.message,
            sent: msg.sent,
            sentBy: msg.sentBy,
            status: 'sent' as const
          }));
          
          console.log('TravelChatModal: Loaded previous messages:', previousMessages.length);
          setChatMessages(previousMessages);
        } else {
          console.log('TravelChatModal: No previous messages found, starting fresh conversation');
          setChatMessages([]);
        }
        setRetryAttempts(0); // Reset retry count on success
      } else if (response.responseStatus === 'ERROR' && 
                 response.messages.includes('Messaging service not initialized yet') &&
                 currentRetryCount < MAX_RETRY_ATTEMPTS) {
        
        // Amplify client not ready yet, retry with exponential backoff
        const nextRetryCount = currentRetryCount + 1;
        setRetryAttempts(nextRetryCount);
        console.log(`Amplify client not ready, retry attempt ${nextRetryCount}/${MAX_RETRY_ATTEMPTS} in ${RETRY_DELAY}ms...`);
        
        setTimeout(() => {
          if (open && travelerData && currentUserEmail) {
            loadPreviousChats(nextRetryCount);
          }
        }, RETRY_DELAY * nextRetryCount); // Exponential backoff
        return; // Don't set loading to false yet
      } else {
        // Error occurred but not initialization - start fresh
        console.log('TravelChatModal: Error loading chat history, starting fresh:', response.messages);
        setChatMessages([]);
        setRetryAttempts(0);
      }
    } catch (error) {
      console.error('TravelChatModal: Error loading previous chats:', error);
      
      // Check if it's an Amplify initialization error and we haven't exceeded retry limit
      if (error instanceof Error && 
          (error.message.includes('Cannot read properties of undefined') ||
           error.message.includes('getConversations') ||
           error.message.includes('GraphQL')) &&
          currentRetryCount < MAX_RETRY_ATTEMPTS) {
        
        const nextRetryCount = currentRetryCount + 1;
        setRetryAttempts(nextRetryCount);
        console.log(`Amplify GraphQL/initialization issue, retry attempt ${nextRetryCount}/${MAX_RETRY_ATTEMPTS}...`);
        
        setTimeout(() => {
          if (open && travelerData && currentUserEmail) {
            loadPreviousChats(nextRetryCount);
          }
        }, RETRY_DELAY * nextRetryCount);
        return;
      } else {
        // Max retries reached or different error - start fresh
        if (currentRetryCount >= MAX_RETRY_ATTEMPTS) {
          console.log('Max retry attempts reached due to errors. Starting fresh conversation.');
        }
        setChatMessages([]);
        setRetryAttempts(0);
      }
    } finally {
      setLoadingPreviousChats(false);
    }
  };

  // Load previous chats when modal opens or traveler data changes
  useEffect(() => {
    if (open && travelerData && currentUserEmail) {
      setRetryAttempts(0); // Reset retry count when modal opens
      loadPreviousChats(0); // Start with 0 retry attempts
    }
  }, [open, travelerData?.userEmail, currentUserEmail]);

  // Handle closing the modal
  const handleClose = () => {
    setMessageContent('');
    setChatMessages([]);
    setError(null);
    setRetryAttempts(0);
    setLoadingPreviousChats(false);
    onClose();
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !travelerData || !currentUserEmail || sendingMessage) return;

    const messageContentToSend = messageContent.trim();
    const tempId = `temp_${Date.now()}`;
    setMessageContent('');
    setSendingMessage(true);
    setError(null);

    try {
      // Optimistically add the message to the UI with sending status
      const newMsg: ChatMessage = {
        message: messageContentToSend,
        sent: 'Sending...',
        sentBy: 'YOU',
        id: tempId,
        status: 'sending'
      };
      setChatMessages(prev => [...prev, newMsg]);

      const response = await AmplifyMessagingService.sendMessage(
        currentUserEmail,
        travelerData.userEmail,
        messageContentToSend,
        travelerData.tripId
      );
      
      if (response.responseStatus === 'OK') {
        // Update message status to sent with proper timestamp
        setChatMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, sent: formatTimeAgo(new Date().toISOString()), status: 'sent' }
            : msg
        ));
        onMessageSent?.(true, 'Message sent successfully!');
        
        // Optionally refresh the conversation to get the latest state
        // This ensures we have the server's version of the message
        try {
          const conversationId = createConversationId(currentUserEmail, travelerData.userEmail);
          const updatedResponse = await AmplifyMessagingService.getConversation(conversationId, currentUserEmail, false);
          if (updatedResponse.responseStatus === 'OK') {
            const updatedMessages: ChatMessage[] = updatedResponse.conversationMessages.map(msg => ({
              message: msg.message,
              sent: msg.sent,
              sentBy: msg.sentBy,
              status: 'sent' as const
            }));
            setChatMessages(updatedMessages);
          }
        } catch (refreshError) {
          console.warn('Could not refresh conversation after sending message:', refreshError);
          // Don't fail the operation - the optimistic update already worked
        }
      } else {
        // Update message status to failed
        setChatMessages(prev => prev.map(msg => 
          msg.id === tempId 
            ? { ...msg, sent: 'Failed to send', status: 'failed' }
            : msg
        ));
        
        // Provide more specific error message if it's an initialization issue
        const errorMessage = response.messages.includes('not initialized') 
          ? 'Messaging service is starting up. Please try again in a moment.'
          : 'Failed to send message. Please try again.';
          
        setError(errorMessage);
        onMessageSent?.(false, errorMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to failed
      setChatMessages(prev => prev.map(msg => 
        (msg as any).id === tempId
          ? { ...msg, sent: 'Failed to send', status: 'failed' }
          : msg
      ));
      setError('Failed to send message. Please try again.');
      onMessageSent?.(false, 'Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Enter key press for message input
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!travelerData) return null;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: { xs: '100vh', sm: '85vh' },
          maxHeight: { xs: '100vh', sm: '85vh' },
          margin: { xs: 0, sm: '32px' },
          borderRadius: { xs: 0, sm: 2 },
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      {/* Header */}
      <DialogTitle sx={{ 
        px: 3, 
        py: 2, 
        borderBottom: 1, 
        borderColor: 'divider',
        backgroundColor: '#fafafa',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: '#f59e0b', 
              color: 'white',
              width: 40,
              height: 40,
              fontWeight: 600
            }}>
              {travelerData.ownerName?.charAt(0).toUpperCase() || 'T'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#1f2937' }}>
                Chat with {travelerData.ownerName || 'Traveler'}
              </Typography>
            </Box>
          </Box>
          <IconButton 
            onClick={handleClose}
            sx={{ 
              color: '#6b7280',
              '&:hover': { 
                backgroundColor: '#f3f4f6',
                color: '#374151'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ m: 2, mb: 0 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Messages Area */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto', 
          p: 3, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          backgroundColor: '#f9fafb',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#f1f5f9',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#cbd5e1',
            borderRadius: '3px',
            '&:hover': {
              backgroundColor: '#94a3b8',
            }
          }
        }}>
          {loadingPreviousChats ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              flex: 1,
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress size={32} sx={{ color: '#f59e0b' }} />
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {retryAttempts > 0 
                  ? `Connecting to messaging service... (attempt ${retryAttempts}/3)`
                  : 'Loading previous messages...'}
              </Typography>
            </Box>
          ) : chatMessages.length === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              flex: 1,
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                {error && error.includes('not initialized') 
                  ? 'Connecting to messaging service...' 
                  : 'No previous messages found'}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                Start a conversation with this traveler to discuss your travel plans
              </Typography>
            </Box>
          ) : (
            chatMessages.map((message, index) => {
              const isYou = message.sentBy === 'YOU';
              
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: isYou ? 'flex-end' : 'flex-start',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: { xs: '85%', sm: '70%' },
                      p: 2,
                      borderRadius: isYou ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      backgroundColor: isYou ? '#f59e0b' : 'white',
                      color: isYou ? 'white' : '#1f2937',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: isYou ? 'none' : '1px solid #e5e7eb',
                      position: 'relative'
                    }}
                  >
                    <Typography variant="body2" sx={{ 
                      lineHeight: 1.4,
                      fontSize: '0.9rem',
                      wordBreak: 'break-word'
                    }}>
                      {message.message}
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'flex-end',
                      gap: 1,
                      mt: 0.5 
                    }}>
                      <Typography variant="caption" sx={{ 
                        opacity: 0.8, 
                        fontSize: '0.7rem',
                        color: isYou ? 'rgba(255,255,255,0.9)' : '#6b7280'
                      }}>
                        {message.sent}
                      </Typography>
                      {isYou && (
                        <Box sx={{ fontSize: '0.7rem', opacity: 0.8 }}>
                          {message.status === 'sending' && '⏳'}
                          {message.status === 'failed' && '❌'}
                          {(!message.status || message.status === 'sent') && '✓'}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>

        {/* Message Input */}
        <Box sx={{ 
          p: 3, 
          borderTop: 1, 
          borderColor: 'divider',
          backgroundColor: 'white',
          position: 'sticky',
          bottom: 0
        }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              placeholder="Write a message..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={sendingMessage}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  backgroundColor: '#f8fafc',
                  '&:hover fieldset': {
                    borderColor: '#f59e0b',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#f59e0b',
                  }
                }
              }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={!messageContent.trim() || sendingMessage}
              sx={{ 
                bgcolor: '#f59e0b', 
                color: 'white',
                width: 48,
                height: 48,
                '&:hover': { 
                  bgcolor: '#d97706',
                  transform: 'scale(1.05)'
                },
                '&.Mui-disabled': {
                  bgcolor: '#e5e7eb',
                  color: '#9ca3af'
                },
                transition: 'all 0.2s ease'
              }}
            >
              {sendingMessage ? (
                <CircularProgress size={20} sx={{ color: 'white' }} />
              ) : (
                <SendIcon />
              )}
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default TravelChatModal;