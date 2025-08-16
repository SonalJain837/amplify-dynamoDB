import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Fade,
  Chip,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Send as SendIcon,
  Subject as SubjectIcon,
  Message as MessageIcon,
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  QuestionAnswer as QuestionAnswerIcon,
  Support as SupportIcon,
  Feedback as FeedbackIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';
import { useInView } from 'react-intersection-observer';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Modern animations
const shimmer = keyframes`
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: calc(200px + 100%) 0;
  }
`;

const ripple = keyframes`
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
`;

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginTop: '20px', // Reduced space from header
  padding: '3rem 2rem 2.5rem', // Reduced padding significantly
  background: `linear-gradient(135deg, rgba(250, 250, 250, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%),
    url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.1'%3E%3Cpath d='M50 50c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm20-20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm0 40c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm-40-20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  backgroundSize: '200px 200px',
  backgroundPosition: 'center',
  textAlign: 'center',
  overflow: 'hidden',
  minHeight: 'auto', // Changed to auto for compact height
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  borderRadius: '0 0 40px 40px',
  
  // Add subtle animated pattern overlay
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                 radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.08) 0%, transparent 50%),
                 radial-gradient(circle at 40% 80%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)`,
    animation: `${shimmer} 8s ease-in-out infinite alternate`,
    zIndex: 1,
  },
  
  // Modern geometric shapes
  '&::after': {
    content: '""',
    position: 'absolute',
    top: '10%',
    right: '10%',
    width: '100px', // Reduced size
    height: '100px',
    background: 'linear-gradient(45deg, rgba(59, 130, 246, 0.1), rgba(16, 185, 129, 0.1))',
    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    animation: `${ripple} 6s ease-in-out infinite`,
    zIndex: 1,
  },
  
  // Responsive Design
  [theme.breakpoints.down('lg')]: {
    marginTop: '15px',
    padding: '2.5rem 2rem 2rem',
  },
  
  [theme.breakpoints.down('md')]: {
    marginTop: '10px',
    padding: '2rem 1.5rem 1.5rem',
    '&::after': {
      width: '80px',
      height: '80px',
      top: '15%',
      right: '5%',
    }
  },
  
  [theme.breakpoints.down('sm')]: {
    marginTop: '5px',
    padding: '1.5rem 1rem 1.25rem',
    borderRadius: '0 0 30px 30px',
    '&::after': {
      width: '60px',
      height: '60px',
      top: '20%',
      right: '5%',
    }
  }
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  background: '#ffffff',
  position: 'relative',
  zIndex: 4,
  marginTop: '20px', // Reduced from 40px
  paddingTop: '40px', // Reduced from 60px
  paddingBottom: '60px',
  minHeight: '70vh',
  borderRadius: '40px 40px 0 0',
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.05)',
  
  // Smooth transition from banner
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-15px', // Reduced from -20px
    left: '50%',
    transform: 'translateX(-50%)',
    width: '60px',
    height: '6px',
    background: 'linear-gradient(90deg, #e5e7eb, #9ca3af, #e5e7eb)',
    borderRadius: '3px',
    zIndex: 1,
  }
}));

const ModernCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '24px',
  border: '1px solid rgba(26, 150, 152, 0.08)',
  boxShadow: '0 12px 40px rgba(26, 150, 152, 0.12)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, #1A9698, #1976d2, #3f51b5)',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 20px 50px rgba(26, 150, 152, 0.18)',
  }
}));


const ModernTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '16px',
    fontSize: '1.1rem',
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(26, 150, 152, 0.2)',
      borderWidth: '2px',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(26, 150, 152, 0.4)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1A9698',
      borderWidth: '2px',
      boxShadow: '0 0 0 4px rgba(26, 150, 152, 0.1)',
    },
    '&.Mui-focused': {
      background: 'rgba(255, 255, 255, 0.95)',
      transform: 'translateY(-2px)',
    },
  },
  '& .MuiInputLabel-root': {
    fontSize: '1.1rem',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#1A9698',
      fontWeight: 600,
    },
  },
  '& .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#1A9698',
    transition: 'all 0.3s ease',
  },
  '& .Mui-focused .MuiInputAdornment-root .MuiSvgIcon-root': {
    color: '#1976d2',
    transform: 'scale(1.1)',
  }
}));

const ModernButton = styled(Button)(({ theme }) => ({
  borderRadius: '50px',
  padding: '16px 48px',
  fontSize: '1.2rem',
  fontWeight: 600,
  textTransform: 'none',
  background: 'linear-gradient(135deg, #1A9698 0%, #1976d2 100%)',
  boxShadow: '0 8px 24px rgba(26, 150, 152, 0.3)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '0',
    height: '0',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.3)',
    transition: 'all 0.3s ease',
    transform: 'translate(-50%, -50%)',
  },
  '&:hover': {
    transform: 'translateY(-4px) scale(1.05)',
    boxShadow: '0 12px 32px rgba(26, 150, 152, 0.4)',
    background: 'linear-gradient(135deg, #1976d2 0%, #3f51b5 100%)',
    '&::before': {
      width: '300px',
      height: '300px',
      animation: `${ripple} 0.6s ease`,
    }
  },
  '&:disabled': {
    background: 'rgba(26, 150, 152, 0.3)',
    transform: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  }
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  fontFamily: "'Inter', 'Roboto', sans-serif",
  '&.hero-title': {
    fontFamily: "'Poppins', 'Inter', sans-serif",
    fontWeight: 800,
    fontSize: 'clamp(2rem, 5vw, 2.75rem)',
    color: '#111827',
    marginBottom: '1rem', // Reduced from 2rem
    letterSpacing: '-0.02em',
    position: 'relative',
    zIndex: 3,
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
    [theme.breakpoints.down('md')]: {
      fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
      marginBottom: '0.75rem', // Reduced
    },
    [theme.breakpoints.down('sm')]: {
      fontSize: 'clamp(1.5rem, 5vw, 2rem)',
      marginBottom: '0.5rem', // Reduced
    }
  },
  '&.hero-subtitle': {
    color: '#374151',
    lineHeight: 1.5, // Reduced from 1.7
    maxWidth: '600px', // Reduced from 700px
    margin: '0 auto',
    position: 'relative',
    zIndex: 3,
  },
  '&.hero-main-text': {
    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
    fontWeight: 500,
    marginBottom: '0.5rem', // Reduced from 0.75rem
    [theme.breakpoints.down('md')]: {
      fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
    }
  },
  '&.hero-sub-text': {
    fontSize: 'clamp(0.95rem, 2.5vw, 1.05rem)',
    fontWeight: 400,
    opacity: 0.8,
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.95rem',
    }
  },
  '&.section-title': {
    fontFamily: "'Poppins', 'Inter', sans-serif",
    fontWeight: 700,
    fontSize: 'clamp(1.8rem, 4vw, 2.2rem)',
    background: 'linear-gradient(135deg, #1A9698, #1976d2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center',
    marginBottom: '32px',
  }
}));

const FAQCard = styled(Paper)(({ theme }) => ({
  background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
  borderRadius: '16px',
  border: '1px solid rgba(26, 150, 152, 0.08)',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 24px rgba(26, 150, 152, 0.1)',
  }
}));

const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (inView) {
      setTimeout(() => setIsVisible(true), delay);
    }
  }, [inView, delay]);

  return (
    <Box
      ref={ref}
      sx={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {children}
    </Box>
  );
};

// FAQ data
const frequentQuestions = [
  {
    question: 'How do I find travel companions?',
    answer: 'Simply browse our community of verified travelers, or create your own trip and wait for companions to join you.'
  },
  {
    question: 'Is it safe to travel with strangers?',
    answer: 'All our users go through verification, and we provide safety guidelines and tips for meeting travel companions.'
  },
  {
    question: 'What if I need to cancel a trip?',
    answer: 'You can cancel trips through your dashboard. Please check our cancellation policy for specific terms.'
  },
  {
    question: 'How much does it cost to use the platform?',
    answer: 'Basic membership is free! Premium features are available for enhanced travel planning and priority support.'
  }
];

const quickActions = [
  { label: 'General Inquiry', icon: QuestionAnswerIcon },
  { label: 'Technical Support', icon: SupportIcon },
  { label: 'Feedback', icon: FeedbackIcon },
  { label: 'Partnership', icon: HelpIcon }
];

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });
  const [selectedAction, setSelectedAction] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [characterCount, setCharacterCount] = useState(0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (name === 'message') {
      setCharacterCount(value.length);
    }
  };

  const handleQuickAction = (action: string) => {
    setSelectedAction(action);
    setFormData(prev => ({
      ...prev,
      subject: action
    }));
  };

  const handleFAQToggle = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const clearForm = () => {
    setFormData({ subject: '', message: '' });
    setSelectedAction('');
    setCharacterCount(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the message to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Your message has been sent successfully! We\'ll get back to you within 24-48 hours.',
        severity: 'success'
      });
      
      // Clear form
      clearForm();
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to send message. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      
      {/* Enhanced Contact Banner */}
      <HeroSection className="contact-banner">
        <Container maxWidth="lg">
          <Fade in={true} timeout={1000}>
            <Box className="contact-content" sx={{ position: 'relative', zIndex: 3, maxWidth: '800px', margin: '0 auto' }}>
              <StyledTypography variant="h1" className="hero-title contact-heading">
                Contact Us
              </StyledTypography>
              <Box className="contact-description">
                <StyledTypography variant="h5" className="hero-subtitle hero-main-text contact-main-text">
                  Have a question or feedback? We'd love to hear from you.
                </StyledTypography>
                <StyledTypography variant="h6" className="hero-subtitle hero-sub-text contact-sub-text">
                  Get in touch and we'll respond as quickly as possible.
                </StyledTypography>
              </Box>
            </Box>
          </Fade>
        </Container>
      </HeroSection>

      {/* Main Content */}
      <ContentWrapper>
        <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          
          {/* Contact Form and FAQ Section - CSS Grid Layout */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '55fr 45fr',
              lg: '60fr 40fr',
              xl: '60fr 40fr'
            },
            gap: { xs: 3, md: '2rem', lg: '3rem' },
            alignItems: 'start',
            width: '100%',
            maxWidth: '100%'
          }}>
            {/* Contact Form */}
            <Box sx={{ 
              gridColumn: { xs: '1', md: '1' },
              width: '100%',
              maxWidth: '100%'
            }}>
              <AnimatedSection delay={600}>
                <ModernCard sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  maxWidth: '100%'
                }}>
                  <CardContent sx={{ 
                    p: { xs: 4, md: 5, lg: 6 },
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Typography variant="h4" sx={{
                      fontFamily: "'Poppins', 'Inter', sans-serif",
                      fontWeight: 700,
                      fontSize: 'clamp(1.8rem, 3vw, 2.2rem)',
                      textAlign: 'center',
                      mb: 3,
                      background: 'linear-gradient(135deg, #1A9698, #1976d2)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>
                      Send us a Message
                    </Typography>

                    {/* Quick Action Chips */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ mb: 2, color: '#64748b' }}>
                        Quick topics:
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {quickActions.map((action, index) => (
                          <Chip
                            key={index}
                            label={action.label}
                            icon={<action.icon />}
                            onClick={() => handleQuickAction(action.label)}
                            variant={selectedAction === action.label ? "filled" : "outlined"}
                            sx={{
                              bgcolor: selectedAction === action.label ? '#1A9698' : 'transparent',
                              color: selectedAction === action.label ? 'white' : '#1A9698',
                              borderColor: '#1A9698',
                              '&:hover': {
                                bgcolor: selectedAction === action.label ? '#1976d2' : 'rgba(26, 150, 152, 0.1)',
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <form onSubmit={handleSubmit}>
                      <Box sx={{ 
                        width: '100%',
                        maxWidth: '100%'
                      }}>
                        <ModernTextField
                          fullWidth
                          required
                          label="Subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          variant="outlined"
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SubjectIcon />
                              </InputAdornment>
                            ),
                            endAdornment: formData.subject && (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setFormData(prev => ({ ...prev, subject: '' }))} size="small">
                                  <ClearIcon />
                                </IconButton>
                              </InputAdornment>
                            )
                          }}
                        />

                        <ModernTextField
                          fullWidth
                          required
                          label="Message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          variant="outlined"
                          multiline
                          rows={6}
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 2 }}>
                                <MessageIcon />
                              </InputAdornment>
                            ),
                          }}
                          helperText={`${characterCount}/500 characters`}
                          inputProps={{ maxLength: 500 }}
                        />

                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 2,
                          mt: 4
                        }}>
                          <Button
                            onClick={clearForm}
                            variant="outlined"
                            size="large"
                            sx={{ 
                              color: '#64748b',
                              borderColor: '#64748b',
                              borderRadius: '50px',
                              padding: '12px 32px',
                              fontSize: '1.1rem',
                              fontWeight: 500,
                              textTransform: 'none',
                              '&:hover': {
                                borderColor: '#1A9698',
                                color: '#1A9698',
                                bgcolor: 'rgba(26, 150, 152, 0.05)'
                              }
                            }}
                            disabled={!formData.subject && !formData.message}
                          >
                            Clear Form
                          </Button>
                          
                          <ModernButton
                            type="submit"
                            variant="contained"
                            size="large"
                            disabled={isSubmitting || !formData.subject.trim() || !formData.message.trim()}
                            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                          >
                            {isSubmitting ? 'Sending...' : 'Send Message'}
                          </ModernButton>
                        </Box>
                      </Box>
                    </form>
                  </CardContent>
                </ModernCard>
              </AnimatedSection>
            </Box>

            {/* FAQ Section */}
            <Box sx={{ 
              gridColumn: { xs: '1', md: '2' },
              width: '100%',
              maxWidth: '100%',
              order: { xs: -1, md: 0 }
            }}>
              <AnimatedSection delay={800}>
                <Box sx={{ 
                  height: '100%',
                  width: '100%'
                }}>
                  <Typography variant="h5" sx={{
                    fontFamily: "'Poppins', 'Inter', sans-serif",
                    fontWeight: 700,
                    fontSize: 'clamp(1.5rem, 3vw, 1.8rem)',
                    background: 'linear-gradient(135deg, #1A9698, #1976d2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    mb: 3,
                    textAlign: 'center'
                  }}>
                    Frequently Asked Questions
                  </Typography>
                  
                  <Box sx={{ space: 2 }}>
                    {frequentQuestions.map((faq, index) => (
                      <FAQCard key={index} sx={{ mb: 2 }}>
                        <Box
                          onClick={() => handleFAQToggle(index)}
                          sx={{
                            p: 3,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            '&:hover': { bgcolor: 'rgba(26, 150, 152, 0.05)' }
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600,
                            color: '#1e293b',
                            pr: 2
                          }}>
                            {faq.question}
                          </Typography>
                          <Typography variant="h6" sx={{ 
                            color: '#1A9698',
                            transform: expandedFAQ === index ? 'rotate(45deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s ease'
                          }}>
                            +
                          </Typography>
                        </Box>
                        <Collapse in={expandedFAQ === index}>
                          <Box sx={{ px: 3, pb: 3 }}>
                            <Typography variant="body2" sx={{ 
                              color: '#64748b',
                              lineHeight: 1.6
                            }}>
                              {faq.answer}
                            </Typography>
                          </Box>
                        </Collapse>
                      </FAQCard>
                    ))}
                  </Box>
                </Box>
              </AnimatedSection>
            </Box>
          </Box>

          {/* Trust Indicators - Centered below both sections */}
          <Box sx={{ 
            mt: { xs: 4, md: 6 },
            display: 'flex',
            justifyContent: 'center',
            width: '100%'
          }}>
            <AnimatedSection delay={1000}>
              <Box sx={{ 
                width: '100%',
                textAlign: 'center', 
                p: { xs: 3, md: 4, lg: 5 }, 
                bgcolor: 'rgba(26, 150, 152, 0.05)', 
                borderRadius: '16px',
                boxShadow: '0 4px 16px rgba(26, 150, 152, 0.08)',
                border: '1px solid rgba(26, 150, 152, 0.1)'
              }}>
                <CheckCircleIcon sx={{ color: '#10b981', fontSize: '2rem', mb: 2 }} />
                <Typography variant="h6" sx={{ 
                  color: '#1e293b',
                  fontWeight: 600,
                  mb: 1,
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)'
                }}>
                  We're Here to Help
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#64748b',
                  lineHeight: 1.6,
                  fontSize: '1rem'
                }}>
                  Our friendly support team is standing by to assist you with any questions or concerns.
                </Typography>
              </Box>
            </AnimatedSection>
          </Box>

        </Container>
      </ContentWrapper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </>
  );
};

export default ContactUs; 