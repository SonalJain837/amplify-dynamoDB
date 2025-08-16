import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { WeatherInfo } from '../../types/dashboard';

interface WeatherWidgetProps {
  weatherData: WeatherInfo[];
  loading?: boolean;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weatherData, loading = false }) => {
  const getWeatherIcon = (condition: string): string => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return '☀️';
    } else if (lowerCondition.includes('cloud')) {
      return '☁️';
    } else if (lowerCondition.includes('rain')) {
      return '🌧️';
    } else if (lowerCondition.includes('snow')) {
      return '❄️';
    } else if (lowerCondition.includes('storm')) {
      return '⛈️';
    } else {
      return '🌤️';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
        }}
      >
        <CircularProgress size={32} sx={{ color: 'rgb(26, 150, 152)' }} />
      </Paper>
    );
  }

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
        <Typography
          variant="h6"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#1f2937',
            mb: 3
          }}
        >
          Weather at Destinations
        </Typography>

        {weatherData.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: '#6b7280'
            }}
          >
            <Typography variant="body2">
              No weather data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {weatherData.slice(0, 2).map((weather, index) => (
              <Box key={`${weather.city}-${index}`}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '8px',
                    border: '1px solid #f3f4f6',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                      borderColor: '#e5e7eb',
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 600,
                          color: '#1f2937'
                        }}
                      >
                        {weather.city}, {weather.country}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}
                      >
                        {weather.condition}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        sx={{
                          fontSize: '2rem',
                          lineHeight: 1
                        }}
                      >
                        {getWeatherIcon(weather.condition)}
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          fontSize: '2rem',
                          fontWeight: 600,
                          color: '#1f2937'
                        }}
                      >
                        {Math.round(weather.temperature)}°
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 3, mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}
                    >
                      Humidity: <span style={{ fontWeight: 600, color: '#1f2937' }}>{weather.humidity}%</span>
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}
                    >
                      Wind: <span style={{ fontWeight: 600, color: '#1f2937' }}>{weather.windSpeed} km/h</span>
                    </Typography>
                  </Box>

                  {weather.forecast && weather.forecast.length > 0 && (
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          mb: 1,
                          display: 'block'
                        }}
                      >
                        3-Day Forecast
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {weather.forecast.slice(0, 3).map((day) => (
                          <Box
                            key={day.date}
                            sx={{
                              flex: 1,
                              textAlign: 'center',
                              p: 1.5,
                              borderRadius: '6px',
                              backgroundColor: 'rgba(255, 255, 255, 0.5)'
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                color: '#6b7280',
                                fontWeight: 500,
                                display: 'block',
                                mb: 0.5
                              }}
                            >
                              {formatDate(day.date)}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: '1rem',
                                lineHeight: 1,
                                mb: 0.5
                              }}
                            >
                              {getWeatherIcon(day.condition)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontSize: '0.7rem',
                                color: '#1f2937',
                                fontWeight: 600
                              }}
                            >
                              {Math.round(day.high)}°/{Math.round(day.low)}°
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default WeatherWidget;