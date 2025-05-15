import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert } from '@mui/material';
import { generateClient } from 'aws-amplify/api';
import type { Schema } from '../../amplify/data/resource';

// Mock data for when we're not connected to DynamoDB
const MOCK_USERS = [
  {
    id: '1',
    username: 'johndoe',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    country: 'United States',
    preferredAirport: 'LAX',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'janedoe',
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    country: 'Canada',
    preferredAirport: 'YYZ',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const MOCK_TRIPS = [
  {
    id: '1',
    userId: '1',
    fromCity: 'LAX',
    toCity: 'JFK',
    layoverCity: 'ORD',
    departureDate: '2023-12-15',
    departureTime: '08:30',
    bookedStatus: 'Confirmed',
    flightDetails: 'AA123, UA456',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: '2',
    fromCity: 'YYZ',
    toCity: 'LHR',
    layoverCity: 'JFK',
    departureDate: '2023-11-22',
    departureTime: '14:45',
    bookedStatus: 'Pending',
    flightDetails: 'AC230, BA115',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  registrationDate?: string;
  isActive?: boolean;
  preferredAirport?: string;
  createdAt: string;
  updatedAt: string;
}

interface Trip {
  id: string;
  userId: string;
  fromCity: string;
  toCity: string;
  layoverCity?: string;
  departureDate?: string;
  departureTime?: string;
  bookedStatus?: string;
  flightDetails?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserData() {
  const [users, setUsers] = useState<User[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  // Fetch users and trips
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      try {
        // Try to generate an API client
        const client = generateClient<Schema>();
        
        // Attempt to query DynamoDB
        try {
          // Fetch users
          const userData = await client.graphql({
            query: `query ListUsers {
              listUsers {
                items {
                  id
                  username
                  email
                  firstName
                  lastName
                  phone
                  country
                  isActive
                  preferredAirport
                  createdAt
                  updatedAt
                }
              }
            }`
          });
          
          // Use type assertion to avoid TypeScript errors
          const typedUserData = userData as any;
          if (typedUserData.data && typedUserData.data.listUsers) {
            setUsers(typedUserData.data.listUsers.items);
          }

          // Fetch trips
          const tripData = await client.graphql({
            query: `query ListTrips {
              listTrips {
                items {
                  id
                  userId
                  fromCity
                  toCity
                  layoverCity
                  departureDate
                  departureTime
                  bookedStatus
                  flightDetails
                  createdAt
                  updatedAt
                }
              }
            }`
          });
          
          // Use type assertion to avoid TypeScript errors
          const typedTripData = tripData as any;
          if (typedTripData.data && typedTripData.data.listTrips) {
            setTrips(typedTripData.data.listTrips.items);
          }
        } catch (queryError) {
          console.log('Error querying DynamoDB, using mock data', queryError);
          setUseMockData(true);
          setUsers(MOCK_USERS);
          setTrips(MOCK_TRIPS);
        }
      } catch (clientError) {
        console.log('Error generating API client, using mock data', clientError);
        setUseMockData(true);
        setUsers(MOCK_USERS);
        setTrips(MOCK_TRIPS);
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error loading data. Please try again later.');
      setLoading(false);
    }
  };

  // Example function to add sample data
  const addSampleData = async () => {
    try {
      setLoading(true);
      
      if (useMockData) {
        // Just add to mock data
        const newUser = {
          id: (users.length + 1).toString(),
          username: `user${users.length + 1}`,
          email: `user${users.length + 1}@example.com`,
          firstName: `User`,
          lastName: `${users.length + 1}`,
          country: 'United States',
          preferredAirport: 'SFO',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const newTrip = {
          id: (trips.length + 1).toString(),
          userId: newUser.id,
          fromCity: 'SFO',
          toCity: 'DXB',
          layoverCity: 'LHR',
          departureDate: '2024-01-15',
          departureTime: '10:30',
          bookedStatus: 'Confirmed',
          flightDetails: 'UA550, EK412',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setUsers([...users, newUser]);
        setTrips([...trips, newTrip]);
      } else {
        // Real API client implementation
        const client = generateClient<Schema>();
        
        // Create a user
        const result = await client.graphql({
          query: `mutation CreateUser($input: CreateUserInput!) {
            createUser(input: $input) {
              id
              username
              email
              firstName
              lastName
              country
              preferredAirport
              isActive
              createdAt
              updatedAt
            }
          }`,
          variables: {
            input: {
              username: 'johndoe',
              email: 'john.doe@example.com',
              firstName: 'John',
              lastName: 'Doe',
              country: 'United States',
              preferredAirport: 'LAX',
              isActive: true
            }
          }
        });
        
        // Use type assertion to avoid TypeScript errors
        const typedResult = result as any;
        if (typedResult.data && typedResult.data.createUser) {
          const userId = typedResult.data.createUser.id;
          
          // Create a trip for this user
          await client.graphql({
            query: `mutation CreateTrip($input: CreateTripInput!) {
              createTrip(input: $input) {
                id
                userId
                fromCity
                toCity
                layoverCity
                departureDate
                departureTime
                bookedStatus
                flightDetails
                createdAt
                updatedAt
              }
            }`,
            variables: {
              input: {
                userId: userId,
                fromCity: 'LAX',
                toCity: 'JFK',
                layoverCity: 'ORD',
                departureDate: '2023-12-15',
                departureTime: '08:30',
                bookedStatus: 'Confirmed',
                flightDetails: 'AA123, UA456'
              }
            }
          });
          
          // Refresh data
          await fetchData();
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error adding sample data:', err);
      setError('Error adding sample data. Please try again later.');
      setLoading(false);
    }
  };

  return (
    <Box>
      {loading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            flexDirection: 'column',
            py: 4
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Loading data...
          </Typography>
        </Box>
      ) : error ? (
        <Box sx={{ py: 2 }}>
          <Typography color="error">{error}</Typography>
          <Button variant="outlined" onClick={fetchData} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Box>
      ) : (
        <Box>
          <Typography variant="h5" gutterBottom>
            User Data from DynamoDB
          </Typography>
          
         {/*  {useMockData && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Using mock data because DynamoDB connection is not available. You need to run 'npx ampx sandbox' to use real DynamoDB data.
            </Alert>
          )} */}
          
          {users.length === 0 ? (
            <Box sx={{ mt: 2 }}>
              <Typography>No users found. Add some sample data to get started.</Typography>
              <Button 
                variant="contained" 
                onClick={addSampleData} 
                sx={{ mt: 2, bgcolor: 'rgb(26, 150, 152)' }}
              >
                Add Sample Data
              </Button>
            </Box>
          ) : (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Users
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Country</TableCell>
                      <TableCell>Preferred Airport</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{`${user.firstName || ''} ${user.lastName || ''}`}</TableCell>
                        <TableCell>{user.country}</TableCell>
                        <TableCell>{user.preferredAirport}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {trips.length > 0 && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                    Trips
                  </Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>From</TableCell>
                          <TableCell>To</TableCell>
                          <TableCell>Layover</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Time</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Flight Details</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trips.map((trip) => (
                          <TableRow key={trip.id}>
                            <TableCell>{trip.fromCity}</TableCell>
                            <TableCell>{trip.toCity}</TableCell>
                            <TableCell>{trip.layoverCity}</TableCell>
                            <TableCell>{trip.departureDate}</TableCell>
                            <TableCell>{trip.departureTime}</TableCell>
                            <TableCell>{trip.bookedStatus}</TableCell>
                            <TableCell>{trip.flightDetails}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </Box>
      )}
    </Box>
  );
} 