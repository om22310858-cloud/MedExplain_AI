// MedExplain_AI Database Restore Utility
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function restore() {
  const backupPath = path.join(__dirname, 'database_backup.json');
  if (!fs.existsSync(backupPath)) {
    console.error('Backup file database_backup.json not found!');
    process.exit(1);
  }

  const rawData = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(rawData);

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medexplain_ai';
  console.log(`Connecting to MongoDB at ${uri}...`);
  await mongoose.connect(uri);

  for (const [colName, docs] of Object.entries(backup)) {
    if (!Array.isArray(docs) || docs.length === 0) continue;
    const col = mongoose.connection.db.collection(colName);
    await col.deleteMany({});
    
    // Parse BSON ObjectIds where applicable
    const parsedDocs = docs.map(doc => {
      const d = { ...doc };
      if (d._id && typeof d._id === 'string' && /^[0-9a-fA-F]{24}$/.test(d._id)) {
        d._id = new mongoose.Types.ObjectId(d._id);
      }
      if (d.userId && typeof d.userId === 'string' && /^[0-9a-fA-F]{24}$/.test(d.userId)) {
        d.userId = new mongoose.Types.ObjectId(d.userId);
      }
      if (d.reportId && typeof d.reportId === 'string' && /^[0-9a-fA-F]{24}$/.test(d.reportId)) {
        d.reportId = new mongoose.Types.ObjectId(d.reportId);
      }
      return d;
    });

    await col.insertMany(parsedDocs);
    console.log(`Restored ${parsedDocs.length} documents into ${colName}`);
  }

  console.log('Database restore complete!');
  await mongoose.disconnect();
}

restore().catch(err => {
  console.error('Restore error:', err);
  process.exit(1);
});
