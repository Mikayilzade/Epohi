'use strict';

const fs = require('node:fs');
const path = require('node:path');

function safeName(value) {
  return value.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-|-$/g, '').slice(0, 120) || 'failure';
}

function failureRecord(test, result) {
  const annotations = Object.fromEntries((test.annotations || []).map(({ type, description }) => [type, description || '']));
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    ci: {
      sha: process.env.GITHUB_SHA || process.env.CI_COMMIT_SHA || null,
      runId: process.env.GITHUB_RUN_ID || null,
      runAttempt: process.env.GITHUB_RUN_ATTEMPT || null
    },
    project: test.parent && test.parent.project ? test.parent.project().name : null,
    file: test.location ? path.relative(process.cwd(), test.location.file) : null,
    title: test.titlePath ? test.titlePath().join(' > ') : test.title,
    status: result.status,
    retry: result.retry,
    durationMs: result.duration,
    annotations,
    errors: (result.errors || []).map((error) => ({ message: error.message || String(error), stack: error.stack || null })),
    attachments: (result.attachments || []).map(({ name, contentType, path: attachmentPath }) => ({
      name,
      contentType,
      path: attachmentPath ? path.relative(process.cwd(), attachmentPath) : null
    }))
  };
}

class FailureDiagnosticsReporter {
  onTestEnd(test, result) {
    if (result.status === 'passed' || result.status === 'skipped') return;
    const record = failureRecord(test, result);
    const project = safeName(record.project || 'unknown-project');
    const file = safeName(record.file || 'unknown-file');
    const title = safeName(test.title || 'unknown-test');
    const outputDir = path.join(process.cwd(), 'test-results', 'failure-diagnostics', project, file, title);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'failure.json'), `${JSON.stringify(record, null, 2)}\n`);
  }
}

module.exports = FailureDiagnosticsReporter;
module.exports.failureRecord = failureRecord;
