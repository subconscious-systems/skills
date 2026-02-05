#!/usr/bin/env node

/**
 * Test script to verify the Subconscious skill works correctly
 * Run with: node test-skill.js
 */

const fs = require('fs');
const path = require('path');

const SKILL_DIR = path.join(__dirname, 'subconscious-dev');
const SKILL_FILE = path.join(SKILL_DIR, 'SKILL.md');

console.log('🧪 Testing Subconscious Skill\n');

// Test 1: Check skill file exists
console.log('✅ Test 1: Skill file exists');
if (!fs.existsSync(SKILL_FILE)) {
  console.error('❌ SKILL.md not found!');
  process.exit(1);
}
console.log('   ✓ SKILL.md found\n');

// Test 2: Check frontmatter
console.log('✅ Test 2: Frontmatter format');
const skillContent = fs.readFileSync(SKILL_FILE, 'utf8');
if (!skillContent.startsWith('---')) {
  console.error('❌ Missing YAML frontmatter!');
  process.exit(1);
}
const frontmatterMatch = skillContent.match(/^---\n([\s\S]*?)\n---/);
if (!frontmatterMatch) {
  console.error('❌ Invalid frontmatter format!');
  process.exit(1);
}
const frontmatter = frontmatterMatch[1];
if (!frontmatter.includes('name: subconscious-dev')) {
  console.error('❌ Missing name in frontmatter!');
  process.exit(1);
}
if (!frontmatter.includes('description:')) {
  console.error('❌ Missing description in frontmatter!');
  process.exit(1);
}
console.log('   ✓ Frontmatter valid\n');

// Test 3: Check no OpenAI SDK in Quick Start
console.log('✅ Test 3: No OpenAI SDK in Quick Start');
const quickStartSection = skillContent.split('## Quick Start')[1]?.split('##')[0] || '';
if (quickStartSection.includes('from openai import OpenAI') || 
    quickStartSection.includes('import OpenAI') ||
    quickStartSection.includes('openai import')) {
  console.error('❌ OpenAI SDK found in Quick Start section!');
  console.error('   Should use native Subconscious SDK instead');
  process.exit(1);
}
if (!quickStartSection.includes('from subconscious') &&
    !quickStartSection.includes('Subconscious') &&
    !quickStartSection.includes('subconscious import')) {
  console.error('❌ Native SDK not found in Quick Start!');
  process.exit(1);
}
console.log('   ✓ Uses native SDK in Quick Start\n');

// Test 4: Check response structure documented
console.log('✅ Test 4: Response structure documented');
if (!skillContent.includes('result?.answer') && !skillContent.includes('result.answer')) {
  console.error('❌ Response structure (result.answer) not documented!');
  process.exit(1);
}
if (!skillContent.includes('result?.reasoning') && !skillContent.includes('result.reasoning')) {
  console.warn('   ⚠️  Reasoning field not mentioned (optional but good to have)');
}
console.log('   ✓ Response structure documented\n');

// Test 5: Check stream() vs run() explained
console.log('✅ Test 5: stream() vs run() explained');
if (!skillContent.includes('stream()') || !skillContent.includes('run()')) {
  console.error('❌ stream() vs run() not explained!');
  process.exit(1);
}
if (!skillContent.includes('raw JSON') || !skillContent.includes('clean text')) {
  console.warn('   ⚠️  Difference between stream() and run() could be clearer');
}
console.log('   ✓ stream() vs run() mentioned\n');

// Test 6: Check simple chat example
console.log('✅ Test 6: Simple chat example');
if (!skillContent.includes('Simple Chat') && !skillContent.includes('No Tools')) {
  console.error('❌ Simple chat example missing!');
  process.exit(1);
}
console.log('   ✓ Simple chat example present\n');

// Test 7: Check reference files exist
console.log('✅ Test 7: Reference files exist');
const refDir = path.join(SKILL_DIR, 'references');
const requiredRefs = ['api-reference.md', 'tools-guide.md', 'examples.md'];
for (const ref of requiredRefs) {
  const refPath = path.join(refDir, ref);
  if (!fs.existsSync(refPath)) {
    console.error(`❌ Missing reference file: ${ref}`);
    process.exit(1);
  }
  const refContent = fs.readFileSync(refPath, 'utf8');
  if (refContent.trim().length < 50) {
    console.error(`❌ Reference file ${ref} is too short (likely empty)`);
    process.exit(1);
  }
}
console.log('   ✓ All reference files exist and have content\n');

// Test 8: Check tools-guide.md has content
console.log('✅ Test 8: tools-guide.md has content');
const toolsGuide = fs.readFileSync(path.join(refDir, 'tools-guide.md'), 'utf8');
if (toolsGuide.trim().length < 100) {
  console.error('❌ tools-guide.md is too short!');
  process.exit(1);
}
if (!toolsGuide.includes('FastAPI') || !toolsGuide.includes('Express')) {
  console.warn('   ⚠️  tools-guide.md missing server examples');
}
console.log('   ✓ tools-guide.md has sufficient content\n');

// Test 9: Check examples.md uses native SDK
console.log('✅ Test 9: Examples use native SDK');
const examples = fs.readFileSync(path.join(refDir, 'examples.md'), 'utf8');
if (examples.includes('from openai import OpenAI') || examples.includes('import OpenAI')) {
  console.error('❌ Examples still use OpenAI SDK!');
  process.exit(1);
}
if (!examples.includes('from subconscious import Subconscious') &&
    !examples.includes('import { Subconscious }')) {
  console.error('❌ Examples missing native SDK!');
  process.exit(1);
}
console.log('   ✓ Examples use native SDK\n');

// Test 10: Check Next.js example
console.log('✅ Test 10: Next.js example present');
if (!examples.includes('Next.js') && !examples.includes('next/server')) {
  console.warn('   ⚠️  Next.js example not found (optional but recommended)');
} else {
  console.log('   ✓ Next.js example present\n');
}

// Test 11: Check common gotchas
console.log('✅ Test 11: Common gotchas section');
if (!skillContent.includes('Common Gotchas') && !skillContent.includes('Gotchas')) {
  console.warn('   ⚠️  Common gotchas section not found');
} else {
  console.log('   ✓ Common gotchas section present\n');
}

console.log('🎉 All critical tests passed!\n');
console.log('📋 Summary:');
console.log('   ✓ Skill file structure correct');
console.log('   ✓ Uses native SDK (not OpenAI SDK)');
console.log('   ✓ Response structure documented');
console.log('   ✓ Reference files complete');
console.log('   ✓ Examples use correct SDK\n');

console.log('🚀 Ready to use! Install with:');
console.log('   npx skills add <your-repo> --skill subconscious-dev\n');
