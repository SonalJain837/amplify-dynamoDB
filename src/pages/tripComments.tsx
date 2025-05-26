import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, IconButton, TextareaAutosize, Divider, Link, CircularProgress } from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ReplyIcon from '@mui/icons-material/Reply';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { type Schema } from '../../amplify/data/resource';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TripCommentsPage = () => {
  const { tripId: tripIdParam } = useParams();
  const tripId = tripIdParam || '';
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<string>('');

  useEffect(() => {
    getCurrentUser().then(u => setUser(u)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    const fetchTripAndComments = async () => {
      setLoading(true);
      try {
        const client = generateClient<Schema>();
        // Fetch trip details
        const tripList = await client.models.Trips.list({ filter: { tripId: { eq: tripId } } });
        setTrip(tripList.data[0]);
        // Fetch comments for this trip
        const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
        setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
      } catch (e) {
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
    if (!user || !newComment.trim() || !tripId) return;
    setSubmitting(true);
    try {
      const client = generateClient<Schema>();
      const now = new Date().toISOString();
      const commentInput = {
        commentId: `COMMENT#${Date.now()}`,
        tripId,
        userEmail: user.username,
        commentText: newComment,
        createdAt: now,
        updatedAt: now,
        editable: true,
        created_by: user.username,
      };
      await client.models.Comments.create(commentInput);
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
    if (!user) return;
    const client = generateClient<Schema>();
    await client.models.Comments.update({
      ...comment,
      like: (comment.like || 0) + 1,
      dislike: 0,
      updatedAt: new Date().toISOString(),
    });
    // Refresh comments
    const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
    setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  const handleDislike = async (comment: any) => {
    if (!user) return;
    const client = generateClient<Schema>();
    await client.models.Comments.update({
      ...comment,
      like: 0,
      dislike: (comment.dislike || 0) + 1,
      updatedAt: new Date().toISOString(),
    });
    // Refresh comments
    const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
    setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  const handleReplySubmit = async (commentId: string, replyText: string) => {
    if (!user || !replyText.trim() || !commentId) return;
    setSubmitting(true);
    try {
      const client = generateClient<Schema>();
      // Fetch the comment to get its current replies
      const commentData = await client.models.Comments.get({ tripId, commentId });
      const existingReplies = commentData.data?.replies || [];

      const now = new Date().toISOString();
      // Format the reply with user and timestamp (adjust format as needed)
      const formattedReply = `${user.username} (${new Date(now).toLocaleString()}): ${replyText.trim()}`;

      // Update the comment with the new reply
      await client.models.Comments.update({
        tripId,
        commentId,
        replies: [...existingReplies, formattedReply],
        updatedAt: now,
      });

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

  if (loading) return (
    <>
      <Header />
      <Box sx={{ width: '100%', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} sx={{ color: '#1db954' }} />
      </Box>
      <Footer />
    </>
  );

  // Helper for time range
  const getTimeRange = (flightTime: string) => {
    if (!flightTime) return '';
    // If already in range format, return as is
    if (flightTime.includes('-')) return flightTime;
    // Otherwise, just return
    return flightTime;
  };

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
                <Typography variant="h3" sx={{ fontWeight: 800, mr: 1, fontSize: { xs: 22, sm: 32, md: 38 } }}>{trip.fromCity}</Typography>
                <ArrowForwardIcon sx={{ color: '#4caf50', fontSize: 36, mx: 1 }} />
                <Typography variant="h3" sx={{ fontWeight: 800, ml: 1, fontSize: { xs: 22, sm: 32, md: 38 } }}>{trip.toCity}</Typography>
              </Box>
              <Typography sx={{ color: '#444', mb: 2, fontSize: 18 }}>
                Flight: <b>{trip.flightDetails || 'N/A'}</b> &nbsp;·&nbsp; Direct Flight &nbsp;·&nbsp; 7h 25m
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'inline-block', bgcolor: '#fff8e1', color: '#b26a00', px: 2.5, py: 1, borderRadius: 2, fontWeight: 700, fontSize: 18, border: '2px solid #ffe082' }}>
                  Booking Status: Confirmed
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: 3, mt: 4 }}>
                <Box sx={{ flex: 1, minWidth: 180, bgcolor: '#fafbfc', borderRadius: 3, p: 3, mx: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.03)', border: '1.5px solid #f2f2f2' }}>
                  <Typography sx={{ color: '#aaa', fontWeight: 500, fontSize: 20, mb: 1, textAlign: 'center' }}>Date</Typography>
                  <Typography sx={{ fontWeight: 500, fontSize: 20, textAlign: 'center', color: '#222' }}>{trip.flightDate || 'N/A'}</Typography>
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
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleAddComment} disabled={!newComment.trim() || submitting} sx={{ bgcolor: '#1db954', fontWeight: 600, px: 4, borderRadius: 2, textTransform: 'none' }}>{submitting ? 'Submitting...' : 'Submit'}</Button>
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
                    <Link href="#" underline="hover" sx={{ fontWeight: 600, color: '#1976d2', fontSize: 15 }}>{c.commentId}</Link>
                    <Typography sx={{ color: '#888', fontSize: 14 }}>{new Date(c.createdAt).toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</Typography>
                  </Box>
                  <Typography sx={{ mb: 1.5, fontSize: 16 }}>{c.commentText}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <IconButton size="small" onClick={() => handleLike(c)} disabled={!user}>
                      <ThumbUpAltOutlinedIcon fontSize="small" sx={{ color: '#757575' }} />
                    </IconButton>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>{c.like || 0}</Typography>
                    <IconButton size="small" onClick={() => handleDislike(c)} disabled={!user}>
                      <ThumbDownAltOutlinedIcon fontSize="small" sx={{ color: '#757575' }} />
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
                    <Box sx={{ mt: 1, mb: 1, ml: 5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextareaAutosize
                        minRows={1}
                        maxRows={4}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        style={{ flexGrow: 1, fontFamily: 'inherit', fontSize: '0.85rem', borderRadius: 3, border: '1px solid #d0d0d0', padding: 6, background: '#fff', color: 'black', resize: 'vertical' }}
                        placeholder="Write your reply..."
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleReplySubmit(c.commentId, replyText)}
                        disabled={!replyText.trim() || submitting}
                        sx={{ color: '#1db954', p: 0.5 }}
                      >
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}

                  {/* Display Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <Box sx={{ mt: 1, ml: 5, borderLeft: '2px solid #e0e0e0', pl: 2 }}>
                      {c.replies.map((reply: string, replyIdx: number) => (
                        <Typography key={replyIdx} sx={{ mb: 0.5, fontSize: '0.9rem', color: '#555' }}>
                          {reply}
                        </Typography>
                      ))}
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
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" onClick={handleAddComment} disabled={!newComment.trim() || submitting} sx={{ bgcolor: '#1db954', fontWeight: 600, px: 4, borderRadius: 2, textTransform: 'none' }}>{submitting ? 'Submitting...' : 'Submit'}</Button>
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