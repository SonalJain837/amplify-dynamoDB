/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUsers = /* GraphQL */ `
  subscription OnCreateUsers($filter: ModelSubscriptionUsersFilterInput) {
    onCreateUsers(filter: $filter) {
      PK
      SK
      username
      firstName
      lastName
      email
      ageRange
      nationality
      createdAt
      userId
    }
  }
`;

export const onUpdateUsers = /* GraphQL */ `
  subscription OnUpdateUsers($filter: ModelSubscriptionUsersFilterInput) {
    onUpdateUsers(filter: $filter) {
      PK
      SK
      username
      firstName
      lastName
      email
      ageRange
      nationality
      createdAt
      userId
    }
  }
`;

export const onDeleteUsers = /* GraphQL */ `
  subscription OnDeleteUsers($filter: ModelSubscriptionUsersFilterInput) {
    onDeleteUsers(filter: $filter) {
      PK
      SK
      username
      firstName
      lastName
      email
      ageRange
      nationality
      createdAt
      userId
    }
  }
`;

export const onCreateTrips = /* GraphQL */ `
  subscription OnCreateTrips($filter: ModelSubscriptionTripsFilterInput) {
    onCreateTrips(filter: $filter) {
      PK
      SK
      tripId
      userEmail
      fromCity
      toCity
      layoverCity
      flightDate
      flightTime
      confirmed
      flightDetails
      createdAt
    }
  }
`;

export const onUpdateTrips = /* GraphQL */ `
  subscription OnUpdateTrips($filter: ModelSubscriptionTripsFilterInput) {
    onUpdateTrips(filter: $filter) {
      PK
      SK
      tripId
      userEmail
      fromCity
      toCity
      layoverCity
      flightDate
      flightTime
      confirmed
      flightDetails
      createdAt
    }
  }
`;

export const onDeleteTrips = /* GraphQL */ `
  subscription OnDeleteTrips($filter: ModelSubscriptionTripsFilterInput) {
    onDeleteTrips(filter: $filter) {
      PK
      SK
      tripId
      userEmail
      fromCity
      toCity
      layoverCity
      flightDate
      flightTime
      confirmed
      flightDetails
      createdAt
    }
  }
`;

export const onCreateComments = /* GraphQL */ `
  subscription OnCreateComments($filter: ModelSubscriptionCommentsFilterInput) {
    onCreateComments(filter: $filter) {
      PK
      SK
      commentId
      tripId
      userEmail
      commentText
      createdAt
      updatedAt
      editable
      notifyEmail
    }
  }
`;

export const onUpdateComments = /* GraphQL */ `
  subscription OnUpdateComments($filter: ModelSubscriptionCommentsFilterInput) {
    onUpdateComments(filter: $filter) {
      PK
      SK
      commentId
      tripId
      userEmail
      commentText
      createdAt
      updatedAt
      editable
      notifyEmail
    }
  }
`;

export const onDeleteComments = /* GraphQL */ `
  subscription OnDeleteComments($filter: ModelSubscriptionCommentsFilterInput) {
    onDeleteComments(filter: $filter) {
      PK
      SK
      commentId
      tripId
      userEmail
      commentText
      createdAt
      updatedAt
      editable
      notifyEmail
    }
  }
`; 