import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  ClickAwayListener,
  Typography,
  Button,
  Grid
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Today as TodayIcon,
  Clear as ClearIcon,
  ChevronLeft,
  ChevronRight
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { dateFormatter } from '../utils/dateFormatter';

interface CustomDateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  disabled?: boolean;
}

// Styled components
const DateInputContainer = styled(Box)({
  position: 'relative',
  width: '100%',
});

const CalendarPopup = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  zIndex: 1300,
  marginTop: '8px',
  padding: '16px',
  borderRadius: '12px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  maxWidth: '320px',
}));

const CalendarHeader = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
});

const CalendarDay = styled(Button)<{ isToday?: boolean; isSelected?: boolean; isPast?: boolean }>(
  ({ theme, isToday, isSelected, isPast }) => ({
    minWidth: '36px',
    height: '36px',
    padding: 0,
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: isSelected ? 600 : 400,
    color: isPast 
      ? 'rgba(0, 0, 0, 0.3)' 
      : isSelected 
        ? '#FFFFFF' 
        : isToday 
          ? '#1976d2' 
          : 'rgba(0, 0, 0, 0.87)',
    backgroundColor: isSelected 
      ? '#1976d2' 
      : isToday 
        ? 'rgba(25, 118, 210, 0.08)' 
        : 'transparent',
    '&:hover': {
      backgroundColor: isPast 
        ? 'transparent' 
        : isSelected 
          ? '#1565c0' 
          : 'rgba(25, 118, 210, 0.08)',
    },
    '&:disabled': {
      color: 'rgba(0, 0, 0, 0.26)',
      cursor: 'not-allowed',
    },
  })
);

const QuickActionButton = styled(Button)({
  fontSize: '12px',
  padding: '4px 8px',
  minWidth: 'auto',
  borderRadius: '6px',
});

export const CustomDateInput: React.FC<CustomDateInputProps> = ({
  label,
  value,
  onChange,
  error = false,
  helperText,
  required = false,
  fullWidth = true,
  margin = 'normal',
  disabled = false,
}) => {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Month names for calendar header
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Update internal state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with formatting
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    const formattedValue = dateFormatter.formatInputValue(rawValue);
    
    setInputValue(formattedValue);
    onChange(formattedValue);
    
    // Real-time validation
    if (formattedValue) {
      const error = dateFormatter.getValidationError(formattedValue);
      setValidationError(error);
    } else {
      setValidationError(null);
    }
  };

  // Handle input blur (final validation)
  const handleInputBlur = () => {
    if (inputValue) {
      const error = dateFormatter.getValidationError(inputValue);
      setValidationError(error);
    }
  };

  // Handle input focus (clear validation error)
  const handleInputFocus = () => {
    setValidationError(null);
  };

  // Toggle calendar popup
  const toggleCalendar = () => {
    if (disabled) return;
    setCalendarOpen(!calendarOpen);
  };

  // Close calendar
  const closeCalendar = () => {
    setCalendarOpen(false);
  };

  // Navigate calendar month
  const navigateCalendar = (direction: number) => {
    const newDate = new Date(currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentCalendarDate(newDate);
  };

  // Select date from calendar
  const selectDate = (date: Date) => {
    const formatted = dateFormatter.formatDate(date);
    setInputValue(formatted);
    onChange(formatted);
    setValidationError(null);
    closeCalendar();
  };

  // Set today's date
  const setToday = () => {
    const today = dateFormatter.getTodayFormatted();
    setInputValue(today);
    onChange(today);
    setValidationError(null);
  };

  // Clear date
  const clearDate = () => {
    setInputValue('');
    onChange('');
    setValidationError(null);
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = dateFormatter.parseDate(inputValue);
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const isCurrentMonth = date.getMonth() === month;
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
      const isPast = date < today;
      
      days.push(
        <CalendarDay
          key={i}
          onClick={() => !isPast && selectDate(date)}
          disabled={isPast}
          isToday={isToday}
          isSelected={!!isSelected}
          isPast={isPast}
          sx={{
            opacity: isCurrentMonth ? 1 : 0.3,
          }}
        >
          {date.getDate()}
        </CalendarDay>
      );
    }
    
    return days;
  };

  const displayError = error || Boolean(validationError);
  const displayHelperText = validationError || helperText || 'Format: DD-MON-YYYY (e.g., 15-JAN-2024)';

  return (
    <DateInputContainer>
      <ClickAwayListener onClickAway={closeCalendar}>
        <Box>
          <TextField
            ref={inputRef}
            label={label}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            error={displayError}
            helperText={displayHelperText}
            required={required}
            fullWidth={fullWidth}
            margin={margin}
            disabled={disabled}
            placeholder="DD-MON-YYYY"
            inputProps={{
              maxLength: 11,
              style: { 
                fontFamily: 'Monaco, Menlo, monospace',
                fontSize: '14px',
                letterSpacing: '0.5px'
              }
            }}
            InputProps={{
              endAdornment: (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {inputValue && (
                    <IconButton
                      size="small"
                      onClick={clearDate}
                      disabled={disabled}
                      sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                    >
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    onClick={toggleCalendar}
                    disabled={disabled}
                    sx={{ color: 'rgba(0, 0, 0, 0.54)' }}
                  >
                    <CalendarIcon fontSize="small" />
                  </IconButton>
                </Box>
              ),
            }}
          />

          {calendarOpen && (
            <CalendarPopup>
              <CalendarHeader>
                <IconButton
                  size="small"
                  onClick={() => navigateCalendar(-1)}
                >
                  <ChevronLeft />
                </IconButton>
                
                <Typography variant="subtitle1" fontWeight={600}>
                  {monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}
                </Typography>
                
                <IconButton
                  size="small"
                  onClick={() => navigateCalendar(1)}
                >
                  <ChevronRight />
                </IconButton>
              </CalendarHeader>

              {/* Quick action buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <QuickActionButton
                  variant="outlined"
                  size="small"
                  startIcon={<TodayIcon />}
                  onClick={setToday}
                >
                  Today
                </QuickActionButton>
                {inputValue && (
                  <QuickActionButton
                    variant="outlined"
                    size="small"
                    startIcon={<ClearIcon />}
                    onClick={clearDate}
                    color="error"
                  >
                    Clear
                  </QuickActionButton>
                )}
              </Box>

              {/* Day names header */}
              <Grid container spacing={0} sx={{ mb: 1 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <Box key={day} sx={{ textAlign: 'center', display: 'inline-block', width: '14.28%' }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      {day}
                    </Typography>
                  </Box>
                ))}
              </Grid>

              {/* Calendar days */}
              <Grid container spacing={0}>
                {generateCalendarDays().map((day, index) => (
                  <Box key={index} sx={{ textAlign: 'center', p: 0.25, display: 'inline-block', width: '14.28%' }}>
                    {day}
                  </Box>
                ))}
              </Grid>

              {/* Format help */}
              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(0, 0, 0, 0.08)' }}>
                <Typography variant="caption" color="text.secondary">
                  Format: DD-MON-YYYY (e.g., 15-JAN-2024)
                </Typography>
              </Box>
            </CalendarPopup>
          )}
        </Box>
      </ClickAwayListener>
    </DateInputContainer>
  );
};