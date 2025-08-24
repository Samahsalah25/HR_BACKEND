const cron = require('node-cron');
const Task = require('../Admin/models/Task')

function startTaskStatusCron() {
  cron.schedule('59 23 * * *', async () => {
    const now = new Date();

    try {
  
      await Task.updateMany(
        { progressPercentage: { $lt: 100 }, dueDate: { $lt: now } },
        { $set: { status: 'متأخرة', lastUpdated: now } }
      );


      await Task.updateMany(
        { progressPercentage: 100 },
        { $set: { status: 'مكتملة', lastUpdated: now } }
      );

      console.log('✅ [CRON] تم تحديث حالات المهام تلقائيًا');
    } catch (err) {
      console.error('❌ [CRON] خطأ أثناء تحديث الحالات:', err.message);
    }
  });
}

module.exports = startTaskStatusCron;
