require('dotenv').config(); // تأكد من تحميل البيئة إذا كنت تستخدم .env

const cloudinary = require("cloudinary").v2;

// تأكد من أن البيئة محملة بشكل صحيح
console.log("Cloudinary Config:", process.env.CLOUD_NAME, process.env.CLOUD_KEY, process.env.CLOUD_SECRET);

cloudinary.uploader.upload("https://mediaaws.almasryalyoum.com/news/large/2022/11/15/1948279_0.jpg", (error, result) => {
  if (error) {
    console.log("Cloudinary Upload Error:", error);
  } else {
    console.log("Cloudinary Upload Success:", result);
  }
});
