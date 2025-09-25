const express = require('express');
const router = express.Router();
const {
  upload,
  getAlltasks,
  getAllTasksForMyBranch ,
  createTasks,
  taskByemployee,
  updateTask,
  deleteTask,getTaskById,
  tasksOverview,getTasksStats ,tasksOverviewForMyBranch ,
   getTasksForMeOrCreated
} = require('../controllers/tasksController');
const authenticate = require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const  {
  createTaskSchema,
  updateTaskSchema
}=require('../validations/taskvalidation');

// Routes
router.get('/', authenticate,authorizeRoles('HR'), getAlltasks);
// التاسكات اللي كريتيها والخاصه به
router.get('/my-tasks', authenticate, getTasksForMeOrCreated);
//  الخاص بالفرع بتاعي بس
router.get('/getAllTasksForMyBranch' , authenticate ,authorizeRoles('HR') ,getAllTasksForMyBranch )

router.get('/tasksOverview', authenticate,authorizeRoles('HR'), tasksOverview);
//  هنا الخاص بالفرع بتاعي بس 
router.get('/tasksOverviewForMyBranch', authenticate,authorizeRoles('HR'), tasksOverviewForMyBranch);

router.get('/taskbyemployee/:id',taskByemployee);



// tasks state  النسب خلال المكتملة خلال الشهر واالسنة
router.get('/getTasksStats' ,authenticate, authorizeRoles('HR') ,getTasksStats)

router.get('/:id',getTaskById)

router.post('/', authenticate,upload.single('attachments'),authorizeRoles('HR','Manager' ,'EMPLOYEE'),validate(createTaskSchema), createTasks);

router.patch('/:id',authenticate,  upload.single('attachments'),validate(updateTaskSchema), updateTask);

router.delete('/:id', authenticate,  authorizeRoles('HR','Manager' ,'EMPLOYEE') ,deleteTask);


module.exports = router;
