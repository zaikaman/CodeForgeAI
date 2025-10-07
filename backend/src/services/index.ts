/**
 * Services Index
 * Barrel export for all services
 */

// Database
export * from './LocalDatabase'

// Schemas (explicit exports to avoid conflicts)
export {
  MetadataSchema,
  type Metadata,
  DatabaseSchema as DBSchema,
  type Database,
  validateDatabase,
  validatePartialDatabase,
  isDatabaseValid,
  CollectionSchemas,
  type CollectionName,
  validateCollection,
  getEmptyDatabase,
  CURRENT_DB_VERSION,
  CURRENT_MIGRATION_VERSION,
} from './schemas'

// Migrations
export * from './migrations'

// Backup & Restore
export * from './backup'
