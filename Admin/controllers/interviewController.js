const Interview = require("../models/interviewModel");
const Applicant = require("../models/Applicant");
const Employee = require("../models/employee");

const sendEmail = require("../../utlis/sendEmail");

exports.createInterview = async (req, res) => {
  try {
    const interview = await Interview.create(req.body);

    const applicant = await Applicant.findById(interview.applicant).populate('jobOpening');

    // Update applicant status automatically
    await Applicant.findByIdAndUpdate(interview.applicant, {
      status: "interview",
    });

    // إرسال إيميل دعوة مقابلة
    await sendEmail(
      applicant.email,
      `دعوة لإجراء مقابلة: ${interview.title}`,
      `
      <h3>مرحباً ${applicant.name}</h3>
      <p>نود إبلاغك بأنه تم تحديد مقابلة لك على وظيفة <b>${applicant.jobOpening.title}</b>.</p>
      <p><b>المقابلة:</b> ${interview.title}</p>
      <p><b>النوع:</b> ${interview.type}</p>
      <p><b>التاريخ:</b> اليوم : ${interview.date}  : الساعة ${interview.time}</p>
      ${interview.location ? `<p><b>الموقع/الرابط:</b> ${interview.location}</p>` : ""}
      <p>نتمنى لك التوفيق ✨</p>
      `
    );

    res.status(201).json({interview ,success:true});

  } catch (err) {
    console.error(err); 
    res.status(500).json({ message: err.message });
  }
};


// Get all interviews for applicant
exports.getApplicantInterviews = async (req, res) => {
  try {
    const { applicantId } = req.params;
    const interviews = await Interview.find({ applicant: applicantId });

    res.status(200).json(interviews);
  } catch (err) {
    res.status(500).json({ message: "Error fetching interviews" });
  }
};

// Update interview
exports.updateInterview = async (req, res) => {
  try {
    const updated = await Interview.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating interview" });
  }
};


// Update Result
exports.updateInterviewResult = async (req, res) => {
  try {
    const { result, rating, notes } = req.body;

    const interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { result, rating, notes },
      { new: true }
    );

    // نجيب الـ applicant مع اسم الوظيفة
    const applicant = await Applicant.findById(interview.applicant).populate('jobOpening');

    
    if (result === "passed" && interview.title.toLowerCase().includes("final")) {
    
    await Applicant.findByIdAndUpdate(interview.applicant, {
      status: "hired"
    });

    
    await sendEmail(
      applicant.email,
      "🎉 تهانينا! تم قبولك في الوظيفة",
      `
      <h3>مرحباً ${applicant.name}</h3>
      <p>يسعدنا إبلاغك بقبولك النهائي في وظيفة <b>${applicant.jobOpening.title}</b>.</p>
      <p>سيتم التواصل معك قريباً لإرسال عقد العمل وتحديد ميعاد البدء.</p>
      <p>تهانينا 🎉❤️</p>
      `
    );
}


    if (result === "passed") {
      

      //  إرسال إيميل رفض 
      await sendEmail(
        applicant.email,
        `نتيجة المقابلة: ${interview.title}`,
        `
        <h3>مرحباً ${applicant.name}</h3>
        <p> تهانينا 🎉❤️ تم قبولك في مقابلة <b>${interview.title}</b></p>
        <p>الوظيفة: <b>${applicant.jobOpening.title}</b></p>
        <p>  انتظر تحديد المقابلة القادمة </p>
        `
      );
    }


    if (result === "failed") {


      //  إرسال إيميل رفض 
      await sendEmail(
        applicant.email,
        `نتيجة المقابلة: ${interview.title}`,
        `
        <h3>مرحباً ${applicant.name}</h3>
        <p>نشكر لك وقتك… للأسف لم تجتز المقابلة: <b>${interview.title}</b></p>
        <p>الوظيفة: <b>${applicant.jobOpening.title}</b></p>
        <p>نتمنى لك التوفيق في الفرص القادمة 🙏</p>
        `
      );
    }

    res.status(200).json({interview ,success:true});

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};




exports.getInterviewsOverview = async (req, res) => {
  try {
    const data = await Applicant.aggregate([
      // join jobOpening
      {
        $lookup: {
          from: "jobopenings",
          localField: "jobOpening",
          foreignField: "_id",
          as: "job"
        }
      },
      { $unwind: "$job" },

      // join department
      {
        $lookup: {
          from: "departments",
          localField: "job.department",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: "$department" },

      // join interviews
      {
        $lookup: {
          from: "interviews",
          localField: "_id",
          foreignField: "applicant",
          as: "interviews"
        }
      },

      // فقط الابلكيشنز اللي عندهم مقابلات
      {
        $match: {
          "interviews.0": { $exists: true }
        }
      },

      // ترتيب المقابلات من الأحدث للأقدم
      {
        $addFields: {
          interviews: {
            $sortArray: {
              input: "$interviews",
              sortBy: { date: -1 }
            }
          }
        }
      },

      // add calculated fields
      {
        $addFields: {
          interviewsCount: { $size: "$interviews" },

          hasPendingInterviews: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$interviews",
                    as: "i",
                    cond: { $eq: ["$$i.result", "pending"] }
                  }
                }
              },
              0
            ]
          },

          // آخر مقابلة (الأولى بعد الترتيب)
          lastInterview: { $arrayElemAt: ["$interviews.date", 0] },
          lastInterviewTitle: { $arrayElemAt: ["$interviews.title", 0] },

          // map كل المقابلات مع isDone
          interviews: {
            $map: {
              input: "$interviews",
              as: "i",
              in: {
                _id: "$$i._id",
                title: "$$i.title",
                date: "$$i.date",
                time: "$$i.time",
                type: "$$i.type",
                location: "$$i.location",
                result: "$$i.result",
                rating: "$$i.rating",
                notes: "$$i.notes",
                isDone: {
                  $cond: [
                    { $ne: ["$$i.result", "pending"] },
                    true,
                    false
                  ]
                }
              }
            }
          }
        }
      },

      // project النهائي
      {
        $project: {
          id: "$_id",
          applicantName: "$name",
          job: "$job.title",
          department: "$department.name",
          interviews: 1,
          interviewsCount: 1,
          lastInterview: 1,
          lastInterviewTitle: 1,
          status: 1 // زي ما هي في DB
        }
      },

      { $sort: { createdAt: -1 } }
    ]);

    res.status(200).json({
      success: true,
      interviews: data
    });

  } catch (err) {
    console.error("REAL ERROR ===>", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};




exports.getMyInterviews = async (req, res) => {
  try {
    console.log("USER FROM TOKEN:", req.user);

    // 1️⃣ نجيب الـ employee
    const employee = await Employee.findOne({ user: req.user._id });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found"
      });
    }

    // 2️⃣ نجيب الانترفيوز مع applicant + job
    const interviews = await Interview.find({
      interviewer: employee._id
    })
      .populate({
        path: "applicant",
        select: "name jobOpening",
        populate: {
          path: "jobOpening",
          select: "title"
        }
      })
      .sort({ date: 1, time: 1 });

    const now = new Date();

    // 3️⃣ format response
    const formatted = interviews.map((i) => {
      const interviewDate = new Date(i.date);

      let status = "لم تُجرَ بعد";

      if (
        interviewDate.toDateString() === now.toDateString() &&
        i.result === "pending"
      ) {
        status = "جارية الآن";
      }

      if (i.result === "passed" || i.result === "failed" ) {
        status = "تم إجراؤها";
      }

      return {
        id: i._id,
        applicantName: i.applicant?.name,
        job: i.applicant?.jobOpening?.title,
        title: i.title,
        day: i.date.toISOString().split("T")[0],
        time: i.time,
        type: i.type,
        location: i.location,
        status,
        result: i.result,

        
        rate: i.rating ?? null,
        notes: i.notes ?? "",

        accepted:
          i.result === "passed"
            ? true
            : i.result === "failed"
            ? false
            : null
      };
    });

    res.status(200).json({
      success: true,
      interviews: formatted
    });

  } catch (err) {
    console.error(" getMyInterviews error:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
