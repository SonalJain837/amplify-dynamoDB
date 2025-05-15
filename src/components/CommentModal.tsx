import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  TextareaAutosize
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CommentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (comment: string) => void;
  rowData?: any; // Optional data for the row being commented on
}

const CommentModal: React.FC<CommentModalProps> = ({ open, onClose, onSubmit, rowData }) => {
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
    if (e.target.value.length > 0) {
      setError('');
    }
  };

  const handleSubmit = () => {
    if (!comment.trim()) {
      setError('Please enter a comment');
      return;
    }
    onSubmit(comment);
    setComment('');
    onClose();
  };

  const handleClose = () => {
    setComment('');
    setError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        pb: 1
      }}>
        <Typography variant="h6" component="div">
          Add a Comment
        </Typography>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2 }}>
        {rowData && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ color: '#666', mb: 0.5 }}>
              Flight: {rowData.from} → {rowData.to}
            </Typography>
            {rowData.layover && (
              <Typography variant="body2" sx={{ color: '#666', mb: 0.5 }}>
                Layover: {rowData.layover}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: '#666' }}>
              Date: {rowData.date} | Time: {rowData.time}
            </Typography>
          </Box>
        )}
        
        <Typography variant="body1" sx={{ mb: 1 }}>
          Your Comment
        </Typography>
        <TextareaAutosize
          minRows={4}
          maxRows={8}
          value={comment}
          onChange={handleCommentChange}
          placeholder="Enter your comment here..."
          style={{ 
            width: '100%', 
            padding: '12px', 
            fontFamily: 'inherit',
            fontSize: '0.9rem',
            borderColor: error ? 'red' : '#ccc',
            borderRadius: '4px',
            resize: 'vertical',
            backgroundColor: 'white',
            color: 'black'
          }}
        />
        {error && (
          <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="outlined"
          onClick={handleClose}
          sx={{ mr: 1 }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            bgcolor: 'rgb(26, 150, 152)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgb(21, 120, 120)',
            }
          }}
        >
          Submit Comment
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommentModal; 