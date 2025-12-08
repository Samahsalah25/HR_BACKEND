const Interview = require("../models/interviewModel");
const Applicant = require("../models/Applicant");


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
      <p><b>التاريخ:</b> ${interview.date}</p>
      ${interview.location ? `<p><b>الموقع/الرابط:</b> ${interview.location}</p>` : ""}
      <p>نتمنى لك التوفيق ✨</p>
      `
    );

    res.status(201).json(interview);

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


    if (result === "failed") {
      await Applicant.findByIdAndUpdate(interview.applicant, { status: "rejected" });

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

    res.status(200).json(interview);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

