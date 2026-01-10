
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OUTPUT_DIR = path.join(process.cwd(), 'scripts', 'output');

async function main() {
  const files = fs.readdirSync(OUTPUT_DIR);

  for (const file of files) {
    if (
      (file.startsWith('ball_sort_')) &&
      file.endsWith('.json')
    ) {
      const filePath = path.join(OUTPUT_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      try {
        const questions = JSON.parse(content);
        
        if (!Array.isArray(questions) || questions.length === 0) {
          console.warn(`Skipping ${file}: Invalid content or empty array.`);
          continue;
        }

        // Take the first question as a template
        const template = questions[0];
        const newQuestions: any[] = [];

        for (let i = 0; i < 10; i++) {
          newQuestions.push({
            ...template,
            id: crypto.randomUUID(), // Generate a new unique ID
          });
        }

        fs.writeFileSync(filePath, JSON.stringify(newQuestions, null, 2));
        console.log(`Updated ${file} with 10 questions.`);

      } catch (error) {
        console.error(`Error processing ${file}:`, error);
      }
    }
  }
}

main();
