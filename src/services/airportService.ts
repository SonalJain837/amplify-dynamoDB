import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';

export interface OptimizedAirportData {
  IATA: string;
  city: string;
  country: string;
  airportName?: string;
}

class AirportService {
  private static instance: AirportService;
  private airportCache: Map<string, OptimizedAirportData> = new Map();
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private loadingCallbacks: Array<() => void> = [];
  
  static getInstance(): AirportService {
    if (!AirportService.instance) {
      AirportService.instance = new AirportService();
    }
    return AirportService.instance;
  }

  async loadAirportData(): Promise<void> {
    // If already loaded, return immediately
    if (this.airportCache.size > 0) {
      return Promise.resolve();
    }

    // If already loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    this.loadPromise = this.fetchAirportData();
    
    try {
      await this.loadPromise;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
      // Notify all waiting callbacks
      this.loadingCallbacks.forEach(callback => callback());
      this.loadingCallbacks = [];
    }
  }

  private async fetchAirportData(): Promise<void> {
    try {
      const client = generateClient<Schema>();
      let allAirports: Schema["Airports"]["type"][] = [];
      let nextToken;
      
      console.log('🛫 Loading airport data...');
      const startTime = performance.now();
      
      do {
        const result: any = await client.models.Airports.list({
          limit: 1000,
          nextToken
        });
        if (result.data) {
          allAirports = allAirports.concat(result.data);
        }
        nextToken = result.nextToken;
      } while (nextToken);
      
      // Build optimized cache
      allAirports.forEach(airport => {
        if (airport.IATA) {
          this.airportCache.set(airport.IATA.toUpperCase(), {
            IATA: airport.IATA.toUpperCase(),
            city: airport.city?.trim() || '',
            country: airport.country?.trim() || '',
            airportName: airport.airportName?.trim() || ''
          });
        }
      });
      
      const loadTime = performance.now() - startTime;
      console.log(`✅ Airport data loaded: ${this.airportCache.size} airports in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Error loading airport data:', error);
      throw error;
    }
  }

  getAirportInfo(iataCode: string): OptimizedAirportData | null {
    if (!iataCode) return null;
    
    const cleanCode = iataCode.trim().toUpperCase();
    const airport = this.airportCache.get(cleanCode);
    
    if (!airport && this.airportCache.size > 0) {
      console.warn(`⚠️ Airport ${cleanCode} not found in cache of ${this.airportCache.size} airports`);
    }
    
    return airport || null;
  }

  getAllAirports(): OptimizedAirportData[] {
    return Array.from(this.airportCache.values());
  }

  isDataLoaded(): boolean {
    return this.airportCache.size > 0;
  }

  getCacheSize(): number {
    return this.airportCache.size;
  }

  // Subscribe to loading completion
  onDataLoaded(callback: () => void): void {
    if (this.isDataLoaded()) {
      callback();
    } else {
      this.loadingCallbacks.push(callback);
    }
  }

  // Preload common airports for instant display
  getCommonAirports(): string[] {
    return [
      'JFK', 'LAX', 'ORD', 'DFW', 'DEN', 'LAS', 'PHX', 'ATL', 'IAH', 'MCO',
      'SEA', 'SFO', 'BOS', 'LGA', 'EWR', 'MIA', 'CLT', 'MSP', 'DTW', 'PHL',
      'LHR', 'CDG', 'FRA', 'AMS', 'MAD', 'FCO', 'ZUR', 'VIE', 'MUC', 'ARN',
      'BOM', 'DEL', 'BLR', 'MAA', 'CCU', 'HYD', 'PNQ', 'AMD', 'COK', 'GAU',
      'NRT', 'HND', 'ICN', 'PVG', 'PEK', 'CAN', 'HKG', 'TPE', 'BKK', 'SIN'
    ];
  }
}

export default AirportService.getInstance();