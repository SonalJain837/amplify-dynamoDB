import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';

interface TravelTip {
  id: string;
  title: string;
  description: string;
  category: 'packing' | 'booking' | 'safety' | 'cultural' | 'financial';
}

interface TravelTipsWidgetProps {
  tips?: TravelTip[];
}

const TravelTipsWidget: React.FC<TravelTipsWidgetProps> = ({ tips = [] }) => {
  const defaultTips: TravelTip[] = [
    {
      id: '1',
      title: 'Book flights in advance',
      description: 'Save up to 40% by booking flights 6-8 weeks before domestic travel and 2-3 months for international trips.',
      category: 'booking'
    },
    {
      id: '2',
      title: 'Pack light and smart',
      description: 'Choose versatile clothing items that can be mixed and matched. Roll clothes instead of folding to save space.',
      category: 'packing'
    },
    {
      id: '3',
      title: 'Research local customs',
      description: 'Understanding local etiquette and customs helps you respect the culture and avoid unintentional offense.',
      category: 'cultural'
    },
    {
      id: '4',
      title: 'Notify your bank',
      description: 'Inform your bank about travel plans to prevent your cards from being blocked due to unusual activity.',
      category: 'financial'
    },
    {
      id: '5',
      title: 'Keep copies of documents',
      description: 'Store digital copies of passport, visas, and important documents in cloud storage as backup.',
      category: 'safety'
    }
  ];

  const getCategoryColor = (category: TravelTip['category']): string => {
    switch (category) {
      case 'booking':
        return 'rgb(26, 150, 152)';
      case 'packing':
        return '#f59e0b';
      case 'safety':
        return '#ef4444';
      case 'cultural':
        return '#8b5cf6';
      case 'financial':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getCategoryIcon = (category: TravelTip['category']): string => {
    switch (category) {
      case 'booking':
        return '🎫';
      case 'packing':
        return '🎒';
      case 'safety':
        return '🛡️';
      case 'cultural':
        return '🌍';
      case 'financial':
        return '💳';
      default:
        return '💡';
    }
  };

  const displayTips = tips.length > 0 ? tips : defaultTips;
  const [currentTipIndex, setCurrentTipIndex] = React.useState(0);
  const currentTip = displayTips[currentTipIndex];

  const nextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % displayTips.length);
  };

  const prevTip = () => {
    setCurrentTipIndex((prev) => (prev - 1 + displayTips.length) % displayTips.length);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#1f2937'
            }}
          >
            Travel Tips
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              size="small"
              onClick={prevTip}
              sx={{
                minWidth: '32px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }
              }}
            >
              ‹
            </Button>
            <Button
              size="small"
              onClick={nextTip}
              sx={{
                minWidth: '32px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                color: '#6b7280',
                '&:hover': {
                  backgroundColor: '#f3f4f6',
                  color: '#1f2937'
                }
              }}
            >
              ›
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            p: 3,
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${getCategoryColor(currentTip.category)}08 0%, ${getCategoryColor(currentTip.category)}04 100%)`,
            border: `1px solid ${getCategoryColor(currentTip.category)}20`,
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: getCategoryColor(currentTip.category),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                flexShrink: 0
              }}
            >
              {getCategoryIcon(currentTip.category)}
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: '#1f2937',
                flex: 1
              }}
            >
              {currentTip.title}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem',
              color: '#4b5563',
              lineHeight: 1.6,
              mb: 2
            }}
          >
            {currentTip.description}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: getCategoryColor(currentTip.category),
                fontWeight: 600,
                textTransform: 'capitalize',
                backgroundColor: `${getCategoryColor(currentTip.category)}15`,
                padding: '4px 8px',
                borderRadius: '12px'
              }}
            >
              {currentTip.category} tip
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.75rem',
                color: '#9ca3af'
              }}
            >
              {currentTipIndex + 1} of {displayTips.length}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default TravelTipsWidget;