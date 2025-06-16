import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
}

interface SectionBlock {
  type: 'section';
  heading: string;
  content: string;
}

interface ListIntroBlock {
  type: 'list-intro';
  text: string;
}

interface ListBlock {
  type: 'list';
  items: string[];
}

type TermsContentBlock = SectionBlock | ListIntroBlock | ListBlock;

const TermsModal: React.FC<TermsModalProps> = ({ open, onClose }) => {
  const effectiveDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); // Dynamically get current date
  const termsContent: TermsContentBlock[] = [
    {
      type: 'section',
      heading: '1. Acceptance of Terms',
      content: 'By accessing or using this website ("Site"), you agree to be bound by these Terms of Use and all applicable laws and regulations. If you do not agree, do not use this Site.',
    },
    {
      type: 'section',
      heading: '2. Use License',
      content: 'You are granted a limited, non-exclusive, non-transferable license to access and use the Site for personal, non-commercial purposes.',
    },
    {
      type: 'list-intro',
      text: 'You may not:',
    },
    {
      type: 'list',
      items: [
        'Modify or copy the materials.',
        'Use the content for any commercial purpose.',
        'Attempt to reverse-engineer any software on the Site.',
        'Remove copyright or proprietary notices.',
      ],
    },
    {
      type: 'section',
      heading: '3. User Conduct',
      content: 'You agree not to:',
    },
    {
      type: 'list',
      items: [
        'Use the Site for illegal purposes.',
        'Post or transmit harmful, harassing, defamatory, or obscene content.',
        'Interfere with the operation or security of the Site.',
      ],
    },
    {
      type: 'section',
      heading: '4. Intellectual Property',
      content: 'All content on the Site, including text, graphics, logos, and software, is the property of Travel Companion and is protected by intellectual property laws.',
    },
    {
      type: 'section',
      heading: '5. Disclaimer',
      content: 'The Site and its content are provided "as is." [Website Owner] makes no warranties, expressed or implied, regarding the Site\'s accuracy, reliability, or availability.',
    },
    {
      type: 'section',
      heading: '6. Limitation of Liability',
      content: '[Website Owner] shall not be liable for any damages arising out of the use or inability to use the Site, even if [Website Owner] has been notified of the possibility of such damages.',
    },
    {
      type: 'section',
      heading: '7. Modifications',
      content: 'We may revise these Terms at any time. By using the Site, you agree to be bound by the then-current version.',
    },
    {
      type: 'section',
      heading: '8. Governing Law',
      content: 'These Terms are governed by the laws of [Your State/Country], without regard to its conflict of law provisions.',
    },
    {
      type: 'section',
      heading: '9. Contact',
      content: 'For any questions regarding these Terms, please contact us at [email@example.com].',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          maxHeight: '80vh',
        }
      }}
    >
      <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#f5f8fa', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: '#2c3e50' }}>
            Website Terms of Use
          </Typography>
          <Typography variant="body2" sx={{ color: '#555', fontSize: '0.85rem' }}>
            Effective Date: {effectiveDate}
          </Typography>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3, overflowY: 'auto' }}>
        {termsContent.map((block, index) => (
          <React.Fragment key={index}>
            {block.type === 'section' && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, mt: index > 0 ? 3 : 0 }}>
                  {block.heading}
                </Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                  {block.content}
                </Typography>
              </Box>
            )}
            {block.type === 'list-intro' && (
              <Typography variant="body2" sx={{ mb: 1.5, mt: 3, fontWeight: 500 }}>
                {block.text}
              </Typography>
            )}
            {block.type === 'list' && (
              <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', mb: 2 }}>
                {block.items.map((item, itemIndex) => (
                  <Box key={itemIndex} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    py: 1.5,
                    px: 2,
                    borderBottom: itemIndex < block.items.length - 1 ? '1px solid #eee' : 'none',
                    bgcolor: 'white',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      width: '8px',
                      height: '100%',
                      bgcolor: 'black',
                      mr: 2,
                      ml: -2, // Adjust to pull the bar into the padding area
                    },
                  }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                      {item}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </React.Fragment>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default TermsModal; 