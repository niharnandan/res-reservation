// api/dev-server.ts
import express from 'express';
import dotenv from 'dotenv';
import app from './index';

// Load environment variables
dotenv.config();

// Get port from environment or use default
const PORT = process.env.API_PORT || 5001;

// Create a standalone Express server for local development
const server = express();

// Mount the API routes
server.use('/', app);

// Start the server
server.listen(PORT, () => {
  console.log(`Local API server running at http://localhost:${PORT}`);
});