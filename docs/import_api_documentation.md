# Import API Documentation

## Overview
The Import API allows users to upload CSV files containing member data and import them into the RetainPing database. The API supports flexible CSV formats and provides comprehensive error handling.

## Endpoint
```
POST /api/import
```

## Request Body
```typescript
{
  csvData: string;    // Raw CSV data as string
  user_id: string;    // User ID for scoping the import
  options?: {         // Optional import options
    skipDuplicates?: boolean;  // Skip duplicate members (default: true)
    batchSize?: number;        // Batch size for large imports (default: 1000)
  }
}
```

## CSV Format Support

### Required Columns
At least one of the following contact methods is required:
- **Email**: `email` or `email_address`
- **Discord**: `discord_id`, `discord`, or `discord_username`

### Supported Column Names
| Field | Supported Column Names |
|-------|----------------------|
| Name | `name`, `fullname`, `full_name`, `firstname` |
| Email | `email`, `email_address` |
| Discord ID | `discord_id`, `discord`, `discord_username` |
| Last Active | `last_active`, `last_active_at`, `last_seen` |
| Status | `status` |

### Example CSV Formats
```csv
# Standard format
name,email,last_active_at,status
John Doe,john@example.com,2024-01-15,active
Jane Smith,jane@example.com,2024-01-10,inactive

# Alternative format
fullname,email_address,discord_id,last_seen
John Doe,john@example.com,john#1234,2024-01-15
Jane Smith,jane@example.com,jane#5678,2024-01-10
```

## Response Format

### Success Response
```typescript
{
  success: true,
  message: "Successfully imported X members",
  data: {
    imported: number;      // Number of members actually imported
    total_parsed: number;  // Total rows parsed from CSV
    skipped: number;       // Number of rows skipped (duplicates/invalid)
    duplicates?: number;   // Number of duplicate members found
    errors?: string[];     // Array of validation errors
  }
}
```

### Error Response
```typescript
{
  error: string;           // Error message
  details?: any;          // Additional error details
  code?: string;          // Error code for programmatic handling
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `MISSING_CSV_DATA` | CSV data is required | 400 |
| `MISSING_USER_ID` | User ID is required | 400 |
| `CSV_PARSE_ERROR` | Failed to parse CSV data | 400 |
| `NO_VALID_MEMBERS` | No members with valid contact info | 400 |
| `DATABASE_ERROR` | Database insertion failed | 500 |
| `RATE_LIMITED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Internal server error | 500 |

## Usage Examples

### Basic Import
```javascript
const response = await fetch('/api/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    csvData: 'name,email\nJohn Doe,john@example.com',
    user_id: 'user-123'
  })
});

const result = await response.json();
console.log(result);
// { success: true, message: "Successfully imported 1 members", data: { imported: 1, total_parsed: 1, skipped: 0 } }
```

### Import with Options
```javascript
const response = await fetch('/api/import', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    csvData: csvData,
    user_id: 'user-123',
    options: {
      skipDuplicates: true,
      batchSize: 500
    }
  })
});
```

## Data Validation

### Member Validation Rules
1. **Contact Information**: Must have either email or Discord ID
2. **Email Format**: Must be valid email format if provided
3. **Status**: Must be 'active' or 'inactive' (case-insensitive)
4. **Date Format**: Last active date must be parseable by JavaScript Date constructor

### Data Transformation
- **Names**: Trimmed and converted to null if empty
- **Emails**: Trimmed and validated
- **Discord IDs**: Trimmed and validated
- **Dates**: Converted to ISO string format
- **Status**: Normalized to lowercase 'active' or 'inactive'

## Performance Considerations

### Batch Processing
- Large imports are automatically processed in batches
- Default batch size: 1000 members
- Configurable via `options.batchSize`

### Rate Limiting
- 5 imports per hour per user
- 1000 members per import maximum
- Rate limit headers included in responses

### Memory Usage
- CSV data is processed in chunks for large files
- Memory usage scales linearly with batch size
- Recommended batch size: 500-1000 members

## Security Features

### Input Sanitization
- All string inputs are trimmed and sanitized
- SQL injection protection via parameterized queries
- XSS protection in error messages

### Access Control
- User-scoped imports (members only visible to importing user)
- Authentication required
- Audit logging for all imports

## Monitoring & Logging

### Success Metrics
- Import success rate
- Average processing time
- Member validation pass rate

### Error Tracking
- CSV parsing errors
- Database insertion failures
- Validation errors

### Audit Trail
- All imports logged with user ID and timestamp
- Failed imports logged with error details
- Duplicate detection events logged

## Troubleshooting

### Common Issues

#### CSV Parsing Errors
```json
{
  "error": "Failed to parse CSV data",
  "details": [
    {
      "row": 2,
      "message": "Expected 3 fields, found 2"
    }
  ]
}
```

#### No Valid Members
```json
{
  "error": "No members with valid email or Discord ID found",
  "details": "All members must have either email or Discord ID"
}
```

#### Rate Limiting
```json
{
  "error": "Rate limit exceeded",
  "details": "Maximum 5 imports per hour",
  "retry_after": 3600
}
```

### Debug Mode
Enable debug logging by setting `DEBUG=import` environment variable.

## Changelog

### v2.0.0 (Current)
- ✅ Modular architecture with separated concerns
- ✅ Comprehensive error handling and validation
- ✅ TypeScript support with Zod schemas
- ✅ Flexible column mapping
- ✅ Batch processing for large imports
- ✅ Duplicate detection
- ✅ Rate limiting and security features
- ✅ Comprehensive test coverage

### v1.0.0 (Legacy)
- Basic CSV parsing with Papa Parse
- Simple database insertion
- Minimal error handling
- Fixed column mapping
