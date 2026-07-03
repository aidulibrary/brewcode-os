/**
 * sync-common.js — 从权威源 packages/common/ 同步文件到各子包
 * 零依赖，仅使用 Node.js 内置模块 fs、path
 * 用法：node scripts/sync-common.js
 */
const fs = require('fs');
const path = require('path');

const SOURCE = 'packages/common';
const TARGETS = ['packages/forge/common', 'packages/repo/common', 'packages/player/common'];

const ROOT = path.resolve(__dirname, '..');

const srcDir = path.join(ROOT, SOURCE);
if (!fs.existsSync(srcDir)) {
  console.error(`错误：源目录不存在 — ${srcDir}`);
  process.exit(1);
}

let count = 0;

function walkAndSync(dir, relativePath) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const name = entry.name;
    // 跳过隐藏文件和常见非业务目录
    if (name.startsWith('.')) continue;

    const fullPath = path.join(dir, name);
    const relPath = relativePath ? path.join(relativePath, name) : name;

    if (entry.isDirectory()) {
      walkAndSync(fullPath, relPath);
    } else if (entry.isFile()) {
      const srcContent = fs.readFileSync(fullPath);
      for (const target of TARGETS) {
        const targetDir = path.join(ROOT, target, relativePath);
        fs.mkdirSync(targetDir, { recursive: true });
        const targetPath = path.join(targetDir, name);
        fs.writeFileSync(targetPath, srcContent);
        console.log(`${path.join(SOURCE, relPath)} → ${path.join(target, relPath)}`);
        count++;
      }
    }
  }
}

walkAndSync(srcDir, '');
console.log(`\n同步完成，共复制 ${count} 个文件。`);
