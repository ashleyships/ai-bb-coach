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

test('placeholder retains BB planning and flow without invented content', () => {
  // Normalise VM objects before comparing across JavaScript realms.
  const lesson = JSON.parse(JSON.stringify(getLessonById('tree-by-streams')));
  assert.deepEqual(lesson.planning, {
    lessonGoals: [], confessionGoals: [], weighingGoals: [], actionGoals: [],
  });
  assert.deepEqual(lesson.flow, {
    intro: { buyHeart: [], questionsToCheck: [], piqueInterest: [] },
    body: { flow: [] },
    conclusion: { questionsForConfession: [] },
  });
  assert.equal(lesson.referenceTranscript, undefined);
});
