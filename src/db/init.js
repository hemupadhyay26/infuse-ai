// src/db/init.js
import { createTables } from './migrations.js';

// Function to initialize database
export async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    await createTables();
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Database initialization failed:', error);
    // Don't throw here to prevent app from crashing on startup
  }
}