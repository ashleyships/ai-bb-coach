const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Load the actual server modules without starting a server or calling an API.
function load(filename) {
  filename = path.resolve(filename);
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  const localRequire = (name) => load(path.resolve(path.dirname(filename), name));
  vm.runInNewContext(code, {
    module, exports: module.exports, require: localRequire,
  }, { filename });
  return module.exports;
}

const { getLessonById } = load('server/lessonLibrary.ts');

test('Tree By Streams is retrievable using the existing selection ID', () => {
  const lesson = getLessonById('tree-by-streams');
  assert.equal(lesson.id, 'tree-by-streams');
  assert.equal(lesson.title, 'Tree By Streams');
});

test('unknown and not-yet-populated lesson IDs safely return undefined', () => {
  for (const id of ['unknown', '', 'introduction-to-bible', '__proto__', 'constructor']) {
    assert.equal(getLessonById(id), undefined);
  }
});

const lesson = JSON.parse(JSON.stringify(getLessonById('tree-by-streams')));
const sections = lesson.flow.body.sections;
const section = (id) => sections.find((entry) => entry.id === id);

test('planning and distinct BB stages contain goals and ordered introduction questions', () => {
  assert.equal(lesson.planning.lessonGoals.length, 2);
  assert.match(lesson.planning.lessonGoals[0], /cause of the problem and the solution/);
  assert.match(lesson.planning.lessonGoals[1], /solution.*Word/);
  for (const goals of Object.values(lesson.planning)) assert.ok(goals.length > 0);
  assert.deepEqual(Object.keys(lesson.flow).filter((key) => key !== 'referenceMaterials'), ['intro', 'body', 'conclusion']);
  assert.deepEqual(lesson.flow.intro.questionsToCheck, [
    'What does it look like to have a successful life?',
    'Are you living this life right now?', 'Why not?',
    'Why is your life not this way?', 'What are you doing to change this situation?',
  ]);
  assert.ok(Array.isArray(lesson.flow.intro.buyHeart));
  assert.match(lesson.flow.intro.piqueInterest[0], /reflection, then investment/);
  assert.ok(lesson.flow.intro.goals.length);
});

test('body preserves conceptual progression and section-specific questions', () => {
  assert.deepEqual(sections.map(({ id }) => id), [
    'physical-sprout', 'life-as-a-tree', 'diagnosing-the-root', 'root-and-spirit',
    'caring-for-the-spirit', 'water-and-word', 'word-guiding-life', 'consistency-and-prioritisation',
  ]);
  for (const entry of sections) {
    assert.ok(entry.title);
    assert.ok(entry.flow.length);
  }
  assert.deepEqual(section('water-and-word').questionsToCheck, [
    'How often do we need physical water?', 'What happens if we go without water?',
    'What would happen to a tree without water?',
  ]);
  assert.ok(section('water-and-word').flow.every((point) => !point.endsWith('?')));
});

test('uproot, plant and optional examples are distinct from required concepts', () => {
  assert.match(section('diagnosing-the-root').uproot.join(' '), /wise farmer.*roots/);
  assert.match(section('root-and-spirit').plant.join(' '), /mind, heart and thoughts/);
  assert.equal(section('diagnosing-the-root').plant, undefined);
  assert.equal(section('root-and-spirit').uproot, undefined);
  assert.match(lesson.flow.intro.examples[0], /Elon Musk/);
  assert.ok(lesson.flow.intro.piqueInterest.every((point) => !point.includes('Elon Musk')));
  assert.match(section('physical-sprout').flow.join(' '), /honest reflection/);
  assert.match(section('physical-sprout').examples.join(' '), /mirror/);
});

test('references stay separate and unexplained references are not assigned to stages', () => {
  assert.deepEqual(lesson.scriptureReferences, ['Lamentations 3:33', 'Psalm 107:10-11', 'Psalm 107:19-20']);
  assert.deepEqual(section('life-as-a-tree').scriptureReferences, ['Psalm 1:3']);
  assert.deepEqual(section('root-and-spirit').scriptureReferences, ['3 John 1:2']);
  assert.deepEqual(section('water-and-word').scriptureReferences, ['Deuteronomy 32:2']);
  assert.deepEqual(section('word-guiding-life').scriptureReferences, ['John 1:1', 'Jeremiah 29:11']);
  assert.deepEqual(section('consistency-and-prioritisation').scriptureReferences, ['Jeremiah 29:11-13']);
  assert.ok(lesson.flow.referenceMaterials.length);
});

test('conclusion keeps BB stages and avoids inventing homework or fixed attendance', () => {
  const conclusion = lesson.flow.conclusion;
  for (const key of ['questionsForConfession', 'connectSprout', 'weighing', 'action', 'homework']) {
    assert.ok(Array.isArray(conclusion[key]));
  }
  assert.ok(conclusion.connectSprout.length);
  assert.match(conclusion.weighing.join(' '), /not a universal requirement/);
  assert.match(conclusion.action[0], /through understanding/);
  assert.deepEqual(conclusion.homework, []);
});

test('reference transcript remains separately sectioned and in supplied conversational order', () => {
  const transcript = lesson.referenceTranscript.sections;
  assert.deepEqual(transcript.map(({ id }) => id), [
    'intro', 'physical-sprout', 'life-as-a-tree', 'diagnosing-the-root', 'root-and-spirit',
    'water-and-word', 'word-guiding-life', 'consistency-and-prioritisation', 'continuing-study',
  ]);
  for (const entry of transcript) {
    assert.ok(entry.title);
    assert.ok(entry.content.trim());
  }
  assert.match(transcript[0].content, /Tree By Streams/);
  assert.match(transcript[1].content, /five big circles/);
  assert.match(transcript.at(-1).content, /we can meet three times a week/);
  assert.equal(lesson.flow.referenceTranscript, undefined);
});
