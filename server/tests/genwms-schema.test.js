const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const sqlPath = path.resolve(__dirname, '../../genwms.sql');

function mustInclude(sql, pattern, message) {
  assert.match(sql, pattern, message);
}

test('genwms.sql exists', () => {
  assert.ok(fs.existsSync(sqlPath), `Missing file: ${sqlPath}`);
});

test('genwms.sql contains core generic tables', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');

  mustInclude(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`Partner`/i, 'Partner table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`Item`/i, 'Item table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`InboundOrder`/i, 'InboundOrder table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`InboundOrderDetail`/i, 'InboundOrderDetail table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`OutboundOrder`/i, 'OutboundOrder table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+`OutboundOrderDetail`/i, 'OutboundOrderDetail table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+`Inventory`\s*\(/i, 'Inventory table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+`InventoryTransaction`\s*\(/i, 'InventoryTransaction table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+`Wave`\s*\(/i, 'Wave table missing');
  mustInclude(sql, /CREATE\s+TABLE\s+`WaveDetail`\s*\(/i, 'WaveDetail table missing');
});

test('genwms.sql InventoryTransaction supports dashboard + inbound + stocktaking usage', () => {
  const sql = fs.readFileSync(sqlPath, 'utf8');

  mustInclude(sql, /`TransactionDate`\s+DATETIME/i, 'InventoryTransaction.TransactionDate missing');
  mustInclude(sql, /`TransactionType`\s+VARCHAR/i, 'InventoryTransaction.TransactionType missing');
  mustInclude(sql, /`QuantityChange`\s+DECIMAL/i, 'InventoryTransaction.QuantityChange missing');

  mustInclude(sql, /`SourceDocumentNo`\s+VARCHAR/i, 'InventoryTransaction.SourceDocumentNo missing');
  mustInclude(sql, /`ItemID`\s+INT/i, 'InventoryTransaction.ItemID missing');

  mustInclude(sql, /`InventoryID`\s+INT/i, 'InventoryTransaction.InventoryID missing');
  mustInclude(sql, /`RemainingQuantity`\s+DECIMAL/i, 'InventoryTransaction.RemainingQuantity missing');
});

