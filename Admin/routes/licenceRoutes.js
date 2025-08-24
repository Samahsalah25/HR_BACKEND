const express = require('express');
const router = express.Router();
const {getRecords ,createRecord ,updateRecord,deleteRecord ,getRecordById} = require('../controllers/licencecontroller');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const { createRecordSchema, updateRecordSchema }=require('../validations/licenceValidation');



router.post('/' ,authenticate,authorizeRoles('ADMIN','HR'), validate(createRecordSchema), createRecord);
router.get('/' ,authenticate,authorizeRoles('ADMIN' ,'HR'), getRecords);
router.patch('/:id' ,authenticate,authorizeRoles('ADMIN','HR'), validate(updateRecordSchema), updateRecord);
router.delete('/:id' ,authenticate,authorizeRoles('ADMIN','HR'), deleteRecord);
router.get('/:id' ,authenticate,authorizeRoles('ADMIN' ,'HR'), getRecordById);
module.exports = router;
