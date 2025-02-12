import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Export process.env for use in other files
export const env = process.env;
