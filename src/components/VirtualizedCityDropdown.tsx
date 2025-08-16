import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Skeleton,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  LocationOn as LocationOnIcon,
  CheckCircle as CheckCircleIcon,
  FlightTakeoff as FlightTakeoffIcon,
  FlightLand as FlightLandIcon,
  ConnectingAirports as ConnectingAirportsIcon
} from '@mui/icons-material';
import { FixedSizeList as List } from 'react-window';
import { styled } from '@mui/material/styles';
// import { type Schema } from '../../amplify/data/resource';
import { useDebouncedSearch } from '../hooks/useDebounce';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';

// Types
interface CityOption {
  IATA: string;
  ICAO?: string | null;
  airportName?: string | null;
  country?: string | null;
  city?: string | null;
  information?: string | null;
  label: string;
  searchText: string;
}

interface VirtualizedCityDropdownProps {
  label: string;
  placeholder: string;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  options: Array<{
    IATA: string;
    ICAO?: string | null;
    airportName?: string | null;
    country?: string | null;
    city?: string | null;
    information?: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
  }>;
  isLoading?: boolean;
  error?: string;
  multiSelect?: boolean;
  maxSelections?: number;
  dropdownType: 'from' | 'to' | 'layover';
  disabled?: boolean;
  required?: boolean;
}

// Styled components
const DropdownContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: theme.spacing(2),
  '&:focus-within': {
    '& .dropdown-label': {
      color: theme.palette.primary.main,
    }
  }
}));

const StyledInputField = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'error' && prop !== 'dropdownType',
})<{ 
  error?: boolean; 
  dropdownType: 'from' | 'to' | 'layover';
}>(({ theme, error, dropdownType }) => {
  const getThemeColors = () => {
    switch (dropdownType) {
      case 'from':
        return {
          primary: '#2E7D32', // Green for departure
          light: '#E8F5E8',
          border: '#4CAF50'
        };
      case 'to':
        return {
          primary: '#1976D2', // Blue for arrival
          light: '#E3F2FD',
          border: '#2196F3'
        };
      case 'layover':
        return {
          primary: '#ED6C02', // Orange for layover
          light: '#FFF3E0',
          border: '#FF9800'
        };
    }
  };

  const colors = getThemeColors();

  return {
    minHeight: '56px',
    border: `1px solid ${error ? theme.palette.error.main : 'rgba(0, 0, 0, 0.23)'}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1, 1.5),
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: 'white',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    
    '&:hover': {
      borderColor: error ? theme.palette.error.main : colors.border,
      backgroundColor: colors.light,
    },
    
    '&:focus-within, &.focused': {
      borderColor: error ? theme.palette.error.main : colors.primary,
      borderWidth: '2px',
      padding: theme.spacing(1, 1.375), // Adjust padding for thicker border
      boxShadow: `0 0 0 1px ${colors.primary}20`,
    },
    
    [theme.breakpoints.down('sm')]: {
      minHeight: '48px',
      padding: theme.spacing(0.75, 1),
    }
  };
});

const VirtualizedDropdownPaper = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  maxHeight: '350px',
  zIndex: 1300,
  marginTop: theme.spacing(0.5),
  boxShadow: '0px 5px 15px rgba(0,0,0,0.2)',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  overflow: 'hidden', // Ensures unified appearance
  display: 'flex',
  flexDirection: 'column',
  
  [theme.breakpoints.down('sm')]: {
    left: theme.spacing(-1),
    right: theme.spacing(-1),
    maxHeight: '280px',
  }
}));

const SearchContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1),
  backgroundColor: theme.palette.grey[50],
}));

const LoadingContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

// Utility functions
const normalizeText = (text: string): string => 
  text.toLowerCase().replace(/[^a-z0-9]/g, '');

const highlightText = (text: string, searchTerm: string): React.ReactNode => {
  if (!searchTerm.trim()) return text;
  
  const normalizedSearch = normalizeText(searchTerm);
  const normalizedText = normalizeText(text);
  const index = normalizedText.indexOf(normalizedSearch);
  
  if (index === -1) return text;
  
  // Find actual positions in original text
  let actualStart = 0;
  let normalizedPos = 0;
  
  for (let i = 0; i < text.length && normalizedPos < index; i++) {
    if (/[a-z0-9]/i.test(text[i])) {
      normalizedPos++;
    }
    actualStart = i + 1;
  }
  
  let actualEnd = actualStart;
  let matchedChars = 0;
  
  for (let i = actualStart; i < text.length && matchedChars < normalizedSearch.length; i++) {
    if (/[a-z0-9]/i.test(text[i])) {
      matchedChars++;
    }
    actualEnd = i + 1;
  }
  
  return (
    <>
      {text.slice(0, actualStart)}
      <Box component="span" sx={{ backgroundColor: '#FFE082', fontWeight: 600 }}>
        {text.slice(actualStart, actualEnd)}
      </Box>
      {text.slice(actualEnd)}
    </>
  );
};

// Virtualized list item component
const VirtualizedListItem = memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    items: CityOption[];
    onSelect: (option: CityOption) => void;
    selectedValues: string[];
    searchTerm: string;
    dropdownType: 'from' | 'to' | 'layover';
  };
}>(({ index, style, data }) => {
  const { items, onSelect, selectedValues, searchTerm, dropdownType } = data;
  const option = items[index];
  const isSelected = selectedValues.includes(option.IATA);
  
  const getIcon = () => {
    if (isSelected) return <CheckCircleIcon sx={{ fontSize: 18, color: '#4CAF50' }} />;
    
    switch (dropdownType) {
      case 'from':
        return <FlightTakeoffIcon sx={{ fontSize: 18, color: '#2E7D32' }} />;
      case 'to':
        return <FlightLandIcon sx={{ fontSize: 18, color: '#1976D2' }} />;
      case 'layover':
        return <ConnectingAirportsIcon sx={{ fontSize: 18, color: '#ED6C02' }} />;
      default:
        return <LocationOnIcon sx={{ fontSize: 18 }} />;
    }
  };

  return (
    <div style={style}>
      <MenuItem
        onClick={() => onSelect(option)}
        selected={isSelected}
        sx={{
          py: 1,
          px: 2,
          '&:hover': {
            backgroundColor: 'rgba(25, 118, 210, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(76, 175, 80, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(76, 175, 80, 0.12)',
            }
          }
        }}
      >
        <ListItemIcon sx={{ minWidth: 32 }}>
          {getIcon()}
        </ListItemIcon>
        <ListItemText
          primary={
            <Box>
              {highlightText(`${option.city} (${option.IATA})`, searchTerm)}
              {option.country && (
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                  {option.country}
                </Typography>
              )}
            </Box>
          }
          sx={{
            '& .MuiListItemText-primary': {
              fontWeight: isSelected ? 600 : 400,
              color: isSelected ? '#2E7D32' : 'inherit',
            }
          }}
        />
      </MenuItem>
    </div>
  );
});

VirtualizedListItem.displayName = 'VirtualizedListItem';

// Main component
const VirtualizedCityDropdown: React.FC<VirtualizedCityDropdownProps> = memo(({
  label,
  placeholder,
  value,
  onChange,
  options,
  isLoading = false,
  error,
  multiSelect = false,
  maxSelections = 3,
  dropdownType,
  disabled = false,
  required = false
}) => {
  // Performance monitoring
  usePerformanceMonitor('VirtualizedCityDropdown', [options, value]);
  
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Debounced search
  const { debouncedSearchTerm, isSearching } = useDebouncedSearch(searchTerm, 300);
  
  // Memoized options processing
  const processedOptions = useMemo(() => {
    return options.map(option => ({
      ...option,
      label: `${option.city} - ${option.IATA}`,
      searchText: `${option.city} ${option.IATA} ${option.country || ''}`.toLowerCase()
    }));
  }, [options]);
  
  // Memoized filtered options
  const filteredOptions = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return processedOptions.slice(0, 100); // Limit initial display for performance
    }
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return processedOptions
      .filter(option => option.searchText.includes(searchLower))
      .slice(0, 50); // Limit search results
  }, [processedOptions, debouncedSearchTerm]);
  
  // Get selected values as array
  const selectedValues = useMemo(() => {
    return Array.isArray(value) ? value : value ? [value] : [];
  }, [value]);
  
  // Get selected options for display
  const selectedOptions = useMemo(() => {
    return processedOptions.filter(option => selectedValues.includes(option.IATA));
  }, [processedOptions, selectedValues]);
  
  // Handle option selection
  const handleSelect = useCallback((option: CityOption) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      const isAlreadySelected = currentValues.includes(option.IATA);
      
      if (isAlreadySelected) {
        onChange(currentValues.filter(v => v !== option.IATA));
      } else if (currentValues.length < maxSelections) {
        onChange([...currentValues, option.IATA]);
      }
    } else {
      onChange(option.IATA);
      setIsOpen(false);
      setSearchTerm('');
    }
  }, [multiSelect, value, onChange, maxSelections]);
  
  // Handle chip deletion
  const handleChipDelete = useCallback((valueToDelete: string) => {
    if (multiSelect && Array.isArray(value)) {
      onChange(value.filter(v => v !== valueToDelete));
    }
  }, [multiSelect, value, onChange]);
  
  // Handle clear all
  const handleClearAll = useCallback(() => {
    onChange(multiSelect ? [] : '');
  }, [multiSelect, onChange]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Get icon for field type
  const getFieldIcon = () => {
    switch (dropdownType) {
      case 'from':
        return <FlightTakeoffIcon sx={{ color: '#2E7D32', fontSize: 20 }} />;
      case 'to':
        return <FlightLandIcon sx={{ color: '#1976D2', fontSize: 20 }} />;
      case 'layover':
        return <ConnectingAirportsIcon sx={{ color: '#ED6C02', fontSize: 20 }} />;
    }
  };
  
  return (
    <DropdownContainer ref={containerRef}>
      {/* Label */}
      <Typography
        variant="caption"
        className="dropdown-label"
        sx={{
          position: 'absolute',
          top: -8,
          left: 12,
          backgroundColor: 'white',
          px: 0.5,
          fontSize: 12,
          fontWeight: 500,
          color: error ? 'error.main' : 'text.secondary',
          zIndex: 1,
          transition: 'color 0.2s ease-in-out'
        }}
      >
        {label}{required && ' *'}
      </Typography>
      
      {/* Main Input Field */}
      <StyledInputField
        onClick={() => !disabled && setIsOpen(!isOpen)}
        error={!!error}
        dropdownType={dropdownType}
        className={isOpen ? 'focused' : ''}
        sx={{
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {getFieldIcon()}
        
        <Box sx={{ flexGrow: 1 }}>
          {selectedOptions.length === 0 ? (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {placeholder}
            </Typography>
          ) : multiSelect ? (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selectedOptions.map((option) => (
                <Chip
                  key={option.IATA}
                  label={`${option.city} (${option.IATA})`}
                  onDelete={() => handleChipDelete(option.IATA)}
                  size="small"
                  sx={{
                    backgroundColor: '#E8F5E8',
                    '& .MuiChip-deleteIcon': { fontSize: 16 }
                  }}
                />
              ))}
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {selectedOptions[0]?.city}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {selectedOptions[0]?.IATA}
              </Typography>
            </Box>
          )}
        </Box>
        
        {multiSelect && selectedValues.length > 0 && (
          <Typography variant="caption" sx={{ color: 'text.secondary', mr: 1 }}>
            {selectedValues.length}/{maxSelections}
          </Typography>
        )}
        
        {isLoading && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Skeleton variant="circular" width={20} height={20} />
          </Box>
        )}
      </StyledInputField>
      
      {/* Dropdown */}
      {isOpen && !disabled && (
        <VirtualizedDropdownPaper>
          {/* Unified Search and Results Container */}
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '200px' }}>
            {/* Search Section - Seamlessly integrated */}
            <SearchContainer>
              <TextField
                fullWidth
                size="small"
                placeholder="Search cities or airport codes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18 }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchTerm('')}>
                        <ClearIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                autoFocus
              />
              {isSearching && (
                <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5 }}>
                  Searching...
                </Typography>
              )}
            </SearchContainer>
            
            {/* Unified Results List - includes Clear All as first item when applicable */}
            {isLoading ? (
              <LoadingContainer>
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} variant="rectangular" height={48} />
                ))}
              </LoadingContainer>
            ) : (
              <Box sx={{ flex: 1, overflowY: 'auto' }}>
                {/* Clear All Button integrated into the list when applicable */}
                {multiSelect && selectedValues.length > 0 && (
                  <MenuItem 
                    onClick={handleClearAll} 
                    sx={{ 
                      color: 'error.main', 
                      backgroundColor: 'rgba(211, 47, 47, 0.04)',
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 0.08)'
                      },
                      mx: 1,
                      my: 0.5,
                      borderRadius: 1
                    }}
                  >
                    <ListItemIcon>
                      <ClearIcon sx={{ fontSize: 18, color: 'error.main' }} />
                    </ListItemIcon>
                    <ListItemText primary="Clear All Selections" />
                  </MenuItem>
                )}
                
                {/* Airport/City Results */}
                {filteredOptions.length === 0 ? (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      {debouncedSearchTerm ? 'No cities found matching your search' : 'No cities available'}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, minHeight: 0 }}>
                    <List
                      height={Math.min(filteredOptions.length * 64, 240)}
                      width="100%"
                      itemCount={filteredOptions.length}
                      itemSize={64}
                      itemData={{
                        items: filteredOptions,
                        onSelect: handleSelect,
                        selectedValues,
                        searchTerm: debouncedSearchTerm,
                        dropdownType
                      }}
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#888 #f1f1f1'
                      }}
                    >
                      {VirtualizedListItem}
                    </List>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </VirtualizedDropdownPaper>
      )}
      
      {/* Error Message */}
      {error && (
        <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5, fontSize: 12 }}>
          {error}
        </Typography>
      )}
    </DropdownContainer>
  );
});

VirtualizedCityDropdown.displayName = 'VirtualizedCityDropdown';

export default VirtualizedCityDropdown;