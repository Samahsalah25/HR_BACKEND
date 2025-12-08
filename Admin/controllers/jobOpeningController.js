// controllers/jobOpeningController.js

const JobOpening =require("../models/JobOpening")

// إنشاء طلب وظيفة جديدة
exports.createJobOpening = async (req, res) => {
  try {
    const {
      title,
      department, 
      experienceRequired,
      skills,
      employmentType,
      salaryRange,
      description
    } = req.body;

    // نعمل الـ Job Opening
    const jobOpening = await JobOpening.create({
      title,
      department,
      experienceRequired,
      skills,
      employmentType,
      salaryRange,
      description,
      requestedBy: req.user._id // من التوكن
    });

    res.status(201).json({
      message: "Job opening request created successfully",
      jobOpening
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};


exports.getAllJobOpenings = async (req, res) => {
  try {
    const openings = await JobOpening.find()
      .populate("department", "name") 
      .populate("requestedBy", "name email");
    res.json(openings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getJobOpeningById = async (req, res) => {
  try {
    const jobOpening = await JobOpening.findById(req.params.id)
      .populate("department", "name")
      .populate("requestedBy", "name email");

    if (!jobOpening) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    res.json(jobOpening);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
exports.updateJobOpening = async (req, res) => {
  try {
    const jobOpening = await JobOpening.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!jobOpening) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    res.json({ message: "Job opening updated", jobOpening });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE
exports.deleteJobOpening = async (req, res) => {
  try {
    const jobOpening = await JobOpening.findByIdAndDelete(req.params.id);

    if (!jobOpening) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    res.json({ message: "Job opening deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// APPROVE / REJECT
exports.changeJobOpeningStatus = async (req, res) => {
  try {
    const { status } = req.body; // approved / rejected
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const jobOpening = await JobOpening.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!jobOpening) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    res.json({ message: `Job opening ${status}`, jobOpening });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



/// تاني خطوة نشر الوظيفة بعد موافقة المدير او الاتش ار


//  كل الوظائف المنشورة (Approved) JobOpening Public

exports.getPublishedJobs = async (req, res) => {
  try {
    const jobs = await JobOpening.find({ status: "approved" })
      .populate("department", "name")
      .select("title department experienceRequired skills employmentType salaryRange description");

    res.json({
      success: true,
      jobs
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// جلب وظيفة واحدة بالتفاصيل
exports.getPublishedJobById = async (req, res) => {
  try {
    const job = await JobOpening.findOne({ _id: req.params.id, status: "approved" })
      .populate("department", "name")
      .select("title department experienceRequired skills employmentType salaryRange description");

    if (!job) {
      return res.status(404).json({ success: false, message: "الوظيفة غير موجودة" });
    }

    res.json({
      success: true,
      job
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};