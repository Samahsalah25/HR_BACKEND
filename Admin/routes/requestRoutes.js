const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getBranchRequests,
  getRequestById,
  approveRequest,
  approveCustodyRequest,
  confirmDelivery,
  confirmReturn,
  getMyDeliveryTasks,
  getMyReturnTasks,
  getMyApprovedCustodyRequests,
  createAndApproveCustodyByHR,
  rejectRequest,
  forwardRequest,
  forwardCustodyRequest,
  getRequestsByType,
  getRequestsByEmployee,
  getRequestsByWorkplace,
  addNote,
  updateRequest,
  deleteRequest
} = require('../controllers/requestController');

const authenticate = require('../middlesware/authenticate');

const authorizeRoles = require('../middlesware/roleMiddleware');
const { createRequestSchema, updateRequestSchema, addNoteSchema } = require('../validations/requestvalidation');
const validate = require('../middlesware/validate');


router.get("/getMyDeliveryTasks", authenticate, authorizeRoles('HR', 'EMPLOYEE', 'Manager'), getMyDeliveryTasks)
router.get("/getMyReturnTasks", authenticate, authorizeRoles('HR', 'EMPLOYEE', 'Manager'), getMyReturnTasks)
router.get("/getMyApprovedCustodyRequests", authenticate, authorizeRoles('HR', 'EMPLOYEE', 'Manager'), getMyApprovedCustodyRequests)


// الموظف ينشئ طلب
router.post('/', authenticate, authorizeRoles('HR', 'EMPLOYEE', 'Manager'), validate(createRequestSchema), createRequest);

// عرض الطلبات (الموظف : طلباته، HR/Admin : الكل + فلترة)
router.get('/', getRequests);

// هنا كل الطلبات بالفلتر الكل او المرفةض اة اة بس التابع للفرع بتاعي فقك  فلتر هنا حسب نوع الطلب ايه
router.get('/bybranch', authenticate, authorizeRoles('HR'), getBranchRequests)

// هنا هنعرض الطلبات ب انوعها حسب الحالة بقي او كله
router.get('/requestsType', authenticate, authorizeRoles('HR'), getRequestsByType)

//  هنعرض حسب الحالة بس لفرع اللي انا فيه
router.get('/requestsTypeoneBranch', authenticate, authorizeRoles('HR'), getRequestsByWorkplace)

//  هنا هنعرض كل طلبات لموظف معين بال Id
router.get('/getrequests/:id', authenticate, authorizeRoles('HR', 'EMPLOYEE'), getRequestsByEmployee)
// معين تفاصيل طلب
router.get('/:id', getRequestById);

// HR/Admin: اعتماد / رفض / تحويل / إضافة ملاحظة

router.patch('/:id/approve', authenticate, authorizeRoles('HR'), approveRequest);
router.patch("/approveCustodyRequest/:id", authenticate, authorizeRoles('HR'), approveCustodyRequest)
router.patch("/confirmDelivery/:id", authenticate, confirmDelivery)
router.patch("/confirmReturn/:id", authenticate, confirmReturn)
router.post("/createAndApproveCustodyByHR", authenticate, authorizeRoles('HR'), createAndApproveCustodyByHR)
router.patch('/:id/reject', authenticate, authorizeRoles('HR'), rejectRequest);
router.patch('/:id/forward', authenticate, authorizeRoles('HR'), forwardRequest);
router.patch('/:id/forwardCustodyRequest', authenticate, authorizeRoles('HR'), forwardCustodyRequest);
router.post('/:id/notes', authenticate, authorizeRoles('HR'), validate(addNoteSchema), addNote);

router.patch('/:id', authenticate, updateRequest)
router.delete('/:id', authenticate, deleteRequest)
module.exports = router;