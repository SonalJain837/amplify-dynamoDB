import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Divider, Button, IconButton, TextareaAutosize, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ReplyIcon from '@mui/icons-material/Reply';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

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

  const handleEditComment = (commentId: string, text: string) => {
    setEditingCommentId(commentId);
    setEditText(text);
  };

  const handleSaveEdit = async (comment: any) => {
    const client = generateClient<Schema>();
    await client.models.Comments.update({ ...comment, commentText: editText, updatedAt: new Date().toISOString() });
    setEditingCommentId(null);
    setEditText('');
    // Refresh comments
    const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
    setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!tripId) return;
    const client = generateClient<Schema>();
    const comment = comments.find(c => c.commentId === commentId);
    if (!comment) return;
    await client.models.Comments.delete({ commentId, tripId });
    // Refresh comments
    const commentList = await client.models.Comments.list({ filter: { tripId: { eq: tripId } } });
    setComments(commentList.data.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()));
  };

  // Add like/dislike handlers
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

  return (
    <>
      <Header />
      <Box sx={{ width: '100%', mt: 4, mb: 6 }}>
        {/* Trip Details with Back Icon */}
        <Paper elevation={3} sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', width: '100%' }}>
          <IconButton onClick={() => navigate('/')} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {trip.fromCity} → {trip.toCity} {trip.layoverCity && `via ${trip.layoverCity.join(', ')}`}
            </Typography>
            <Typography variant="body2" sx={{ color: '#555' }}>
              Date: {trip.flightDate} | Time: {trip.flightTime} | Booked: {trip.confirmed ? 'Yes' : 'No'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#555' }}>
              Flight: {trip.flightDetails}
            </Typography>
          </Box>
        </Paper>
        {/* Comments Section */}
        <Paper elevation={2} sx={{ p: 3, width: '100%' }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>Comments</Typography>
          {comments.length === 0 && <Typography sx={{ color: '#888' }}>No comments yet.</Typography>}
          {comments.map((c) => (
            <Box key={c.commentId} sx={{ mb: 3, pl: 2, borderLeft: '2px solid #eee' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ color: '#1976d2', fontWeight: 500, mr: 1 }}>{c.userEmail}</Typography>
                <Typography sx={{ color: '#888', fontSize: 13, mr: 1 }}>{new Date(c.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</Typography>
                {user && c.created_by === user.username && (
                  <>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditComment(c.commentId, c.commentText)}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDeleteComment(c.commentId)}><DeleteIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>
              {editingCommentId === c.commentId ? (
                <Box>
                  <TextareaAutosize
                    minRows={2}
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    style={{ width: '100%', fontFamily: 'inherit', fontSize: '1rem', marginBottom: 8 }}
                  />
                  <Button size="small" variant="contained" sx={{ mr: 1 }} onClick={() => handleSaveEdit(c)}>Save</Button>
                  <Button size="small" variant="outlined" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                </Box>
              ) : (
                <Typography sx={{ mb: 1 }}>{c.commentText}</Typography>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton size="small" onClick={() => handleLike(c)} disabled={!user}>
                  <ThumbUpAltOutlinedIcon fontSize="small" sx={{ color: '#FBC02D' }} />
                </IconButton>
                <Typography variant="caption">{c.like || 0}</Typography>
                <IconButton size="small" onClick={() => handleDislike(c)} disabled={!user}>
                  <ThumbDownAltOutlinedIcon fontSize="small" sx={{ color: '#FBC02D' }} />
                </IconButton>
                <Typography variant="caption">{c.dislike || 0}</Typography>
                <Typography sx={{ color: 'green', fontWeight: 500, ml: 1, cursor: 'pointer', fontSize: 14 }}><ReplyIcon fontSize="small" sx={{ mr: 0.5 }} />Reply</Typography>
              </Box>
            </Box>
          ))}
          {/* Add Comment */}
          {user ? (
            <Box sx={{ mt: 3 }}>
              <Typography sx={{ fontWeight: 500, mb: 1 }}>Add a Comment</Typography>
              <TextareaAutosize
                minRows={3}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                style={{ width: '100%', fontFamily: 'inherit', fontSize: '1rem', marginBottom: 8 }}
                placeholder="Enter your comment here..."
              />
              <Button variant="contained" onClick={handleAddComment} disabled={!newComment.trim()}>Submit</Button>
            </Box>
          ) : (
            <Typography sx={{ mt: 3, color: '#d32f2f', fontWeight: 500 }}>Sign in to add a comment.</Typography>
          )}
        </Paper>
      </Box>
    </>
  );
};

export default TripCommentsPage; 