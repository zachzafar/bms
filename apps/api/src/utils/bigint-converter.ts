/**
 * Utility functions for converting bigint values to numbers in objects
 */

/**
 * Converts bigint values to numbers in an object recursively
 * @param obj - The object to convert
 * @param options - Configuration options
 * @returns A new object with bigint values converted to numbers
 */
export function convertToNumber<T extends Record<string, any>>(
  obj: T,
  options: {
    /** Fields to exclude from conversion */
    exclude?: string[];
    /** Fields to specifically include (if provided, only these will be converted) */
    include?: string[];
    /** Whether to convert nested objects recursively */
    recursive?: boolean;
  } = {}
): T {
  const { exclude = [], include, recursive = true } = options;

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => typeof item === 'object' && item !== null && recursive
        ? convertToNumber(item, options)
        : typeof item === 'bigint' ? Number(item) : item
    ) as unknown as T;
  }

  if (typeof obj !== 'object') {
    return typeof obj === 'bigint' ? Number(obj) as unknown as T : obj;
  }

  const result = { ...obj };

  for (const [key, value] of Object.entries(result)) {
    // Skip if key is in exclude list
    if (exclude.includes(key)) {
      continue;
    }

    // If include list is provided, only convert keys in that list
    if (include && !include.includes(key)) {
      continue;
    }

    if (typeof value === 'bigint') {
      // Convert bigint to number
      (result as any)[key] = Number(value);
    } else if (value !== null && typeof value === 'object' && recursive) {
      // Recursively convert nested objects
      (result as any)[key] = convertToNumber(value, options);
    }
  }

  return result;
}

/**
 * Converts specific bigint fields to numbers in an object
 * @param obj - The object to convert
 * @param fields - Array of field names to convert
 * @returns A new object with specified bigint fields converted to numbers
 */
export function convertSpecificFields<T extends Record<string, any>>(
  obj: T,
  fields: string[]
): T {
  return convertToNumber(obj, { include: fields, recursive: false });
}

/**
 * Converts all bigint values to numbers except specified fields
 * @param obj - The object to convert
 * @param excludeFields - Array of field names to exclude from conversion
 * @returns A new object with bigint values converted to numbers (except excluded fields)
 */
export function convertExcept<T extends Record<string, any>>(
  obj: T,
  excludeFields: string[]
): T {
  return convertToNumber(obj, { exclude: excludeFields });
}

/**
 * Type-safe converter for common database entity patterns
 * Converts id fields and foreign key fields from bigint to number
 */
export function convertEntitys<T extends Record<string, any>>(obj: T): T {
  const commonIdFields = [
    'id', 'contactId', 'userId', 'tenantId', 'assetId', 'bookingId',
    'customerId', 'invoiceId', 'paymentId', 'taskId', 'documentId',
    'brochureId', 'feedbackId', 'communicationId', 'teamId', 'roleId'
  ];
  
  return convertToNumber(obj, { include: commonIdFields });
}