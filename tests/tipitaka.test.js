import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { tipitakaLoader } from '../src/js/tipitaka-loader.js';

test('45-Volume Tipitaka Brotli (.br) Pipeline Verification', async (t) => {
  const dataDir = path.resolve(process.cwd(), 'src/data/tipitaka');

  await t.test('Index file and all 45 volume .br files exist', () => {
    assert.strictEqual(fs.existsSync(path.join(dataDir, 'index.json.br')), true);
    assert.strictEqual(fs.existsSync(path.join(dataDir, 'index.json')), true);

    for (let i = 1; i <= 45; i++) {
      const volStr = String(i).padStart(2, '0');
      const brFile = path.join(dataDir, `vol_${volStr}.json.br`);
      const jsonFile = path.join(dataDir, `vol_${volStr}.json`);
      
      assert.strictEqual(fs.existsSync(brFile), true, `Volume ${i} .json.br must exist`);
      assert.strictEqual(fs.existsSync(jsonFile), true, `Volume ${i} .json must exist`);
    }
  });

  await t.test('Brotli decompression validates all 45 volumes without error', () => {
    for (let i = 1; i <= 45; i++) {
      const volStr = String(i).padStart(2, '0');
      const brFile = path.join(dataDir, `vol_${volStr}.json.br`);
      const compressed = fs.readFileSync(brFile);
      
      const decompressed = zlib.brotliDecompressSync(compressed).toString('utf-8');
      const data = JSON.parse(decompressed);

      assert.strictEqual(data.volume, i);
      assert.ok(data.bookTitle, `Volume ${i} must have a book title`);
      assert.ok(data.pitaka, `Volume ${i} must belong to a Pitaka`);
      assert.ok(data.sections.length > 0, `Volume ${i} must have at least 1 section`);
      
      // Verify first section pages
      const firstSec = data.sections[0];
      assert.ok(firstSec.id.startsWith(`tipitaka-v${volStr}`));
      assert.ok(firstSec.pages.length > 0);
      assert.ok(firstSec.pages[0].pali.length > 0);
      assert.ok(firstSec.pages[0].thai.length > 0);
    }
  });

  await t.test('TipitakaLoader loads index and volume via lazy loading', async () => {
    tipitakaLoader.setBasePath(dataDir);
    const index = await tipitakaLoader.loadIndex();
    
    assert.strictEqual(index.totalVolumes, 45);
    assert.strictEqual(index.stats.vinayaVolumes, 8);
    assert.strictEqual(index.stats.suttaVolumes, 25);
    assert.strictEqual(index.stats.abhidhammaVolumes, 12);

    // Test volume loading
    const vol1 = await tipitakaLoader.loadVolume(1);
    assert.strictEqual(vol1.volume, 1);
    assert.strictEqual(vol1.pitaka, 'พระวินัยปิฎก');

    const vol25 = await tipitakaLoader.loadVolume(25);
    assert.strictEqual(vol25.volume, 25);
    assert.strictEqual(vol25.pitaka, 'พระสุตตันตปิฎก');

    const vol45 = await tipitakaLoader.loadVolume(45);
    assert.strictEqual(vol45.volume, 45);
    assert.strictEqual(vol45.pitaka, 'พระอภิธรรมปิฎก');
  });

  await t.test('Tipitaka search engine finds relevant volumes', async () => {
    tipitakaLoader.setBasePath(dataDir);
    
    const searchDhammapada = await tipitakaLoader.search('ธรรมบท');
    assert.ok(searchDhammapada.length > 0);
    assert.strictEqual(searchDhammapada[0].volume, 25);

    const searchVinaya = await tipitakaLoader.search('พระวินัยปิฎก');
    assert.strictEqual(searchVinaya.length, 8);

    const searchAbhidhamma = await tipitakaLoader.search('พระอภิธรรมปิฎก');
    assert.strictEqual(searchAbhidhamma.length, 12);
  });
});
