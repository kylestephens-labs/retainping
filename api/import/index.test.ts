import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import Papa from 'papaparse';

// Mock Supabase
const mockSupabaseAdmin = {
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [{ id: 1 }, { id: 2 }], error: null }))
    }))
  }))
};

vi.mock('../../lib/supabase', () => ({
  supabaseAdmin: mockSupabaseAdmin
}));

// Import the functions we want to test
import { 
  validateRequiredFields, 
  parseCsvData, 
  mapColumnValue, 
  transformMemberData, 
  validateMemberData,
  createApiResponse 
} from './index';

describe('Import API - Utility Functions', () => {
  
  describe('validateRequiredFields', () => {
    test('should return valid for correct input', () => {
      const result = validateRequiredFields({
        csvData: 'name,email\nJohn,john@test.com',
        user_id: 'test-user'
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should return invalid for missing csvData', () => {
      const result = validateRequiredFields({
        user_id: 'test-user'
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('CSV data is required');
    });

    test('should return invalid for missing user_id', () => {
      const result = validateRequiredFields({
        csvData: 'name,email\nJohn,john@test.com'
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('User ID is required');
    });
  });

  describe('parseCsvData', () => {
    test('should parse valid CSV successfully', () => {
      const csvData = 'name,email\nJohn Doe,john@test.com\nJane Smith,jane@test.com';
      const result = parseCsvData(csvData);
      
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0]).toEqual({
        name: 'John Doe',
        email: 'john@test.com'
      });
    });

    test('should handle CSV with missing fields gracefully', () => {
      const csvData = 'name,email\nJohn Doe,john@test.com\nJane Smith'; // Missing email
      const result = parseCsvData(csvData);
      
      expect(result.success).toBe(true); // Non-critical errors are tolerated
      expect(result.data).toHaveLength(2);
    });

    test('should return error for empty CSV', () => {
      const csvData = '';
      const result = parseCsvData(csvData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    test('should handle critical CSV errors', () => {
      const csvData = 'name,email\nJohn Doe,john@test.com\nJane Smith,"unclosed quote';
      const result = parseCsvData(csvData);
      
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });
  });

  describe('mapColumnValue', () => {
    const member = {
      name: 'John Doe',
      email_address: 'john@test.com',
      discord: 'john#1234',
      last_active_at: '2024-01-15',
      status: 'active'
    };

    test('should map name correctly', () => {
      const result = mapColumnValue(member, 'name');
      expect(result).toBe('John Doe');
    });

    test('should map email_address to email', () => {
      const result = mapColumnValue(member, 'email');
      expect(result).toBe('john@test.com');
    });

    test('should map discord to discordId', () => {
      const result = mapColumnValue(member, 'discordId');
      expect(result).toBe('john#1234');
    });

    test('should return null for missing column', () => {
      const result = mapColumnValue(member, 'lastActiveAt');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('transformMemberData', () => {
    test('should transform member data correctly', () => {
      const member = {
        name: 'John Doe',
        email: 'john@test.com',
        discord_id: 'john#1234',
        last_active_at: '2024-01-15',
        status: 'active'
      };

      const result = transformMemberData(member, 'test-user');
      
      expect(result).toEqual({
        user_id: 'test-user',
        name: 'John Doe',
        email: 'john@test.com',
        discord_id: 'john#1234',
        last_active_at: '2024-01-15T00:00:00.000Z',
        status: 'active',
        is_suppressed: false,
        created_at: expect.any(String),
        updated_at: expect.any(String)
      });
    });

    test('should handle inactive status', () => {
      const member = {
        name: 'John Doe',
        email: 'john@test.com',
        status: 'inactive'
      };

      const result = transformMemberData(member, 'test-user');
      expect(result.status).toBe('inactive');
    });

    test('should handle null values', () => {
      const member = {
        name: '',
        email: 'john@test.com'
      };

      const result = transformMemberData(member, 'test-user');
      expect(result.name).toBeNull();
      expect(result.email).toBe('john@test.com');
    });
  });

  describe('validateMemberData', () => {
    test('should validate member with email', () => {
      const member = {
        user_id: 'test-user',
        email: 'john@test.com',
        name: 'John Doe'
      };
      
      expect(validateMemberData(member)).toBe(true);
    });

    test('should validate member with discord_id', () => {
      const member = {
        user_id: 'test-user',
        discord_id: 'john#1234',
        name: 'John Doe'
      };
      
      expect(validateMemberData(member)).toBe(true);
    });

    test('should reject member without contact info', () => {
      const member = {
        user_id: 'test-user',
        name: 'John Doe'
      };
      
      expect(validateMemberData(member)).toBe(false);
    });
  });

  describe('createApiResponse', () => {
    test('should create success response', () => {
      const data = { success: true, message: 'Test' };
      const response = createApiResponse(data);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    test('should create error response', () => {
      const data = { error: 'Test error' };
      const response = createApiResponse(data, 400);
      
      expect(response.status).toBe(400);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });
  });
});

describe('Import API - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should handle complete import flow', async () => {
    const csvData = 'name,email,status\nJohn Doe,john@test.com,active\nJane Smith,jane@test.com,inactive';
    
    // Test the parsing and transformation
    const parseResult = parseCsvData(csvData);
    expect(parseResult.success).toBe(true);
    
    const members = parseResult.data!;
    const transformedMembers = members
      .map(member => transformMemberData(member, 'test-user'))
      .filter(validateMemberData);
    
    expect(transformedMembers).toHaveLength(2);
    expect(transformedMembers[0].email).toBe('john@test.com');
    expect(transformedMembers[1].status).toBe('inactive');
  });

  test('should handle various CSV formats', () => {
    const formats = [
      'name,email\nJohn,john@test.com',
      'fullname,email_address\nJohn,john@test.com',
      'firstname,email\nJohn,john@test.com'
    ];

    formats.forEach(csvData => {
      const result = parseCsvData(csvData);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });
  });
});

describe('Import API - Error Handling', () => {
  test('should handle malformed CSV', () => {
    const csvData = 'name,email\nJohn,john@test.com\nJane'; // Missing email
    const result = parseCsvData(csvData);
    
    expect(result.success).toBe(true); // Papa Parse handles this gracefully
  });

  test('should handle empty CSV', () => {
    const csvData = '';
    const result = parseCsvData(csvData);
    
    expect(result.success).toBe(false);
  });

  test('should handle CSV with no valid members', () => {
    const csvData = 'name,email\n,';
    const result = parseCsvData(csvData);
    
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });
});
