const Applicant = require('../models/Applicant');
const JobOpening = require('../models/JobOpening');
const sendEmail = require("../../utlis/sendEmail");

exports.createApplicant = async (req, res) => {
  try {
    const { name, mobile, email, age, experience, jobOpening  } = req.body;

    // Check job
    const job = await JobOpening.findOne({ _id: jobOpening, status: 'approved' });
    console.log('job' ,job)
    if (!job) {
      return res.status(400).json({ success: false, message: 'الوظيفة غير موجودة أو لم تعتمد بعد' });
    }

    const cvUrl = req.file.path;

    const applicant = await Applicant.create({
      name,
      mobile,
      email,
      age,
      experience,
      cv: cvUrl,
      jobOpening
    });

    // ⬇ إرسال إيميل بعد التقديم
    await sendEmail(
      email,
      "تم استلام طلب التوظيف",
      `
      <h3>أهلاً ${name} 👋</h3>
      <p>تم استلام طلبك للتقديم على وظيفة <b>${job.title}</b>.</p>
      <p>سيتواصل معك فريق التوظيف في حال قبول طلبك للمرحلة التالية.</p>
      <p>مع تحيات فريق الموارد البشرية</p>
      `
    );

    res.status(201).json({
      success: true,
      message: "تم تقديم الطلب بنجاح",
      applicant,
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


// GET كل المتقدمين (لـ HR)
exports.getAllApplicants = async (req, res) => {
  try {
    const applicants = await Applicant.find()
      .populate("jobOpening", "title department")
      .sort({ createdAt: -1 });

    res.json({ success: true, applicants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

///
exports.getApplicantById = async (req, res) => {
  try {
    const { id } = req.params;

    const applicant = await Applicant.findById(id)
      .populate("jobOpening", "title department");

    if (!applicant) return res.status(404).json({ message: "Not found" });

    res.status(200).json(applicant);
  } catch (err) {
    res.status(500).json({ message: "Error fetching applicant" });
  }
};

//
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await Applicant.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating status" });
  }
};

exports.updateNotes = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const updated = await Applicant.findByIdAndUpdate(
      id,
      { notes },
      { new: true }
    );
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating notes" });
  }              
};         
                  

                // GET /api/applicants/by-department/:departmentId
exports.getApplicantsByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;

    const applicants = await Applicant.find()
      .populate({
        path: 'jobOpening',
        match: { department: departmentId },
        populate: { path: 'department', select: 'name' }
      })
      .sort({ createdAt: -1 });

    // remove nulls
    const filtered = applicants.filter(a => a.jobOpening);

    res.json({
      success: true,
      applicants: filtered
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
           