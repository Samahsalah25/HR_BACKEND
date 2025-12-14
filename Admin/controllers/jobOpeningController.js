// controllers/jobOpeningController.js

const JobOpening =require("../models/JobOpening")
const Applicant = require("../models/Applicant");

// إنشاء طلب وظيفة جديدة
exports.createJobOpening = async (req, res) => {
  try {
    const {
      title,
      department,
      branch,
      employmentType,
      salaryRange,
      description,
      skills,
      requirements // object يحتوي على: experienceYears, gender, qualification, languages, other
    } = req.body;

    const jobOpening = await JobOpening.create({
      title,
      department,
      branch,
      employmentType,
      salaryRange,
      description,
      skills,
      requirements,
      requestedBy: req.user._id,
    });

    res.status(201).json({
      message: "Job opening request created successfully",
      jobOpening ,
      success:true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
};




exports.getAllJobOpenings = async (req, res) => {
  try {
    const openings = await JobOpening.find()
    .sort({ createdAt: -1 })
      .populate("department", "name") 
      .populate("branch", "name")
      .populate("requestedBy", "name email");

    // loop لكل وظيفة وحساب الإحصائيات
    const result = await Promise.all(openings.map(async (job) => {
      const applicants = await Applicant.find({ jobOpening: job._id });

      const applicantsInfo = {
        totalApplicants: applicants.length,
        viewed: applicants.filter(a => a.viewedByHR && a.viewedByHR.length > 0).length,
        suitable: applicants.filter(a => a.status === 'screened').length,
        rejected: applicants.filter(a => a.status === 'rejected').length,
        accepted: applicants.filter(a => a.status === 'hired').length,
      };

      return {
        ...job.toObject(),
        applicantsInfo
      };
    }));

    res.json(result);
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



// 
     // GET /api/job-openings/grouped-by-department
exports.getOpeningsGroupedByDepartment = async (req, res) => {
  try {
    const jobs = await JobOpening.find({ status: 'approved' })
      .populate('department', 'name');

    const result = await Promise.all(
      jobs.map(async (job) => {
        const count = await Applicant.countDocuments({
          jobOpening: job._id
        });

        return {
          _id: job._id,
          title: job.title,
          department: job.department,
          applicantsCount: count
        };
      })
    );

    // group by department
    const grouped = {};
    result.forEach(job => {
      const depId = job.department._id.toString();
      if (!grouped[depId]) {
        grouped[depId] = {
          department: job.department,
          jobs: []
        };
      }
      grouped[depId].jobs.push({
        _id: job._id,
        title: job.title,
        applicantsCount: job.applicantsCount
      });
    });

    res.json(Object.values(grouped));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};