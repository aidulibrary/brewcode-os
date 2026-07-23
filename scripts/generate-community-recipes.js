#!/usr/bin/env node
/**
 * generate-community-recipes.js
 *
 * Scans packages/player/seeds/community/ for .brew.json files,
 * extracts metadata, and writes community-recipes.json.
 *
 * Usage: node scripts/generate-community-recipes.js
 */

const fs = require('fs');
const path = require('path');

const COMMUNITY_DIR = path.resolve(__dirname, '..', 'packages', 'player', 'seeds', 'community');
const OUTPUT = path.resolve(__dirname, '..', 'packages', 'repo', 'community-recipes.json');

if (!fs.existsSync(COMMUNITY_DIR)) {
  fs.mkdirSync(COMMUNITY_DIR, { recursive: true });
}

const files = fs.readdirSync(COMMUNITY_DIR).filter(f => f.endsWith('.brew.json'));

const recipes = [];
for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(COMMUNITY_DIR, file), 'utf-8');
    const brew = JSON.parse(raw);
    const meta = brew.meta || {};
    const coffee = brew.coffee || {};
    const equipment = brew.equipment || {};

    recipes.push({
      name: meta.name || file.replace('.brew.json', ''),
      author: meta.author || 'Community',
      authorAvatarUrl: meta.authorAvatarUrl || '',
      origin: coffee.origin || '',
      variety: coffee.variety || '',
      process: coffee.process || '',
      roastLevel: coffee.roastLevel || '',
      roastDate: meta.roastDate || '',
      brewer: equipment.brewer || 'V60',
      grinder: equipment.grinder || '',
      ratio: meta.ratio || '',
      rating: meta.rating || 0,
      description: coffee.flavorNotes || '',
      file: file,
      filePath: 'community/' + file,
      submittedAt: meta.submittedAt || new Date().toISOString().split('T')[0],
    });
  } catch (e) {
    console.error('Error parsing ' + file + ':', e.message);
  }
}

// Sort by submission date (newest first)
recipes.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));

fs.writeFileSync(OUTPUT, JSON.stringify(recipes, null, 2), 'utf-8');
console.log('Generated community-recipes.json with ' + recipes.length + ' recipe(s)');
