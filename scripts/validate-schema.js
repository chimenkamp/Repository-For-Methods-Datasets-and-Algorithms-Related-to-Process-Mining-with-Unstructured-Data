/**
 * Schema validation script
 * Validates methods.json against the JSON schema
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dataDir = join(__dirname, '..', 'data');

// Load schema and data
const schema = JSON.parse(readFileSync(join(dataDir, 'methods.schema.json'), 'utf8'));
const data = JSON.parse(readFileSync(join(dataDir, 'methods.json'), 'utf8'));

// Initialize validator
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);

const validate = ajv.compile(schema);
const valid = validate(data);

if (valid) {
  console.log('✅ Schema validation passed!');
  console.log(`   - ${data.methods.length} methods validated`);
  console.log(`   - ${data.pipeline_steps.length} pipeline steps defined`);
  process.exit(0);
} else {
  console.error('❌ Schema validation failed!');
  console.error('\nErrors:');
  validate.errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error.instancePath}: ${error.message}`);
    if (error.params) {
      console.error(`     Params: ${JSON.stringify(error.params)}`);
    }
  });
  process.exit(1);
}
