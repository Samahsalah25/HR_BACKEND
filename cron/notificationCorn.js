const cron = require("node-cron");
const Notification = require("../Admin/models/notification");
const { io, onlineUsers } = require("../server");

// كل دقيقة نراجع الاجتماعات اللي قربت
cron.schedule("* * * * *", async () => {
  const now = new Date();
  const in15min = new Date(now.getTime() + 15 * 60000);

  const meetings = await Meeting.find({
    day: { $eq: now.toISOString().split("T")[0] }, // نفس اليوم
    startTime: { $eq: `${in15min.getHours().toString().padStart(2, "0")}:${in15min.getMinutes().toString().padStart(2, "0")}` }
  }).populate("participants");

  for (let meeting of meetings) {
    for (let participant of meeting.participants) {
      const notification = await Notification.create({
        employee: participant._id,
        type: "meeting",
        message: `تذكير: اجتماع "${meeting.title}" يبدأ بعد 15 دقيقة`,
        link: `/meetings/${meeting._id}`
      });

      const socketId = onlineUsers.get(participant._id.toString());
      if (socketId) {
        io.to(socketId).emit("notification", notification);
      }
    }
  }
});
