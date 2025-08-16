import { type Schema } from '../../amplify/data/resource';

export interface AirportData {
  IATA: string;
  ICAO?: string | null;
  airportName?: string | null;
  country?: string | null;
  city?: string | null;
  information?: string | null;
}

export interface EnhancedLocationDisplay {
  airportCode: string;
  cityName: string;
  countryName: string;
  displayText: string;
  shortDisplayText: string;
  fullDisplayText: string;
  // New clean format: CODE (City) - for hover tooltip
  cleanDisplayText: string;
}

/**
 * Maps airport code to enhanced location information
 */
export const getAirportLocationInfo = (
  airportCode: string,
  airportData: Schema["Airports"]["type"][]
): EnhancedLocationDisplay => {
  // Input validation
  if (!airportCode || typeof airportCode !== 'string') {
    return {
      airportCode: '',
      cityName: '',
      countryName: '',
      displayText: '',
      shortDisplayText: '',
      fullDisplayText: '',
      cleanDisplayText: ''
    };
  }

  const cleanCode = airportCode.trim().toUpperCase();
  
  // Handle edge case where airportData might be null or undefined
  const safeAirportData = Array.isArray(airportData) ? airportData : [];
  
  // Debugging: log if we have airport data
  if (safeAirportData.length === 0) {
    console.log(`No airport data available for ${cleanCode}, showing code only`);
  }
  
  const airport = safeAirportData.find(
    (ap) => ap?.IATA?.toUpperCase() === cleanCode
  );

  // If no airport found but we have data, log it for debugging
  if (!airport && safeAirportData.length > 0) {
    console.log(`Airport ${cleanCode} not found in ${safeAirportData.length} airports`);
  }

  const cityName = airport?.city?.trim() || '';
  const countryName = airport?.country?.trim() || '';
  
  // Create different display formats
  const hasLocationInfo = cityName && countryName;
  
  return {
    airportCode: cleanCode,
    cityName,
    countryName,
    // Option 1: SEA (Seattle, USA) - legacy format
    displayText: hasLocationInfo 
      ? `${cleanCode} (${cityName}, ${countryName})`
      : cleanCode,
    // Short format for mobile: Seattle, USA
    shortDisplayText: hasLocationInfo 
      ? `${cityName}, ${countryName}`
      : cleanCode,
    // Full format: Seattle, USA (SEA)
    fullDisplayText: hasLocationInfo 
      ? `${cityName}, ${countryName} (${cleanCode})`
      : cleanCode,
    // NEW: Clean format: SEA (Seattle) - city only, country in tooltip
    cleanDisplayText: hasLocationInfo 
      ? `${cleanCode} (${cityName})`
      : cleanCode
  };
};

/**
 * Batch process multiple airport codes for performance
 */
export const getMultipleAirportLocationInfo = (
  airportCodes: string[],
  airportData: Schema["Airports"]["type"][]
): Record<string, EnhancedLocationDisplay> => {
  const result: Record<string, EnhancedLocationDisplay> = {};
  
  // Create a lookup map for O(1) access
  const airportLookup = new Map();
  airportData.forEach(airport => {
    if (airport.IATA) {
      airportLookup.set(airport.IATA.toUpperCase(), airport);
    }
  });
  
  airportCodes.forEach(code => {
    if (code) {
      const upperCode = code.toUpperCase();
      const airport = airportLookup.get(upperCode);
      
      const cityName = airport?.city || '';
      const countryName = airport?.country || '';
      const hasLocationInfo = cityName && countryName;
      
      result[upperCode] = {
        airportCode: upperCode,
        cityName,
        countryName,
        displayText: hasLocationInfo 
          ? `${upperCode} (${cityName}, ${countryName})`
          : upperCode,
        shortDisplayText: hasLocationInfo 
          ? `${cityName}, ${countryName}`
          : upperCode,
        fullDisplayText: hasLocationInfo 
          ? `${cityName}, ${countryName} (${upperCode})`
          : upperCode,
        cleanDisplayText: hasLocationInfo 
          ? `${upperCode} (${cityName})`
          : upperCode
      };
    }
  });
  
  return result;
};

/**
 * Format layover cities as a comma-separated string with location info
 */
export const formatLayoverCities = (
  layoverCities: (string | null)[],
  airportData: Schema["Airports"]["type"][],
  format: 'short' | 'full' | 'display' = 'display'
): string => {
  if (!layoverCities || layoverCities.length === 0) {
    return '';
  }
  
  const validCities = layoverCities.filter((city): city is string => city !== null);
  if (validCities.length === 0) {
    return '';
  }
  
  const locationInfos = getMultipleAirportLocationInfo(validCities, airportData);
  
  return validCities
    .map(city => {
      const info = locationInfos[city.toUpperCase()];
      switch (format) {
        case 'short':
          return info?.shortDisplayText || city;
        case 'full':
          return info?.fullDisplayText || city;
        case 'display':
        default:
          return info?.displayText || city;
      }
    })
    .join(' • ');
};

/**
 * Create a cached airport lookup for better performance
 */
export class AirportCache {
  private static instance: AirportCache;
  private airportMap: Map<string, Schema["Airports"]["type"]> = new Map();
  private lastUpdated: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AirportCache {
    if (!AirportCache.instance) {
      AirportCache.instance = new AirportCache();
    }
    return AirportCache.instance;
  }

  updateCache(airportData: Schema["Airports"]["type"][]): void {
    this.airportMap.clear();
    airportData.forEach(airport => {
      if (airport.IATA) {
        this.airportMap.set(airport.IATA.toUpperCase(), airport);
      }
    });
    this.lastUpdated = Date.now();
  }

  getAirport(iataCode: string): Schema["Airports"]["type"] | undefined {
    return this.airportMap.get(iataCode.toUpperCase());
  }

  isExpired(): boolean {
    return Date.now() - this.lastUpdated > this.CACHE_DURATION;
  }

  getSize(): number {
    return this.airportMap.size;
  }
}