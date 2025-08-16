import { useState, useEffect, useMemo } from 'react';
import airportService from '../services/airportService';

export interface AirportDisplayInfo {
  airportCode: string;
  cityName: string;
  countryName: string;
  displayText: string;
  cleanDisplayText: string;
  hasLocationData: boolean;
}

export const useAirportData = () => {
  const [isLoading, setIsLoading] = useState(!airportService.isDataLoaded());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (airportService.isDataLoaded()) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await airportService.loadAirportData();
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load airport data:', err);
        setError('Failed to load airport information');
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to data loading completion
    airportService.onDataLoaded(() => {
      setIsLoading(false);
    });
  }, []);

  const getAirportDisplayInfo = useMemo(() => {
    return (airportCode: string): AirportDisplayInfo => {
      if (!airportCode) {
        return {
          airportCode: '',
          cityName: '',
          countryName: '',
          displayText: '',
          cleanDisplayText: '',
          hasLocationData: false
        };
      }

      const cleanCode = airportCode.trim().toUpperCase();
      const airportInfo = airportService.getAirportInfo(cleanCode);
      
      const cityName = airportInfo?.city || '';
      const countryName = airportInfo?.country || '';
      const hasLocationData = Boolean(cityName && countryName);
      
      return {
        airportCode: cleanCode,
        cityName,
        countryName,
        displayText: hasLocationData 
          ? `${cleanCode} (${cityName}, ${countryName})`
          : cleanCode,
        cleanDisplayText: hasLocationData 
          ? `${cleanCode} (${cityName})`
          : cleanCode,
        hasLocationData
      };
    };
  }, []);

  const getMultipleAirportInfo = useMemo(() => {
    return (airportCodes: string[]): Record<string, AirportDisplayInfo> => {
      const result: Record<string, AirportDisplayInfo> = {};
      
      airportCodes.forEach(code => {
        if (code) {
          const info = getAirportDisplayInfo(code);
          result[code.toUpperCase()] = info;
        }
      });
      
      return result;
    };
  }, [getAirportDisplayInfo]);

  return {
    isLoading,
    error,
    getAirportDisplayInfo,
    getMultipleAirportInfo,
    cacheSize: airportService.getCacheSize(),
    isDataLoaded: airportService.isDataLoaded()
  };
};

export default useAirportData;