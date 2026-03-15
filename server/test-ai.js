import { runAIDiagnosis } from './services/aiDiagnosisService.js';

// Load env variables (important for GEMINI_API_KEY)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const mockEncounter = {
  symptom_text: 'Patient presents with severe chest pain radiating to the left arm and shortness of breath. No past medical history of cardiac issues, but family history of heart disease.'
};

async function test() {
  console.log('Running AI Diagnosis Integration Test...');
  try {
    const result = await runAIDiagnosis(mockEncounter);
    console.log('\n--- Final Output ---');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nSuccess! All agents orchestrated successfully.');
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

test();
