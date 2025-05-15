/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUsers = /* GraphQL */ `
  mutation CreateUsers(
    $input: CreateUsersInput!
    $condition: ModelUsersConditionInput
  ) {
    createUsers(input: $input, condition: $condition) {
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

export const updateUsers = /* GraphQL */ `
  mutation UpdateUsers(
    $input: UpdateUsersInput!
    $condition: ModelUsersConditionInput
  ) {
    updateUsers(input: $input, condition: $condition) {
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

export const deleteUsers = /* GraphQL */ `
  mutation DeleteUsers(
    $input: DeleteUsersInput!
    $condition: ModelUsersConditionInput
  ) {
    deleteUsers(input: $input, condition: $condition) {
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

export const createTrips = /* GraphQL */ `
  mutation CreateTrips(
    $input: CreateTripsInput!
    $condition: ModelTripsConditionInput
  ) {
    createTrips(input: $input, condition: $condition) {
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

export const updateTrips = /* GraphQL */ `
  mutation UpdateTrips(
    $input: UpdateTripsInput!
    $condition: ModelTripsConditionInput
  ) {
    updateTrips(input: $input, condition: $condition) {
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

export const deleteTrips = /* GraphQL */ `
  mutation DeleteTrips(
    $input: DeleteTripsInput!
    $condition: ModelTripsConditionInput
  ) {
    deleteTrips(input: $input, condition: $condition) {
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

export const createComments = /* GraphQL */ `
  mutation CreateComments(
    $input: CreateCommentsInput!
    $condition: ModelCommentsConditionInput
  ) {
    createComments(input: $input, condition: $condition) {
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

export const updateComments = /* GraphQL */ `
  mutation UpdateComments(
    $input: UpdateCommentsInput!
    $condition: ModelCommentsConditionInput
  ) {
    updateComments(input: $input, condition: $condition) {
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

export const deleteComments = /* GraphQL */ `
  mutation DeleteComments(
    $input: DeleteCommentsInput!
    $condition: ModelCommentsConditionInput
  ) {
    deleteComments(input: $input, condition: $condition) {
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