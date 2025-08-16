import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  Badge,
  Skeleton,
  Container,
  Divider,
  Chip,
  Button,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Message as MessageIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { AmplifyMessagingService, type ConversationItem, type ConversationMessage } from '../services/amplifyMessagingService';
import { useUser } from '../contexts/UserContext';
import { Link as RouterLink } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface ChatMessage {
  message: string;
  sent: string;
  sentBy: string;
}

const MessagesPage: React.FC = memo(() => {
  const { userData } = useUser();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [openChatDialog, setOpenChatDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationSubscription, setConversationSubscription] = useState<any>(null);
  const [messageSending, setMessageSending] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  useEffect(() => {
    // Only load conversations if user is signed in and has email
    if (userData.userEmail && userData.isSignedIn) {
      loadConversations();
      
      // Set up real-time subscription for conversation updates
      const sub = AmplifyMessagingService.subscribeToConversations(userData.userEmail, () => {
        // Reload conversations when there are updates, but debounce it
        setTimeout(() => {
          loadConversations();
        }, 500); // Debounce to avoid excessive calls
      });
      setConversationSubscription(sub);
      
      return () => {
        if (sub) {
          sub.unsubscribe();
        }
      };
    } else {
      // Clear conversations if user is not signed in
      setConversations([]);
      setLoading(false);
    }
  }, [userData.userEmail, userData.isSignedIn]);

  const loadConversations = useCallback(async (forceRefresh = false) => {
    if (!userData.userEmail) return;
    
    // Prevent multiple simultaneous calls and implement basic caching
    const now = Date.now();
    const CACHE_DURATION = 30000; // 30 seconds cache
    
    if (!forceRefresh && isLoadingConversations) {
      console.log('Conversations already loading, skipping...');
      return;
    }
    
    if (!forceRefresh && (now - lastLoadTime) < CACHE_DURATION && conversations.length > 0) {
      console.log('Using cached conversations');
      return;
    }
    
    try {
      setIsLoadingConversations(true);
      setLoading(true);
      setError(null);
      
      const response = await AmplifyMessagingService.getUserConversations(userData.userEmail, !forceRefresh);
      if (response.responseStatus === 'OK') {
        setConversations(response.conversations);
        setLastLoadTime(now);
      } else {
        setError('Failed to load conversations');
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load conversations';
      if (error instanceof Error) {
        if (error.message.includes('Amplify client initialization failed')) {
          errorMessage = 'Please wait while the app initializes...';
          // Retry after a short delay if it's an initialization issue
          setTimeout(() => {
            if (userData.userEmail && userData.isSignedIn) {
              loadConversations(true);
            }
          }, 2000);
        } else if (error.message.includes('model not available')) {
          errorMessage = 'Messaging service is not available. Please try again later.';
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
      setIsLoadingConversations(false);
    }
  }, [userData.userEmail, userData.isSignedIn, conversations.length, lastLoadTime, isLoadingConversations]);

  const handleConversationClick = useCallback(async (conversationId: number) => {
    try {
      setChatLoading(true);
      setSelectedConversation(conversationId);
      setOpenChatDialog(true);

      const response = await AmplifyMessagingService.getConversation(conversationId, userData.userEmail, true);
      if (response.responseStatus === 'OK') {
        setChatMessages(response.conversationMessages);
      } else {
        setError('Failed to load chat messages');
      }
    } catch (error) {
      console.error('Error loading chat:', error);
      setError('Failed to load chat messages');
    } finally {
      setChatLoading(false);
    }
  }, [userData.userEmail]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userData.userEmail || messageSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setMessageSending(true);

    try {
      // Get the receiver email from the conversation
      const conversation = conversations.find(c => c.conversationId === selectedConversation);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Optimistically add the message to the UI with sending status
      const tempId = `temp_${Date.now()}`;
      const newMsg: ConversationMessage & { id?: string; status?: 'sending' | 'sent' | 'failed' } = {
        message: messageContent,
        sent: 'Sending...',
        sentBy: 'YOU',
        id: tempId,
        status: 'sending'
      };
      setChatMessages(prev => [...prev, newMsg]);

      // Get the receiver email from the conversation participants
      const receiverEmail = await AmplifyMessagingService.getConversationParticipantEmail(
        conversation.conversationId.toString(), 
        userData.userEmail
      );
      
      if (!receiverEmail) {
        throw new Error('Could not find receiver email for conversation');
      }

      // Send message via API
      const response = await AmplifyMessagingService.sendMessage(
        userData.userEmail,
        receiverEmail,
        messageContent
      );

      if (response.responseStatus === 'OK') {
        // Reload the conversation to get the latest messages
        const conversationResponse = await AmplifyMessagingService.getConversation(selectedConversation, userData.userEmail, false);
        if (conversationResponse.responseStatus === 'OK') {
          setChatMessages(conversationResponse.conversationMessages);
        }
        
        // Force refresh conversations to update the last message (but with reduced frequency)
        setTimeout(() => {
          loadConversations(true);
        }, 1000);
      } else {
        // Update message status to failed
        setChatMessages(prev => prev.map(msg => 
          (msg as any).id === tempId 
            ? { ...msg, sent: 'Failed to send', status: 'failed' }
            : msg
        ));
        setError('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Update message status to failed
      setChatMessages(prev => prev.map(msg => 
        (msg as any).id === tempId 
          ? { ...msg, sent: 'Failed to send', status: 'failed' }
          : msg
      ));
      setError('Failed to send message');
    } finally {
      setMessageSending(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  if (!userData.isSignedIn) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <Container maxWidth="md" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Please sign in to view your messages
          </Typography>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <Container maxWidth="lg" sx={{ flex: 1, py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Messages
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {loading ? (
            <Box sx={{ p: 3 }}>
              {[...Array(5)].map((_, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : conversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <MessageIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No messages yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start a conversation by contacting travelers from the home page
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {conversations.map((conversation, index) => (
                <React.Fragment key={conversation.conversationId}>
                  <ListItemButton
                    onClick={() => handleConversationClick(conversation.conversationId)}
                    sx={{
                      py: 2,
                      px: 3,
                      '&:hover': {
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#f59e0b' }}>
                        {conversation.sender.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {conversation.sender}
                          </Typography>
                          {conversation.senderGender && (
                            <Chip
                              label={conversation.senderGender}
                              size="small"
                              variant="outlined"
                              sx={{ height: 20, fontSize: '0.75rem' }}
                            />
                          )}
                          {conversation.paidCompanion && (
                            <Chip
                              label="Paid"
                              size="small"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.75rem' }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: 300,
                            }}
                          >
                            {conversation.lastMessage}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {conversation.sent}
                          </Typography>
                          {conversation.confirmationCode && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                              Code: {conversation.confirmationCode}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItemButton>
                  {index < conversations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Container>

      {/* Enhanced Chat Dialog */}
      <Dialog
        open={openChatDialog}
        onClose={() => setOpenChatDialog(false)}
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
        {/* Enhanced Header */}
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
                {conversations.find(c => c.conversationId === selectedConversation)?.sender.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem', color: '#1f2937' }}>
                  {conversations.find(c => c.conversationId === selectedConversation)?.sender}
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.75rem' }}>
                  Online
                </Typography>
              </Box>
            </Box>
            <IconButton 
              onClick={() => setOpenChatDialog(false)}
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
          {chatLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
              <CircularProgress sx={{ color: '#f59e0b' }} />
            </Box>
          ) : (
            <>
              {/* Enhanced Messages Area */}
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
                {chatMessages.length === 0 ? (
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    flex: 1,
                    flexDirection: 'column',
                    gap: 2
                  }}>
                    <Typography variant="body2" color="text.secondary">
                      Start a conversation
                    </Typography>
                  </Box>
                ) : (
                  chatMessages.map((message, index) => {
                    const isYou = message.sentBy === 'YOU';
                    const messageWithStatus = message as ConversationMessage & { status?: 'sending' | 'sent' | 'failed' };
                    
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
                                {messageWithStatus.status === 'sending' && '⏳'}
                                {messageWithStatus.status === 'failed' && '❌'}
                                {(!messageWithStatus.status || messageWithStatus.status === 'sent') && '✓'}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })
                )}
              </Box>

              {/* Enhanced Message Input */}
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
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={messageSending}
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
                    disabled={!newMessage.trim() || messageSending}
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
                    {messageSending ? (
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                    ) : (
                      <SendIcon />
                    )}
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </Box>
  );
});

MessagesPage.displayName = 'MessagesPage';

export default MessagesPage;