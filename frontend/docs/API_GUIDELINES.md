# Frontend API Guidelines

## API Calls Configuration

This frontend application is configured to communicate with the backend API using Axios. The base URL for API calls is configured in `src/api/axios.ts`:

```typescript
// Base URL for the API
const API_URL = 'http://localhost:5003/api';
```

## Making API Calls

When making API calls, follow these guidelines to ensure consistency and avoid issues:

### ✅ DO:
- Use the API client without repeating `/api` in your endpoint paths:
  ```typescript
  // CORRECT - The /api prefix is already included in the base URL
  api.get('/user/profile');
  api.post('/notifications', notificationData);
  ```

### ❌ DON'T:
- Include `/api` in your endpoint paths:
  ```typescript 
  // INCORRECT - This would result in http://localhost:5003/api/api/user/profile
  api.get('/api/user/profile');
  ```

## Common API Endpoints

- User profile: `/user/profile`
- Notifications: `/notifications`
- Attendance: `/attendance`
- Leave requests: `/leaves`
- Authentication: `/auth/login`, `/auth/register`

## Handling API Errors

All API calls should be wrapped in try/catch blocks with appropriate error handling:

```typescript
try {
  const response = await api.get('/user/profile');
  return response.data;
} catch (error) {
  console.error('Error fetching user profile:', error);
  throw error;
}
```

## Testing API Endpoints

To verify API connectivity, you can use the debug endpoint:
```typescript
const response = await api.get('/debug');
```

For more information, refer to the backend API documentation.
