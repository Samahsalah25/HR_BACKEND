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
  addNote ,
  updateRequest ,
  deleteRequest 
} = require('../controllers/requestController');

const authenticate  = require('../middlesware/authenticate'); 
 
const authorizeRoles=require('../middlesware/roleMiddleware');
const {createRequestSchema ,updateRequestSchema ,addNoteSchema}=require('../validations/requestvalidation');
const validate=require('../middlesware/validate');

// الموظف ينشئ طلب
router.post('/', authenticate,authorizeRoles('HR','EMPLOYEE'),validate(createRequestSchema), createRequest);

// عرض الطلبات (الموظف : طلباته، HR/Admin : الكل + فلترة)
router.get('/',getRequests);

// هنا كل الطلبات بالفلتر الكل او المرفةض اة اة بس التابع للفرع بتاعي فقك  فلتر هنا حسب نوع الطلب ايه
router.get('/bybranch',authenticate ,authorizeRoles('HR') ,getBranchRequests)

// هنا هنعرض الطلبات ب انوعها حسب الحالة بقي او كله
router.get('/requestsType',authenticate ,authorizeRoles('HR') ,getRequestsByType)

//  هنعرض حسب الحالة بس لفرع اللي انا فيه
router.get('/requestsTypeoneBranch',authenticate ,authorizeRoles('HR') ,getRequestsByWorkplace)

//  هنا هنعرض كل طلبات لموظف معين بال Id
router.get('/getrequests/:id' ,authenticate ,authorizeRoles('HR' ,'EMPLOYEE'),getRequestsByEmployee )
// معين تفاصيل طلب
router.get('/:id' ,getRequestById);

// HR/Admin: اعتماد / رفض / تحويل / إضافة ملاحظة
router.patch('/:id/approve', authenticate,authorizeRoles('HR')  ,approveRequest);
router.patch('/:id/reject' , authenticate,authorizeRoles('HR'), rejectRequest);
router.patch('/:id/forward', authenticate,authorizeRoles('HR'), forwardRequest);
router.post('/:id/notes', authenticate,authorizeRoles('HR') ,validate(addNoteSchema),addNote);

router.patch('/:id' ,authenticate ,updateRequest)
router.delete('/:id' ,authenticate,deleteRequest )
module.exports = router;
