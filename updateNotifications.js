const mongoose = require("mongoose");
const Notification = require("./Admin/models/notification"); // عدّل المسار حسب مكان الموديل عندك

// وصل الـ MongoDB
mongoose.connect("mongodb://samahsalah2555:samahsalah2555@ac-syrodyh-shard-00-00.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-01.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-02.xpqnok3.mongodb.net:27017/?replicaSet=atlas-bfkn2s-shard-0&ssl=true&authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("متصل بقاعدة البيانات");

  // تحديث الإشعارات
  Notification.updateMany(
    { type: "meeting" },
    { $set: { link: "/employee/meetings" } }
  )
    .then((res) => {
      console.log("تم تحديث الإشعارات:", res.modifiedCount);
      mongoose.disconnect();
    })
    .catch((err) => {
      console.error("خطأ أثناء التحديث:", err);
      mongoose.disconnect();
    });
})
.catch((err) => console.error("فشل الاتصال بقاعدة البيانات:", err));
