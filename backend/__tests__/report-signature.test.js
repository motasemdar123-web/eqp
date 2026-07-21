const fs = require('fs');
const os = require('os');
const path = require('path');

const { findSignaturePath, getSignatureStatus } = require('../src/services/reportSignatureService');

describe('report signature resolution', () => {
  let signatureRoot;

  beforeEach(() => {
    signatureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'eqp-signatures-'));
  });

  afterEach(() => {
    fs.rmSync(signatureRoot, { recursive: true, force: true });
  });

  it('prefers a full-name signature for the authenticated user', () => {
    fs.writeFileSync(path.join(signatureRoot, 'faisal-signature.png'), 'first-name');
    fs.writeFileSync(path.join(signatureRoot, 'faisal-inaya-signature.png'), 'full-name');

    const signaturePath = findSignaturePath({ full_name: 'Faisal Inaya' }, signatureRoot);

    expect(path.basename(signaturePath)).toBe('faisal-inaya-signature.png');
  });

  it('supports legacy signature filenames after exact matches are checked', () => {
    fs.writeFileSync(path.join(signatureRoot, 'abdelrahman-signature - Copy.png'), 'legacy');

    const signaturePath = findSignaturePath({ full_name: 'Abdelrahman Abdullah' }, signatureRoot);

    expect(path.basename(signaturePath)).toBe('abdelrahman-signature - Copy.png');
  });

  it('reports when a user has no configured signature', () => {
    expect(getSignatureStatus({ full_name: 'Mahmoud Qaddour' }, signatureRoot)).toEqual({
      available: false,
      path: null,
      fileName: null,
    });
  });
});
