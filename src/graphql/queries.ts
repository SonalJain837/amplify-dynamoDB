/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUsers = /* GraphQL */ `
  query GetUsers($PK: String!, $SK: String!) {
    getUsers(PK: $PK, SK: $SK) {
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

export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUsersFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`;

export const getTrips = /* GraphQL */ `
  query GetTrips($PK: String!, $SK: String!) {
    getTrips(PK: $PK, SK: $SK) {
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
      languagePreferences
      createdAt
    }
  }
`;

export const listTrips = /* GraphQL */ `
  query ListTrips(
    $filter: ModelTripsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listTrips(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
        languagePreferences
        createdAt
      }
      nextToken
    }
  }
`;

export const getComments = /* GraphQL */ `
  query GetComments($PK: String!, $SK: String!) {
    getComments(PK: $PK, SK: $SK) {
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

export const listComments = /* GraphQL */ `
  query ListComments(
    $filter: ModelCommentsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listComments(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
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
      nextToken
    }
  }
`; 