const fs = require('fs');
const path = require('path');
const { parsePdxHtmlTable, sanitizeQty } = require('../src/services/komatsuInquiryService');

describe('PDX HTML Table Parser & Stock Sanitization', () => {
  const sampleHtmlPath = path.join(__dirname, '../../tools/komatsu_inquiry_app/pdx_search_result.html');
  const sampleHtml = fs.existsSync(sampleHtmlPath) ? fs.readFileSync(sampleHtmlPath, 'utf8') : '';

  describe('sanitizeQty', () => {
    test('strictly rejects part numbers containing hyphens or letters', () => {
      // Part numbers should NEVER parse as stock integers
      expect(sanitizeQty('208-62-21260')).toBe('0');
      expect(sanitizeQty('234-07-81110')).toBe('0');
      expect(sanitizeQty('424-S62-4290')).toBe('0');
      expect(sanitizeQty('6742-01-4540')).toBe('0');
      expect(sanitizeQty('ABC123')).toBe('0');
    });

    test('correctly parses valid numerical stock quantities', () => {
      expect(sanitizeQty('0')).toBe('0');
      expect(sanitizeQty('5')).toBe('5');
      expect(sanitizeQty('3642')).toBe('3642');
      expect(sanitizeQty('1,610')).toBe('1610');
      expect(sanitizeQty('   122   ')).toBe('122');
    });

    test('returns 0 for empty or invalid values', () => {
      expect(sanitizeQty('')).toBe('0');
      expect(sanitizeQty(null)).toBe('0');
      expect(sanitizeQty(undefined)).toBe('0');
      expect(sanitizeQty('-5')).toBe('0');
    });
  });

  describe('parsePdxHtmlTable with real PDX HTML response', () => {
    test('correctly parses real stock numbers and avoids part number prefix truncation', () => {
      expect(sampleHtml).toBeTruthy();
      const rows = parsePdxHtmlTable(sampleHtml, ['6742-01-4540', '600-319-3750']);

      expect(rows.length).toBeGreaterThanOrEqual(4);

      // Check first queried part 6742-01-4540
      const row1 = rows.find((r) => r.rawPartNumber === '6742-01-4540');
      expect(row1).toBeDefined();
      expect(row1.kmeStock).toBe('3642'); // NOT 6742 (part number prefix)
      expect(row1.eor).toBe('122');
      expect(row1.onOrder).toBe('0');
      expect(row1.dnetPrice).toBe('42.42');
      expect(row1.description).toBe('CARTRIDGE');

      // Check alternative part 6742-01-5524
      const altRow = rows.find((r) => r.rawPartNumber === '6742-01-5524');
      expect(altRow).toBeDefined();
      expect(altRow.kmeStock).toBe('0');
      expect(altRow.eor).toBe('0');

      // Check second queried part 600-319-3750
      const row2 = rows.find((r) => r.rawPartNumber === '600-319-3750');
      expect(row2).toBeDefined();
      expect(row2.kmeStock).toBe('1626'); // NOT 600 (part number prefix)
      expect(row2.eor).toBe('124');
      expect(row2.onOrder).toBe('864');
      expect(row2.dnetPrice).toBe('32.00');
    });
  });

  describe('Dynamic thead header mapping & layout robustness', () => {
    test('correctly maps columns when headers are reordered', () => {
      const customHtml = `
        <table>
          <thead>
            <tr>
              <td>Part No</td>
              <td>Part Description</td>
              <td>KME Stock</td>
              <td>KME EOR</td>
              <td>DNet Price</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>208-62-21260</td>
              <td>CONTROL VALVE</td>
              <td>15</td>
              <td>3</td>
              <td class="ListPrice">250.00</td>
            </tr>
          </tbody>
        </table>
      `;

      const rows = parsePdxHtmlTable(customHtml, ['208-62-21260']);
      expect(rows).toHaveLength(1);
      expect(rows[0].rawPartNumber).toBe('208-62-21260');
      expect(rows[0].description).toBe('CONTROL VALVE');
      expect(rows[0].kmeStock).toBe('15');
      expect(rows[0].eor).toBe('3');
      expect(rows[0].dnetPrice).toBe('250.00');
    });

    test('ignores hidden display:none internal columns and aligns visible data', () => {
      const htmlWithHidden = `
        <table>
          <thead>
            <tr>
              <td>Part No</td>
              <td></td>
              <td></td>
              <td>Part Description</td>
              <td>CC</td>
              <td>IC</td>
              <td>LPN</td>
              <td>KME Stock</td>
              <td>KME EOR</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>234-07-81110</td>
              <td></td>
              <td></td>
              <td>HOSE</td>
              <td>000</td>
              <td></td>
              <td>234-07-81110</td>
              <td style="display: none;">hidden_data</td>
              <td>42</td>
              <td>2</td>
            </tr>
          </tbody>
        </table>
      `;

      const rows = parsePdxHtmlTable(htmlWithHidden, ['234-07-81110']);
      expect(rows).toHaveLength(1);
      expect(rows[0].kmeStock).toBe('42');
      expect(rows[0].eor).toBe('2');
    });

    test('guarantees stock never receives part number string even if column shifted', () => {
      const shiftedHtml = `
        <table>
          <thead>
            <tr>
              <td>Part No</td>
              <td>Part Description</td>
              <td>KME Stock</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>424-S62-4290</td>
              <td>BEARING</td>
              <td>424-S62-4290</td>
            </tr>
          </tbody>
        </table>
      `;

      const rows = parsePdxHtmlTable(shiftedHtml, ['424-S62-4290']);
      expect(rows).toHaveLength(1);
      // Sanitizer must reject the part number string and safely yield '0'
      expect(rows[0].kmeStock).toBe('0');
      expect(parseInt(rows[0].kmeStock, 10)).toBe(0); // NEVER 424!
    });
  });
});
