const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests, 
  getBranchRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  forwardRequest,
getRequestsByType ,
 getRequestsByEmployee ,
 getRequestsByWorkplace ,
  addNote
} = require('../controllers/requestController');

const authenticate  = require('../middlesware/authenticate'); 
 
const authorizeRoles=require('../middlesware/roleMiddleware');
const {createRequestSchema ,updateRequestSchema ,addNoteSchema}=require('../validations/requestvalidation');
const validate=require('../middlesware/validate');

// الموظف ينشئ طلب
router.post('/', authenticate,authorizeRoles('HR','EMPLOYEE'),validate(createRequestSchema), createRequest);

// عرض الطلبات (الموظف : طلباته، HR/Admin : الكل + فلترة)
router.get('/', authenticate,authorizeRoles("HR"),getRequests);

// هنا كل الطلبات بالفلتر الكل او المرفةض اة اة بس التابع للفرع بتاعي فقك  فلتر هنا حسب نوع الطلب ايه
router.get('/bybranch',authenticate ,authorizeRoles('HR') ,getBranchRequests)

// هنا هنعرض الطلبات ب انوعها حسب الحالة بقي او كله
router.get('/requestsType',authenticate ,authorizeRoles('HR') ,getRequestsByType)

//  هنعرض حسب الحالة بس لفرع اللي انا فيه
router.get('/requestsTypeoneBranch',authenticate ,authorizeRoles('HR') ,getRequestsByWorkplace)

//  هنا هنعرض كل طلبات لموظف معين بال Id
router.get('/getrequests/:id' ,authenticate ,authorizeRoles('HR'),getRequestsByEmployee )
// معين تفاصيل طلب
router.get('/:id', authenticate,authorizeRoles('HR')  ,getRequestById);

// HR/Admin: اعتماد / رفض / تحويل / إضافة ملاحظة
router.patch('/:id/approve', authenticate,authorizeRoles('HR') ,validate(updateRequestSchema) ,approveRequest);
router.patch('/:id/reject', authenticate,authorizeRoles('HR'),validate(updateRequestSchema), rejectRequest);
router.patch('/:id/forward', authenticate,authorizeRoles('HR'),validate(updateRequestSchema), forwardRequest);
router.post('/:id/notes', authenticate,authorizeRoles('HR') ,validate(addNoteSchema),addNote);

module.exports = router;
