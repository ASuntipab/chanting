import { test } from 'node:test';
import assert from 'node:assert';
import { HEALTH_HEALING_PRAYERS } from '../src/js/prayers-health-healing.js';
import { DEFAULT_PRAYERS } from '../src/js/default-prayers.js';
import { DhammaTTSEngine } from '../src/js/tts-engine.js';

test('Health & Healing Prayers Collection Verification', async (t) => {
  await t.test('HEALTH_HEALING_PRAYERS has exactly 12 unique sacred healing chants', () => {
    assert.strictEqual(HEALTH_HEALING_PRAYERS.length, 12, 'Must have 12 prayers');
    
    const ids = new Set();
    HEALTH_HEALING_PRAYERS.forEach(p => {
      assert.ok(p.id, 'Prayer must have an ID');
      assert.ok(!ids.has(p.id), `Duplicate ID found: ${p.id}`);
      ids.add(p.id);
      
      assert.ok(p.title, `Prayer ${p.id} must have a title`);
      assert.strictEqual(p.category, 'สุขภาพ', `Prayer ${p.id} category must be สุขภาพ`);
      assert.ok(p.author, `Prayer ${p.id} must have an author`);
      assert.ok(p.description, `Prayer ${p.id} must have a description`);
      assert.ok(Array.isArray(p.pages) && p.pages.length > 0, `Prayer ${p.id} must have at least 1 page`);
      
      p.pages.forEach((page, idx) => {
        assert.strictEqual(page.pageNumber, idx + 1, `Page number must match 1-indexed order`);
        assert.ok(page.verseTitle, `Page ${idx + 1} of ${p.id} must have a verseTitle`);
        assert.ok(page.pali && page.pali.trim().length > 0, `Page ${idx + 1} of ${p.id} must have pali text`);
        assert.ok(page.thai && page.thai.trim().length > 0, `Page ${idx + 1} of ${p.id} must have thai text`);
      });
    });
  });

  await t.test('DEFAULT_PRAYERS integrates all 12 health prayers seamlessly without collision', () => {
    const defaultIds = new Set(DEFAULT_PRAYERS.map(p => p.id));
    assert.strictEqual(defaultIds.size, DEFAULT_PRAYERS.length, 'No duplicate IDs in DEFAULT_PRAYERS');

    HEALTH_HEALING_PRAYERS.forEach(hp => {
      assert.ok(defaultIds.has(hp.id), `DEFAULT_PRAYERS must contain ${hp.id}`);
    });
  });

  await t.test('Health category filter logic matches 12 new health prayers + classic healing suttas', () => {
    const healthPrayers = DEFAULT_PRAYERS.filter(p => 
      p.category === 'สุขภาพ' || 
      p.id === 'bojjhanga-paritta' || 
      p.id === 'ratana-sutta' || 
      p.id === 'girimananda-sutta' ||
      (p.title && (p.title.includes('รักษาโรค') || p.title.includes('โรคระบาด')))
    );

    assert.ok(healthPrayers.length >= 15, `Expected at least 15 health-related prayers, found ${healthPrayers.length}`);
    
    // Check specific anchor prayers
    const ids = healthPrayers.map(p => p.id);
    assert.ok(ids.includes('sakkatva-buddha-osatha'), 'Contains Sakkatva');
    assert.ok(ids.includes('unhissavijaya-longevity'), 'Contains Unhissavijaya');
    assert.ok(ids.includes('jivaka-komarabhacca'), 'Contains Jivaka');
    assert.ok(ids.includes('lp-ruesi-healing'), 'Contains Luang Por Ruesi');
    assert.ok(ids.includes('bhaisajyaguru-mantra'), 'Contains Medicine Buddha');
    assert.ok(ids.includes('lp-sook-healing-water'), 'Contains Luang Pu Sook');
    assert.ok(ids.includes('mongkut-phra-buddha-jao'), 'Contains Mongkut Buddha');
    assert.ok(ids.includes('phra-jao-ha-phra-ong-healing'), 'Contains 5 Buddhas');
    assert.ok(ids.includes('phra-buddha-28-namo'), 'Contains 28 Buddhas');
    assert.ok(ids.includes('maha-chakkravarti-healing'), 'Contains Maha Chakkravarti');
    assert.ok(ids.includes('kaew-sarapad-nuek-healing'), 'Contains Kaew Sarapad Nuek');
    assert.ok(ids.includes('thippaya-mantra-dhatu-lee'), 'Contains Thippaya Mantra');
    assert.ok(ids.includes('bojjhanga-paritta'), 'Contains Bojjhanga Paritta');
    assert.ok(ids.includes('ratana-sutta'), 'Contains Ratana Sutta');
    assert.ok(ids.includes('girimananda-sutta'), 'Contains Girimananda Sutta');
  });

  await t.test('TTS Engine successfully processes and normalizes all 12 health prayers', () => {
    const tts = new DhammaTTSEngine();
    tts.setMode('both');
    HEALTH_HEALING_PRAYERS.forEach(p => {
      tts.prepareQueue(p);
      assert.ok(tts.queue.length > 0, `Queue for ${p.id} must not be empty`);
      tts.queue.forEach(item => {
        assert.ok(item.text && item.text.length > 0, `TTS item text must not be empty in ${p.id}`);
        assert.ok(['title', 'pali', 'thai'].includes(item.type), `TTS item must have valid type`);
      });
    });
  });

  await t.test('Build assets in www/ directory are correctly packaged and synced', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const wwwHealthJs = path.join(process.cwd(), 'www', 'src', 'js', 'prayers-health-healing.js');
    const wwwHtml = path.join(process.cwd(), 'www', 'index.html');
    
    assert.ok(fs.existsSync(wwwHealthJs), 'www/src/js/prayers-health-healing.js must exist');
    const htmlContent = fs.readFileSync(wwwHtml, 'utf8');
    assert.ok(htmlContent.includes('value="สุขภาพ"'), 'www/index.html must include health category option');
  });
});
