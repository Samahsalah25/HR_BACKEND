const express = require('express');
const router = express.Router();
const {
  createRequest,
  getRequests,
  getRequestById,
  approveRequest,
  rejectRequest,
  forwardRequest,
 getRequestsByType,
 getRequestsByEmployee ,
  addNote
} = require('../controllers/requestController');

const authenticate  = require('../middlesware/authenticate'); 

// الموظف ينشئ طلب
router.post('/', authenticate, createRequest);

// عرض الطلبات (الموظف : طلباته، HR/Admin : الكل + فلترة)
router.get('/', authenticate, getRequests);

// هنا هنعرض الطلبات ب انوعها
router.get('/requestsType',authenticate ,getRequestsByType)

//  هنا هنعرض كل طلبات لموظف معين بال Id
router.get('/getrequests/:id' ,authenticate,getRequestsByEmployee )
// معين تفاصيل طلب
router.get('/:id', authenticate, getRequestById);

// HR/Admin: اعتماد / رفض / تحويل / إضافة ملاحظة
router.patch('/:id/approve', authenticate, approveRequest);
router.patch('/:id/reject', authenticate, rejectRequest);
router.patch('/:id/forward', authenticate, forwardRequest);
router.post('/:id/notes', authenticate, addNote);

module.exports = router;
