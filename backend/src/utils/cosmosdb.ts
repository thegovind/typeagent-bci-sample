/**
 * Cosmos DB Utility Module
 * Provides functionality to interact with Azure Cosmos DB for data storage and retrieval.
 * This module handles database connections, queries, and error handling.
 */

import { CosmosClient, SqlQuerySpec } from '@azure/cosmos';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

/**
 * Configuration for Cosmos DB connection
 */
interface CosmosConfig {
  endpoint: string;
  key: string;
  databaseId: string;
  containerId: string;
}

export interface FlowRecord {
  userId: string;
  timestamp: Date;
  flowIntensityValues: number[];  // Array of flow intensity values
}

/**
 * Validates and returns Cosmos DB configuration
 */
function getCosmosConfig(): CosmosConfig {
  // Get environment variables with type assertion
  const config = {
    endpoint: process.env.COSMOS_DB_ENDPOINT ?? '',
    key: process.env.COSMOS_DB_KEY ?? '',
    databaseId: process.env.COSMOS_DB_DATABASE_ID ?? '',
    containerId: process.env.COSMOS_DB_CONTAINER_ID ?? ''
  };

  // Debug log all environment variables
  // console.log('Environment Variables:', {
  //   COSMOS_DB_ENDPOINT: config.endpoint,
  //   COSMOS_DB_DATABASE_ID: config.databaseId,
  //   COSMOS_DB_CONTAINER_ID: config.containerId,
  //   hasKey: !!config.key
  // });

  // Check each configuration value
  const missingValues = Object.entries(config)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingValues.length > 0) {
    throw new Error(`Missing Cosmos DB configuration values: ${missingValues.join(', ')}`);
  }

  // Format endpoint if needed
  let endpoint = config.endpoint;
  if (!endpoint.startsWith('https://')) {
    endpoint = `https://${endpoint}`;
  }
  if (!endpoint.endsWith('/')) {
    endpoint = `${endpoint}/`;
  }

  // Return typed configuration
  return {
    endpoint,
    key: config.key,
    databaseId: config.databaseId,
    containerId: config.containerId
  };
}

/**
 * Gets the most recent document from a Cosmos DB container
 * 
 * @param userId - The user ID to query for
 * @returns Promise resolving to the most recent document or null if none found
 * @throws Error if configuration is invalid or database operation fails
 */
export async function getMostRecentDocument(userId: string) {
  try {
    // Get and validate configuration
    const config = getCosmosConfig();
    
    // console.log('Attempting to connect to Cosmos DB with config:', {
    //   endpoint: config.endpoint,
    //   databaseId: config.databaseId,
    //   containerId: config.containerId,
    //   hasKey: !!config.key
    // });

    // Initialize Cosmos client
    const client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key
    });

    const database = client.database(config.databaseId);
    const container = database.container(config.containerId);

    // Query for most recent document
    const querySpec: SqlQuerySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC OFFSET 0 LIMIT 1",
      parameters: [{ name: "@userId", value: userId }]
    };

    // console.log('Executing query:', querySpec);

    const { resources: items } = await container.items.query(querySpec).fetchAll();

    // console.log('Query results:', {
    //   found: items.length > 0,
    //   firstItem: items[0] ? 'exists' : 'none'
    // });

    return items.length > 0 ? items[0] : null;

  } catch (error) {
    console.error('Detailed error in getMostRecentDocument:', error);
    throw error;
  }
}

/**
 * Gets the flow intensity data from a Cosmos DB container
 * 
 * @param userId - The user ID to query for
 * @param days - The number of days to query for
 * @returns Promise resolving to the flow int data or null if none found
 * @throws Error if configuration is invalid or database operation fails
 */
export async function getFlowIntensityData(userId: string, days: number) {
  try {
    const endDate = new Date().getTime();  // Current time in milliseconds
    const startDate = new Date().getTime() - (days * 24 * 60 * 60 * 1000);  // Subtract days in milliseconds

    // Get and validate configuration
    const config = getCosmosConfig();
      
    // Initialize Cosmos client
    const client = new CosmosClient({
      endpoint: config.endpoint,
      key: config.key
    });

    const database = client.database(config.databaseId);
    const container = database.container(config.containerId);

    const querySpec = {
      query: "SELECT * FROM c WHERE c.userId = @userId AND c._ts >= @startDate AND c._ts <= @endDate",
      parameters: [
        { name: "@userId", value: userId },
        { name: "@startDate", value: Math.floor(startDate / 1000) },  // Convert to seconds for _ts
        { name: "@endDate", value: Math.floor(endDate / 1000) }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    // console.log('Resources:', resources);
    return resources;
  } catch (error) {
    console.error('Detailed error in getFlowActivityData:', error);
    throw error;
  }
}
