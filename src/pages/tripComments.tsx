import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, IconButton, TextareaAutosize, Divider, Link, CircularProgress, Tooltip } from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ReplyIcon from '@mui/icons-material/Reply';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import { generateClient } from 'aws-amplify/api';
import { useUser } from '../contexts/UserContext';
import { type Schema } from '../../amplify/data/resource';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { sendCommentEmail } from '../graphql/mutations';
import { formatDateToDDMONYYYY } from '../utils/dateUtils';

const TripCommentsPage = () => {
  const { tripId: tripIdParam } = useParams();
  const tripId = tripIdParam || '';
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Use shared user context
  const { userData } = useUser();
  const { isSignedIn, currentUser: user, userEmail } = userData;
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [userEngagement, setUserEngagement] = useState<{ [commentId: string]: 'liked' | 'disliked' | 'none' }>({});
  const [airportData, setAirportData] = useState<Schema["Airports"]["type"][]>([]);


  // Create optimized airport lookup maps for faster searching
  const airportLookupMaps = useMemo(() => {
    const cityMap = new Map<string, Schema["Airports"]["type"]>();
    const iataMap = new Map<string, Schema["Airports"]["type"]>();
    const nameMap = new Map<string, Schema["Airports"]["type"]>();
    
    airportData.forEach(airport => {
      if (airport.city) {
        cityMap.set(airport.city.toLowerCase(), airport);
      }
      if (airport.IATA) {
        iataMap.set(airport.IATA, airport);
      }
      if (airport.airportName) {
        nameMap.set(airport.airportName.toLowerCase(), airport);
      }
    });
    
    return { cityMap, iataMap, nameMap };
  }, [airportData]);

  // Optimized airport data loading - only load if not cached
  useEffect(() => {
    const fetchAirportData = async () => {
      // Check cache first
      const cachedAirports = localStorage.getItem('airportData');
      if (cachedAirports) {
        try {
          const parsed = JSON.parse(cachedAirports);
          setAirportData(parsed);
          return;
        } catch (e) {
          console.warn('Failed to parse cached airport data');
          localStorage.removeItem('airportData');
        }
      }

      // Only fetch if cache is missing or invalid
      try {
        const client = generateClient<Schema>();
        let allAirports: Schema["Airports"]["type"][] = [];
        let nextToken: string | null | undefined = undefined;
        
        do {
          const response: any = await client.models.Airports.list({
            limit: 1000,
            nextToken: nextToken || undefined
          });
          
          if (response.data) {
            allAirports = allAirports.concat(response.data);
          }
          
          nextToken = response.nextToken || undefined;
        } while (nextToken);
        
        if (allAirports.length > 0) {
          setAirportData(allAirports);
          localStorage.setItem('airportData', JSON.stringify(allAirports));
        }
      } catch (error) {
        console.error("Error fetching airport data:", error);
      }
    };
    
    fetchAirportData();
  }, []);

  useEffect(() => {
    const fetchTripAndComments = async () => {
      setLoading(true);
      try {
        const client = generateClient<Schema>();
        
        // Fetch trip details and comments in parallel for better performance
        const [tripDetails, commentList] = await Promise.all([
          client.models.Trips.get({ tripId }),
          client.models.Comments.list({ filter: { tripId: { eq: tripId } } })
        ]);
        
        setTrip(tripDetails.data);
        setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      } catch (e) {
        console.error('Error fetching trip details:', e);
        setTrip(null);
        setComments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTripAndComments();
  }, [tripId]);


  const handleAddComment = async () => {
    setError(null);
    setSuccess(null);
    
    if (!newComment.trim()) {
      setError('Please enter a comment before submitting.');
      return;
    }
    
    if (!tripId) {
      setError('Trip information not available. Please refresh and try again.');
      return;
    }
    
    if (!isSignedIn || !user) {
      setError('Please sign in to add comments.');
      return;
    }
    setSubmitting(true);
    try {
      const client = generateClient<Schema>();
      const now = new Date().toISOString();
      const username = localStorage.getItem('username') || 'anonymous';
      
      const commentInput = {
        commentId: `COMMENT#${Date.now()}`,
        tripId,
        userEmail: userEmail || 'anonymous',
        commentText: newComment,
        createdAt: now,
        updatedAt: now,
        editable: true,
        created_by: username,
      };
      await client.models.Comments.create(commentInput);
      // Send email notification to the trip creator
      try {
        const tripCreatorEmail = trip?.userEmail;
        if (tripCreatorEmail && tripCreatorEmail !== userEmail) {
          const apiClient = generateClient<Schema>();
          await apiClient.graphql({
            query: sendCommentEmail,
            variables: {
              email: tripCreatorEmail,
              subject: 'New Comment on Your Trip',
              message: `Someone commented on your trip from ${trip.fromCity} to ${trip.toCity}: "${newComment}"`
            }
          });
          console.log('Email notification sent to trip creator!');
        }
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
      }
      setNewComment('');
      setSuccess('Comment added!');
      // Refresh comments
      const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
      setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (e: any) {
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Like/dislike handlers
  const handleLike = async (comment: any) => {
    if (!isSignedIn || !user) return;
    const client = generateClient<Schema>();
    const currentEngagement = userEngagement[comment.commentId] || 'none';
    let newLikeCount = comment.like || 0;
    let newDislikeCount = comment.dislike || 0;
    let newEngagement: 'liked' | 'disliked' | 'none' = 'none';

    if (currentEngagement === 'liked') {
      // Unlike: decrement like count
      newLikeCount = Math.max(0, newLikeCount - 1);
      newEngagement = 'none';
    } else if (currentEngagement === 'disliked') {
      // Change from dislike to like: increment like, decrement dislike
      newDislikeCount = Math.max(0, newDislikeCount - 1);
      newLikeCount++;
      newEngagement = 'liked';
    } else {
      // Like for the first time: increment like
      newLikeCount++;
      newEngagement = 'liked';
    }

    // Optimistically update UI
    setUserEngagement(prev => ({ ...prev, [comment.commentId]: newEngagement }));

    try {
      await client.models.Comments.update({
        tripId: comment.tripId,
        commentId: comment.commentId,
        like: newLikeCount,
        dislike: newDislikeCount,
        updatedAt: new Date().toISOString(),
      });
      // Refresh comments to get updated counts (optional, could just update state with new counts)
      const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
      setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (e) {
      console.error('Failed to update like:', e);
      // Revert UI on error (optional)
      setUserEngagement(prev => ({ ...prev, [comment.commentId]: currentEngagement }));
      // Potentially re-fetch to get true state from DB
    }
  };

  const handleDislike = async (comment: any) => {
    if (!isSignedIn || !user) return;
    const client = generateClient<Schema>();
    const currentEngagement = userEngagement[comment.commentId] || 'none';
    let newLikeCount = comment.like || 0;
    let newDislikeCount = comment.dislike || 0;
    let newEngagement: 'liked' | 'disliked' | 'none' = 'none';

    if (currentEngagement === 'disliked') {
      // Undislike: decrement dislike count
      newDislikeCount = Math.max(0, newDislikeCount - 1);
      newEngagement = 'none';
    } else if (currentEngagement === 'liked') {
      // Change from like to dislike: increment dislike, decrement like
      newLikeCount = Math.max(0, newLikeCount - 1);
      newDislikeCount++;
      newEngagement = 'disliked';
    } else {
      // Dislike for the first time: increment dislike
      newDislikeCount++;
      newEngagement = 'disliked';
    }

    // Optimistically update UI
    setUserEngagement(prev => ({ ...prev, [comment.commentId]: newEngagement }));

    try {
      await client.models.Comments.update({
        tripId: comment.tripId,
        commentId: comment.commentId,
        like: newLikeCount,
        dislike: newDislikeCount,
        updatedAt: new Date().toISOString(),
      });
      // Refresh comments list (optional)
      const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
      setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
    } catch (e) {
      console.error('Failed to update dislike:', e);
      // Revert UI on error (optional)
      setUserEngagement(prev => ({ ...prev, [comment.commentId]: currentEngagement }));
      // Potentially re-fetch to get true state from DB
    }
  };

  const handleReplySubmit = async (commentId: string, replyText: string) => {
    if (!isSignedIn || !user || !replyText.trim() || !commentId) return;
    setSubmitting(true);
    try {
      const client = generateClient<Schema>();
      // Fetch the comment to get its current replies
      const commentData = await client.models.Comments.get({ tripId, commentId });
      const existingReplies = commentData.data?.replies || [];

      const now = new Date().toISOString();
      // Use the same username source as main comments for consistency
      const username = localStorage.getItem('username') || 'anonymous';
      // Format the reply with user and timestamp (adjust format as needed)
      const formattedReply = `${username} (${new Date(now).toLocaleString()}): ${replyText.trim()}`;

      // Update the comment with the new reply
      await client.models.Comments.update({
        tripId,
        commentId,
        replies: [...existingReplies, formattedReply],
        updatedAt: now,
      });
      // Send email notification for reply to the trip creator
      try {
        const tripCreatorEmail = trip?.userEmail;
        if (tripCreatorEmail && tripCreatorEmail !== userEmail) {
          const apiClient = generateClient<Schema>();
          await apiClient.graphql({
            query: sendCommentEmail,
            variables: {
              email: tripCreatorEmail,
              subject: 'New Reply on Your Trip',
              message: `Someone replied to a comment on your trip from ${trip.fromCity} to ${trip.toCity}: "${replyText}"`
            }
          });
          console.log('Email notification sent to trip creator for reply!');
        }
      } catch (emailError) {
        console.error('Error sending email notification for reply:', emailError);
      }
      setReplyText(''); // Clear reply text
      setReplyingToCommentId(null); // Close reply box
      // Refresh comments list
      const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
      setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));

    } catch (e: any) {
      console.error('Failed to add reply:', e);
      // Optionally show an error message to the user
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for time range - moved before early return to maintain hook order
  const getTimeRange = useCallback((flightTime: string) => {
    if (!flightTime) return '';
    // If already in range format, return as is
    if (flightTime.includes('-')) return flightTime;
    // Otherwise, just return
    return flightTime;
  }, []);

  // Memoized helper function to format city display with country tooltip
  const formatCityDisplay = useCallback((cityValue: string) => {
    if (!cityValue) return { displayText: '', tooltipText: '' };
    
    // Fast lookup using Maps instead of array.find()
    const { cityMap, iataMap, nameMap } = airportLookupMaps;
    
    let airportInfo = iataMap.get(cityValue) || 
                     cityMap.get(cityValue.toLowerCase()) || 
                     nameMap.get(cityValue.toLowerCase());
    
    // Display format: "CityName (Code)" or existing value if no airport data found
    let displayText = cityValue;
    if (airportInfo) {
      const cityName = airportInfo.city || cityValue;
      const code = airportInfo.IATA || cityValue;
      displayText = `${cityName} (${code})`;
    }
    const tooltipText = airportInfo?.country || 'Country not found';
    
    return { displayText, tooltipText };
  }, [airportLookupMaps]);

  // Memoized city display component to prevent unnecessary re-renders
  const CityDisplay = useCallback(({ cityValue, variant = "h3", sx = {} }: { 
    cityValue: string;
    variant?: any;
    sx?: any;
  }) => {
    const { displayText, tooltipText } = formatCityDisplay(cityValue);
    
    return (
      <Tooltip title={tooltipText} placement="top">
        <Typography variant={variant} sx={{ ...sx, cursor: 'default' }}>
          {displayText}
        </Typography>
      </Tooltip>
    );
  }, [formatCityDisplay]);

  if (loading) return (
    <>
      <Header />
      <Box sx={{ width: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} sx={{ color: '#1db954' }} />
      </Box>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <Box sx={{ width: '100%', mt: 4, mb: 6, px: { xs: 0, md: 4 } }}>
        {/* Flight Details Card */}
        <Paper elevation={1} sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mb: 4, p: 0, overflow: 'hidden', borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 2, borderBottom: 'none', bgcolor: '#f4f8f7' }}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
              Flight Details
            </Typography>
          </Box>
          {trip ? (
            <Box sx={{ px: 4, pt: 3, pb: 2, textAlign: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <CityDisplay 
                  cityValue={trip.fromCity} 
                  variant="h3" 
                  sx={{ fontWeight: 800, mr: 1, fontSize: { xs: 22, sm: 32, md: 38 } }} 
                />
                <ArrowForwardIcon sx={{ color: '#4caf50', fontSize: 36, mx: 1 }} />
                <CityDisplay 
                  cityValue={trip.toCity} 
                  variant="h3" 
                  sx={{ fontWeight: 800, ml: 1, fontSize: { xs: 22, sm: 32, md: 38 } }} 
                />
              </Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ 
                  display: 'inline-block', 
                  bgcolor: trip.confirmed ? '#fff8e1' : '#f3f4f6', 
                  color: trip.confirmed ? '#b26a00' : '#6b7280', 
                  px: 2.5, 
                  py: 1, 
                  borderRadius: 2, 
                  fontWeight: 700, 
                  fontSize: 18, 
                  border: trip.confirmed ? '2px solid #ffe082' : '2px solid #e5e7eb' 
                }}>
                  Booking Status: {trip.confirmed ? 'Confirmed' : 'Pending'}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: 3, mt: 4 }}>
                <Box sx={{ flex: 1, minWidth: 180, bgcolor: '#fafbfc', borderRadius: 3, p: 3, mx: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', border: '1.5px solid #f2f2f2' }}>
                  <Typography sx={{ color: '#aaa', fontWeight: 500, fontSize: 20, mb: 1, textAlign: 'center' }}>Date</Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: 20, textAlign: 'center', color: '#222' }}>{formatDateToDDMONYYYY(trip.flightDate) || 'N/A'}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180, bgcolor: '#fafbfc', borderRadius: 3, p: 3, mx: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', border: '1.5px solid #f2f2f2' }}>
                  <Typography sx={{ color: '#aaa', fontWeight: 500, fontSize: 20, mb: 1, textAlign: 'center' }}>Time</Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: 20, textAlign: 'center', color: '#222' }}>{getTimeRange(trip.flightTime)}</Typography>
                </Box>
                <Box sx={{ flex: 1, minWidth: 180, bgcolor: '#fafbfc', borderRadius: 3, p: 3, mx: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', border: '1.5px solid #f2f2f2' }}>
                  <Typography sx={{ color: '#aaa', fontWeight: 500, fontSize: 20, mb: 1, textAlign: 'center' }}>Flight</Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: 20, textAlign: 'center', color: '#222' }}>{trip.flightDetails || 'N/A'}</Typography>
                </Box>
              </Box>
            </Box>
          ) : (
            <Box sx={{ px: 4, pt: 3, pb: 2, textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: '#666', mb: 2 }}>
                Trip details not available
              </Typography>
            </Box>
          )}
        </Paper>
        {/* Comments Section */}
        {comments.length === 0 ? (
          <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', mt: 4, textAlign: 'center' }}>
            <Typography sx={{ color: '#888', fontSize: 20, fontWeight: 500 }}>No comments yet.</Typography>
            <Box sx={{ mt: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', p: 2, maxWidth: 700, mx: 'auto' }}>
              <Typography sx={{ fontWeight: 600, mb: 1, textAlign: 'left' }}>Add a Comment</Typography>
              <TextareaAutosize
                minRows={3}
                value={newComment}
                onChange={e => {
                  setNewComment(e.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: '1rem', marginBottom: 8, borderRadius: 6, border: '1px solid #e0e0e0', padding: 12, background: '#fafbfc', color: 'black' }}
                placeholder="Share your travel experience..."
              />
              {error && <Typography sx={{ color: 'red', mb: 1 }}>{error}</Typography>}
              {success && <Typography sx={{ color: 'green', mb: 1 }}>{success}</Typography>}
              {!isSignedIn && <Typography sx={{ color: 'orange', mb: 1 }}>Please sign in to add comments.</Typography>}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleAddComment} disabled={!newComment.trim() || submitting || !isSignedIn} sx={{ bgcolor: '#1db954', fontWeight: 600, px: 4, borderRadius: 2, textTransform: 'none' }}>{submitting ? 'Submitting...' : 'Submit'}</Button>
              </Box>
            </Box>
          </Box>
        ) : (
          <Paper elevation={0} sx={{ width: '100%', maxWidth: 900, mx: 'auto', p: 0, borderRadius: 2, bgcolor: 'transparent' }}>
            <Box sx={{ px: 4, pt: 2, pb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Comments</Typography>
              {comments.map((c: any, idx: number) => (
                <Box key={c.commentId} sx={{ mb: 2 }}>
                  <Box sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Link href="#" underline="hover" sx={{ fontWeight: 600, color: '#1976d2', fontSize: 15 }}>{c.created_by || ''}</Link>
                    <Typography sx={{ color: '#888', fontSize: 14 }}>{formatDateToDDMONYYYY(c.createdAt)}</Typography>
                  </Box>
                  <Typography sx={{ mb: 1.5, fontSize: 16 }}>{c.commentText}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <IconButton size="small" onClick={() => handleLike(c)} disabled={!isSignedIn || !user}>
                      <ThumbUpAltOutlinedIcon fontSize="small" sx={{ color: userEngagement[c.commentId] === 'liked' ? '#1976d2' : '#757575' }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{c.like || 0}</Typography>
                    <IconButton size="small" onClick={() => handleDislike(c)} disabled={!isSignedIn || !user}>
                      <ThumbDownAltOutlinedIcon fontSize="small" sx={{ color: userEngagement[c.commentId] === 'disliked' ? '#d32f2f' : '#757575' }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{c.dislike || 0}</Typography>
                    <Typography sx={{ color: '#1db954', fontWeight: 600, ml: 2, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center' }}
                      onClick={() => {
                        // If this comment's reply box is already open, close it
                        if (replyingToCommentId === c.commentId) {
                          setReplyingToCommentId(null);
                          setReplyText('');
                        } else {
                          // Otherwise, open this comment's reply box
                          setReplyingToCommentId(c.commentId);
                          setReplyText(''); // Clear previous reply text
                        }
                      }}
                    >
                      <ReplyIcon fontSize="small" sx={{ mr: 0.5 }} />Reply
                    </Typography>
                  </Box>

                  {/* Reply Box */}
                  {replyingToCommentId === c.commentId && (
                    <Box sx={{ 
                      mt: 2, 
                      mb: 1, 
                      ml: 3, 
                      p: 2,
                      bgcolor: '#fafbfc',
                      borderRadius: 2,
                      border: '1px solid #e2e8f0'
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#64748b', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        mb: 1,
                        display: 'block'
                      }}>
                        Reply to {c.created_by}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                        <TextareaAutosize
                          minRows={2}
                          maxRows={4}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          style={{ 
                            flexGrow: 1, 
                            fontFamily: 'inherit', 
                            fontSize: '0.9rem', 
                            borderRadius: 8, 
                            border: '1px solid #d1d5db', 
                            padding: 12, 
                            background: '#ffffff', 
                            color: '#374151', 
                            resize: 'vertical',
                            outline: 'none',
                            transition: 'border-color 0.2s ease'
                          }}
                          placeholder="Write your reply..."
                          onFocus={(e) => {
                            e.target.style.borderColor = '#f59e0b';
                            e.target.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#d1d5db';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <IconButton
                          onClick={() => handleReplySubmit(c.commentId, replyText)}
                          disabled={!replyText.trim() || submitting}
                          sx={{ 
                            bgcolor: replyText.trim() ? '#f59e0b' : '#e5e7eb',
                            color: replyText.trim() ? 'white' : '#9ca3af',
                            borderRadius: 2,
                            p: 1.5,
                            '&:hover': {
                              bgcolor: replyText.trim() ? '#d97706' : '#e5e7eb',
                            },
                            '&:disabled': {
                              bgcolor: '#e5e7eb',
                              color: '#9ca3af'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  )}

                  {/* Display Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <Box sx={{ 
                      mt: 2, 
                      ml: 3, 
                      borderLeft: '3px solid #f59e0b', 
                      pl: 3,
                      bgcolor: '#fafbfc',
                      borderRadius: '0 8px 8px 0',
                      py: 2
                    }}>
                      <Typography variant="caption" sx={{ 
                        color: '#64748b', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        mb: 1,
                        display: 'block'
                      }}>
                        {c.replies.length} {c.replies.length === 1 ? 'Reply' : 'Replies'}
                      </Typography>
                      {c.replies.map((reply: string, replyIdx: number) => {
                        // Parse reply format: "Username (Timestamp): Reply Text"
                        const replyMatch = reply.match(/^(.+?)\s+\((.+?)\):\s*(.*)$/);
                        if (!replyMatch) {
                          // Fallback for unexpected format
                          return (
                            <Box key={replyIdx} sx={{ 
                              mb: replyIdx < c.replies.length - 1 ? 2 : 0,
                              p: 2,
                              bgcolor: '#ffffff',
                              borderRadius: 2,
                              border: '1px solid #e2e8f0',
                              fontSize: '0.9rem'
                            }}>
                              <Typography sx={{ color: '#374151' }}>{reply}</Typography>
                            </Box>
                          );
                        }

                        const [, replierUsername, timestamp, replyText] = replyMatch;

                        return (
                          <Box key={replyIdx} sx={{ 
                            mb: replyIdx < c.replies.length - 1 ? 2 : 0,
                            p: 2,
                            bgcolor: '#ffffff',
                            borderRadius: 2,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: '#f59e0b',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                            }
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography sx={{ 
                                fontWeight: 700, 
                                fontSize: '0.875rem',
                                color: '#f59e0b'
                              }}>
                                {replierUsername}
                              </Typography>
                              <Typography sx={{ 
                                fontSize: '0.75rem', 
                                color: '#64748b',
                                fontWeight: 500
                              }}>
                                {timestamp}
                              </Typography>
                            </Box>
                            <Typography sx={{ 
                              fontSize: '0.875rem', 
                              color: '#374151',
                              lineHeight: 1.5
                            }}>
                              {replyText}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )}

                  {idx !== comments.length - 1 && <Divider sx={{ my: 2, borderColor: '#e0e0e0' }} />}
                </Box>
              ))}
              {/* Add Comment */}
              <Box sx={{ mt: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', p: 2 }}>
                <Typography sx={{ fontWeight: 600, mb: 1 }}>Add a Comment</Typography>
                <TextareaAutosize
                  minRows={3}
                  value={newComment}
                  onChange={e => {
                    setNewComment(e.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  style={{ width: '100%', fontFamily: 'inherit', fontSize: '1rem', marginBottom: 8, borderRadius: 6, border: '1px solid #e0e0e0', padding: 12, background: '#fafbfc', color: 'black' }}
                  placeholder="Share your travel experience..."
                />
                {error && <Typography sx={{ color: 'red', mb: 1 }}>{error}</Typography>}
                {success && <Typography sx={{ color: 'green', mb: 1 }}>{success}</Typography>}
                {!isSignedIn && <Typography sx={{ color: 'orange', mb: 1 }}>Please sign in to add comments.</Typography>}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={handleAddComment} disabled={!newComment.trim() || submitting || !isSignedIn} sx={{ bgcolor: '#1db954', fontWeight: 600, px: 4, borderRadius: 2, textTransform: 'none' }}>{submitting ? 'Submitting...' : 'Submit'}</Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
      <Footer />
    </>
  );
};

export default TripCommentsPage; 