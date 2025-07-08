// Test fixtures for user routes
export const mockAuth0User = {
  sub: 'auth0|test123',
  email: 'test@example.com',
  name: 'Test User',
  nickname: 'testuser',
  picture: 'https://example.com/avatar.jpg',
  email_verified: true
}

export const mockMongoUser = {
  _id: 'mockUserId',
  auth0Id: 'auth0|test123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  usageCount: 5,
  dailyUsage: 3,
  lastUsageDate: new Date('2023-12-01T10:00:00Z'),
  createdAt: new Date('2023-11-01T10:00:00Z'),
  updatedAt: new Date('2023-12-01T10:00:00Z')
}

export const mockUserContext = {
  mongoUser: mockMongoUser,
  auth0User: mockAuth0User,
  userId: 'auth0|test123'
}

export const mockUpdateData = {
  firstName: 'Updated',
  lastName: 'Name'
}

export const mockUpdatedUser = {
  ...mockMongoUser,
  ...mockUpdateData,
  updatedAt: new Date('2023-12-01T11:00:00Z')
}

export const mockSerializedUser = {
  id: mockMongoUser._id,
  auth0Id: mockMongoUser.auth0Id,
  email: mockMongoUser.email,
  username: mockMongoUser.username,
  firstName: mockMongoUser.firstName,
  lastName: mockMongoUser.lastName,
  avatar: undefined,
  isEmailVerified: true,
  role: 'user',
  membership: 'free',
  preferences: {
    theme: 'light',
    language: 'en',
    notifications: true
  },
  usage: {
    totalTransformations: 0,
    monthlyUsage: 0,
    lastTransformation: undefined,
    usageResetDate: new Date().toISOString()
  },
  createdAt: mockMongoUser.createdAt.toISOString(),
  updatedAt: mockMongoUser.updatedAt.toISOString(),
  lastLoginAt: undefined
};

export const mockSerializedUpdatedUser = {
  // Based on mockSerializedUser with updated fields
  ...mockSerializedUser,
  id: mockUpdatedUser._id,
  firstName: mockUpdatedUser.firstName,
  lastName: mockUpdatedUser.lastName,
  username: mockUpdatedUser.username,
  updatedAt: mockUpdatedUser.updatedAt.toISOString()
};

export const mockUsageData = {
  totalTransformations: 0,
  monthlyUsage: 0,
  lastTransformation: undefined,
  usageResetDate: new Date().toISOString()
};

// Test scenarios for parameterized tests
export const authTestScenarios = [
  {
    name: 'valid user with all required fields',
    user: mockMongoUser,
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: 'user missing firstName',
    user: { ...mockMongoUser, firstName: undefined },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: 'user with null email',
    user: { ...mockMongoUser, email: null },
    expectedStatus: 500,
    shouldSucceed: false
  }
]

export const updateTestScenarios = [
  {
    name: 'valid update with all fields',
    updateData: mockUpdateData,
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: 'update with only firstName',
    updateData: { firstName: 'OnlyFirst' },
    expectedStatus: 200,
    shouldSucceed: true
  },
  {
    name: 'update with empty object',
    updateData: {},
    expectedStatus: 400,
    shouldSucceed: false
  },
  {
    name: 'update with invalid email format',
    updateData: { email: 'invalid-email' },
    expectedStatus: 400,
    shouldSucceed: false
  }
]

export const errorTestScenarios = [
  {
    name: 'database connection error',
    mockError: new Error('Database connection failed'),
    expectedStatus: 500,
    expectedMessage: 'Database connection failed'
  },
  {
    name: 'user not found error',
    mockError: new Error('User not found'),
    expectedStatus: 404,
    expectedMessage: 'User not found'
  },
  {
    name: 'validation error',
    mockError: new Error('Validation failed'),
    expectedStatus: 400,
    expectedMessage: 'Validation failed'
  }
]

// Common response patterns
export const successResponse = (data: any, message?: string) => ({
  success: true,
  data,
  message
})

export const errorResponse = (message: string) => ({
  success: false,
  error: message
})
