import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, IconButton, TextareaAutosize, Divider, Link } from '@mui/material';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ReplyIcon from '@mui/icons-material/Reply';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { type Schema } from '../../amplify/data/resource';
import Header from '../components/Header';

const TripCommentsPage = () => {
  const { tripId: tripIdParam } = useParams();
  const tripId = tripIdParam || '';
  const navigate = useNavigate();
  const [trip, setTrip] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');

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
    if (!user || !newComment.trim() || !tripId) return;
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
    // Refresh comments
    const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
    setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
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

  if (loading) return <Typography>Loading...</Typography>;
  if (!trip) return <Typography>No trip found.</Typography>;

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
        <Paper elevation={1} sx={{ width: '100%', maxWidth: 900, mx: 'auto', mb: 4, p: 0, overflow: 'hidden', borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: 'rgba(0,128,128,0.07)', px: 3, py: 2, borderBottom: '1px solid #e0e0e0' }}>
            <IconButton onClick={() => navigate('/')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700, mr: 2 }}>
              Flight Details
            </Typography>
          </Box>
          <Box sx={{ px: 4, pt: 3, pb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mr: 1 }}>{trip.fromCity}</Typography>
              <ArrowForwardIcon sx={{ color: '#1db954', fontSize: 28, mx: 1 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, ml: 1 }}>{trip.toCity}</Typography>
            </Box>
            <Typography sx={{ color: '#444', mb: 1 }}>
              Flight: <b>{trip.flightDetails || 'N/A'}</b> &nbsp;·&nbsp; Direct Flight &nbsp;·&nbsp; 7h 25m
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'inline-block', bgcolor: '#fff8e1', color: '#b26a00', px: 2, py: 0.5, borderRadius: 2, fontWeight: 600, fontSize: 15, border: '1px solid #ffe082' }}>
                Booking Status: Confirmed
              </Box>
            </Box>
            <Box sx={{ bgcolor: '#fafbfc', borderRadius: 2, border: '1px solid #f0f0f0', mb: 1 }}>
              <Box sx={{ display: 'flex', px: 3, py: 2, borderBottom: '1px solid #f0f0f0' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: '#888', fontWeight: 500, fontSize: 14 }}>Date</Typography>
                  <Typography sx={{ fontWeight: 500 }}>{trip.flightDate || 'N/A'}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: '#888', fontWeight: 500, fontSize: 14 }}>Time</Typography>
                  <Typography sx={{ fontWeight: 500 }}>{getTimeRange(trip.flightTime)}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ color: '#888', fontWeight: 500, fontSize: 14 }}>Flight</Typography>
                  <Typography sx={{ fontWeight: 500 }}>{trip.flightDetails || 'N/A'}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Paper>
        {/* Comments Section */}
        <Paper elevation={0} sx={{ width: '100%', maxWidth: 900, mx: 'auto', p: 0, borderRadius: 2, bgcolor: 'transparent' }}>
          <Box sx={{ px: 4, pt: 2, pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Comments</Typography>
            {comments.length === 0 && <Typography sx={{ color: '#888' }}>No comments yet.</Typography>}
            {comments.map((c: any, idx: number) => (
              <Box key={c.commentId}>
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
                  <Typography sx={{ color: '#1db954', fontWeight: 600, ml: 2, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center' }}>
                    <ReplyIcon fontSize="small" sx={{ mr: 0.5 }} />Reply
                  </Typography>
                </Box>
                {idx !== comments.length - 1 && <Divider sx={{ my: 2, borderColor: '#e0e0e0' }} />}
              </Box>
            ))}
            {/* Add Comment */}
            <Box sx={{ mt: 3, bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0', p: 2 }}>
              <Typography sx={{ fontWeight: 600, mb: 1 }}>Add a Comment</Typography>
              <TextareaAutosize
                minRows={3}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: '1rem', marginBottom: 8, borderRadius: 6, border: '1px solid #e0e0e0', padding: 12, background: '#fafbfc' }}
                placeholder="Share your travel experience..."
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" onClick={handleAddComment} disabled={!newComment.trim()} sx={{ bgcolor: '#1db954', fontWeight: 600, px: 4, borderRadius: 2, textTransform: 'none' }}>Submit</Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

export default TripCommentsPage; 