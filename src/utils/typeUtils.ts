/**
 * Type Utilities
 * Helper functions for type detection and conversion
 */

/**
 * Detect the JavaScript type of a string value
 * 
 * @param value The string value to analyze
 * @returns The detected type as a string ('string', 'number', 'boolean', etc.)
 */
export function detectValueType(value: string): string {
  // Check if it's a boolean
  if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
    return 'boolean';
  }
  
  // Check if it's a number
  if (!isNaN(Number(value)) && value.trim() !== '') {
    // Special case: if it starts with 0 and isn't just "0", it's probably a string (like "012345")
    if (value.startsWith('0') && value !== '0' && !value.toLowerCase().startsWith('0x') && !value.includes('.')) {
      return 'string';
    }
    return 'number';
  }
  
  // Check if it's a JSON object or array
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object') {
      return Array.isArray(parsed) ? 'array' : 'object';
    }
  } catch (e) {
    // Not JSON
  }
  
  // Default to string
  return 'string';
}

/**
 * Convert a string value to its appropriate JavaScript type
 * 
 * @param value The string value to convert
 * @returns The converted value with its correct type
 */
export function convertStringToTypedValue(value: string): any {
  const type = detectValueType(value);
  
  switch (type) {
    case 'boolean':
      return value.toLowerCase() === 'true';
    case 'number':
      return Number(value);
    case 'array':
    case 'object':
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    default:
      return value;
  }
}

/**
 * Generate TypeScript interface for environment variables
 * 
 * @param envVars The environment variables object
 * @param interfaceName The name of the interface to generate
 * @param detectTypes Whether to detect and use specific types
 * @returns TypeScript interface definition as a string
 */
export function generateTypeScriptInterface(
  envVars: Record<string, string>, 
  interfaceName: string = 'Env',
  detectTypes: boolean = true
): string {
  const lines: string[] = [
    `/**`,
    ` * Generated TypeScript interface for environment variables`,
    ` */`,
    `export interface ${interfaceName} {`
  ];
  
  for (const [key, value] of Object.entries(envVars)) {
    let type = 'string';
    
    if (detectTypes) {
      type = detectValueType(value);
    }
    
    lines.push(`  ${key}: ${type};`);
  }
  
  lines.push('}');
  
  return lines.join('\n');
}