// scripts/updateSystemSettings.js
const mongoose = require("mongoose");
const SystemSettings = require("../Admin/models/systemSettingsSchema");

async function updateSystemSettings() {
  try {
    // اتصال بقاعدة البيانات
    await mongoose.connect("mongodb://samahsalah2555:samahsalah2555@ac-syrodyh-shard-00-00.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-01.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-02.xpqnok3.mongodb.net:27017/?replicaSet=atlas-bfkn2s-shard-0&ssl=true&authSource=admin", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // تحديث جميع السجلات
    const result = await SystemSettings.updateMany(
      {},
      {
        $set: {
          "steps.records": false,
          "steps.residency": false,
        },
      }
    );

    console.log(`✅ تم تحديث ${result.modifiedCount} سجل بنجاح`);
    process.exit(0);
  } catch (error) {
    console.error("❌ حدث خطأ:", error);
    process.exit(1);
  }
}

updateSystemSettings();
