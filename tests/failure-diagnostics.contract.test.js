'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { failureRecord } = require('../scripts/failure-diagnostics-reporter');

test('failure diagnostics serialize CI, project, test, annotations, errors and attachments', () => {
  const previousSha = process.env.GITHUB_SHA;
  process.env.GITHUB_SHA = 'abc123';
  try {
    const record = failureRecord({
      title: 'survives',
      titlePath: () => ['soak', 'seed 30303', 'survives'],
      location: { file: `${process.cwd()}/tests/autonomous-soak.spec.js` },
      annotations: [{ type: 'seed', description: '30303' }, { type: 'last-boundary', description: 'before-end-turn' }],
      parent: { project: () => ({ name: 'webkit-mobile' }) }
    }, {
      status: 'failed', retry: 0, duration: 42,
      errors: [{ message: 'turn did not advance', stack: 'stack' }],
      attachments: [{ name: 'trace', contentType: 'application/zip', path: `${process.cwd()}/test-results/trace.zip` }]
    });
    assert.equal(record.ci.sha, 'abc123');
    assert.equal(record.project, 'webkit-mobile');
    assert.equal(record.file, 'tests/autonomous-soak.spec.js');
    assert.equal(record.annotations.seed, '30303');
    assert.equal(record.annotations['last-boundary'], 'before-end-turn');
    assert.equal(record.errors[0].message, 'turn did not advance');
    assert.equal(record.attachments[0].path, 'test-results/trace.zip');
  } finally {
    if (previousSha === undefined) delete process.env.GITHUB_SHA;
    else process.env.GITHUB_SHA = previousSha;
  }
});
