
# Asset Nexus API - Backend Implementation

This directory contains the server-side implementation code for the Asset Nexus API.

## Project Structure

```
server/
├── server.js          # Main server file with Express app, models, and routes
├── README.md          # This documentation
```

## Setting Up the Backend

To run this API as a separate backend service:

1. Create a new directory for your backend project
2. Copy the `server.js` file to your new project directory
3. Initialize a new Node.js project:
   ```
   npm init -y
   ```
4. Install required dependencies:
   ```
   npm install express mongoose bcryptjs jsonwebtoken cors dotenv
   ```
5. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```
6. Start the server:
   ```
   node server.js
   ```

## API Documentation

For detailed API documentation, refer to the frontend documentation.

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Most endpoints require authentication.

To authenticate:
1. Send a POST request to `/api/auth/login` with email and password
2. Include the received token in subsequent requests in the Authorization header:
   ```
   Authorization: Bearer your_token_here
   ```

## Data Models

The API implements the following MongoDB models:
- User
- ItemType
- Item
- Room
- Assign (Assignments)
- Repair

## Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Role-based access control (admin vs regular users)
- Input validation and sanitization
- Error handling

## Development

To extend this API:
1. Add new routes in server.js
2. Add validation middleware as needed
3. Implement additional business logic
4. Test thoroughly before deployment
