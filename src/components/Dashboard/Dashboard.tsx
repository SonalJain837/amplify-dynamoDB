import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid } from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../../amplify/data/resource';

import QuickStatsCard from './QuickStatsCard';
import RecentActivityFeed from './RecentActivityFeed';
import QuickActionButtons from './QuickActionButtons';
import FlightStatusTracker from './FlightStatusTracker';
import WeatherWidget from './WeatherWidget';
import BookingSummaryWidget from './BookingSummaryWidget';
import TravelTipsWidget from './TravelTipsWidget';

import {
  DashboardData,
  TripStats,
  ActivityItem,
  FlightStatus,
  WeatherInfo,
  QuickAction,
  BookingSummary
} from '../../types/dashboard';

interface DashboardProps {
  trips: any[];
  onAddTrip: () => void;
  onViewComments: (tripId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ trips, onAddTrip, onViewComments }) => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: { totalTrips: 0, upcomingFlights: 0, countriesVisited: 0 },
    activities: [],
    flightStatus: [],
    weather: [],
    bookingSummary: { upcomingTrips: [], pendingBookings: 0, completedTrips: 0 }
  });
  const [loading, setLoading] = useState(true);

  // Calculate trip statistics from provided trips data
  const calculateTripStats = useCallback((): TripStats => {
    const uniqueCountries = new Set();
    let upcomingFlights = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    trips.forEach((trip) => {
      // Extract country from city names or airport codes
      if (trip.from) {
        uniqueCountries.add(trip.from);
      }
      if (trip.to) {
        uniqueCountries.add(trip.to);
      }
      if (trip.layover) {
        const layovers = Array.isArray(trip.layover) ? trip.layover : [trip.layover];
        layovers.forEach((layover: string) => uniqueCountries.add(layover));
      }

      // Count upcoming flights
      const tripDate = new Date(trip.date);
      if (tripDate >= today) {
        upcomingFlights++;
      }
    });

    return {
      totalTrips: trips.length,
      upcomingFlights,
      countriesVisited: uniqueCountries.size
    };
  }, [trips]);

  // Generate mock activity data based on trips
  const generateActivities = useCallback((): ActivityItem[] => {
    const activities: ActivityItem[] = [];
    const now = new Date();

    // Create sample activities based on existing trips
    trips.slice(0, 5).forEach((trip, index) => {
      const timestamp = new Date(now.getTime() - (index + 1) * 3600000 * (Math.random() * 48 + 1));
      
      activities.push({
        id: `activity-${trip.id}-${index}`,
        type: index % 4 === 0 ? 'trip_added' : index % 4 === 1 ? 'comment_added' : index % 4 === 2 ? 'trip_updated' : 'booking_confirmed',
        description: `Trip from ${trip.from} to ${trip.to} ${index % 4 === 0 ? 'was added' : index % 4 === 1 ? 'received a comment' : index % 4 === 2 ? 'was updated' : 'booking was confirmed'}`,
        timestamp: timestamp.toISOString(),
        tripId: trip.id,
        details: trip.flight ? `Flight: ${trip.flight.substring(0, 50)}...` : undefined
      });
    });

    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [trips]);

  // Generate mock flight status data
  const generateFlightStatus = useCallback((): FlightStatus[] => {
    const upcomingTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      const today = new Date();
      return tripDate >= today;
    }).slice(0, 3);

    return upcomingTrips.map((trip, index) => ({
      flightNumber: trip.flight?.split(' ')[0] || `FL${Math.floor(Math.random() * 9000) + 1000}`,
      airline: 'Travel Airlines',
      departure: {
        airport: trip.from,
        city: trip.from,
        time: trip.time || '10:00',
        date: trip.date
      },
      arrival: {
        airport: trip.to,
        city: trip.to,
        time: '14:00',
        date: trip.date
      },
      status: (['on-time', 'delayed', 'boarding'] as const)[Math.floor(Math.random() * 3)],
      gate: `A${Math.floor(Math.random() * 20) + 1}`,
      terminal: `T${Math.floor(Math.random() * 3) + 1}`
    }));
  }, [trips]);

  // Generate mock weather data
  const generateWeatherData = useCallback((): WeatherInfo[] => {
    const upcomingDestinations = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      const today = new Date();
      return tripDate >= today;
    }).slice(0, 2);

    return upcomingDestinations.map(trip => ({
      city: trip.to,
      country: 'Country',
      temperature: Math.floor(Math.random() * 25) + 10,
      condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      forecast: Array.from({ length: 3 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return {
          date: date.toISOString(),
          high: Math.floor(Math.random() * 10) + 20,
          low: Math.floor(Math.random() * 10) + 10,
          condition: ['Sunny', 'Cloudy', 'Partly Cloudy'][Math.floor(Math.random() * 3)]
        };
      })
    }));
  }, [trips]);

  // Generate booking summary
  const generateBookingSummary = useCallback((): BookingSummary => {
    const today = new Date();
    const upcomingTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate >= today;
    });

    const completedTrips = trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return tripDate < today;
    });

    return {
      upcomingTrips: upcomingTrips.slice(0, 3).map(trip => ({
        id: trip.id,
        destination: `${trip.from} → ${trip.to}`,
        departureDate: trip.date,
        status: trip.booked === 'Y' ? 'confirmed' as const : 'pending' as const
      })),
      pendingBookings: upcomingTrips.filter(trip => trip.booked !== 'Y').length,
      completedTrips: completedTrips.length,
      totalSpent: Math.floor(Math.random() * 10000) + 5000
    };
  }, [trips]);

  // Define quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'add-trip',
      title: 'Add New Trip',
      description: 'Plan your next adventure',
      action: onAddTrip,
      color: '#f59e0b'
    },
    {
      id: 'view-comments',
      title: 'View Comments',
      description: 'See recent discussions',
      action: () => onViewComments(''),
      color: 'rgb(26, 150, 152)',
      count: Math.floor(Math.random() * 10) + 1
    },
    {
      id: 'search-flights',
      title: 'Search Flights',
      description: 'Find the best deals',
      action: () => {},
      color: '#6366f1'
    },
    {
      id: 'weather-alerts',
      title: 'Weather Alerts',
      description: 'Check destination weather',
      action: () => {},
      color: '#10b981'
    }
  ];

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Calculate real data from trips
      const stats = calculateTripStats();
      const activities = generateActivities();
      const flightStatus = generateFlightStatus();
      const weather = generateWeatherData();
      const bookingSummary = generateBookingSummary();

      setDashboardData({
        stats,
        activities,
        flightStatus,
        weather,
        bookingSummary
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [calculateTripStats, generateActivities, generateFlightStatus, generateWeatherData, generateBookingSummary]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <Box sx={{ width: '100%' }}>
      {/* Stats Overview */}
      <Box sx={{ mb: 4 }}>
        <QuickStatsCard stats={dashboardData.stats} loading={loading} />
      </Box>

      {/* Main Dashboard Grid */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Recent Activity */}
            <RecentActivityFeed activities={dashboardData.activities} loading={loading} />
            
            {/* Quick Actions */}
            <QuickActionButtons actions={quickActions} />
            
            {/* Flight Status */}
            <FlightStatusTracker flights={dashboardData.flightStatus} loading={loading} />
          </Box>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Weather Widget */}
            <WeatherWidget weatherData={dashboardData.weather} loading={loading} />
            
            {/* Booking Summary */}
            <BookingSummaryWidget 
              bookingData={dashboardData.bookingSummary} 
              loading={loading}
              onViewAllBookings={() => {}}
            />
            
            {/* Travel Tips */}
            <TravelTipsWidget />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;