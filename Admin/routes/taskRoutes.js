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
  tasksOverview,getTasksStats ,tasksOverviewForMyBranch
} = require('../controllers/tasksController');
const authenticate = require('../middlesware/authenticate');

// Routes
router.get('/', authenticate, getAlltasks);
//  الخاص بالفرع بتاعي بس
router.get('/getAllTasksForMyBranch' , authenticate ,getAllTasksForMyBranch )
router.get('/tasksOverview', authenticate, tasksOverview);
//  هنا الخاص بالفرع بتاعي بس 
router.get('/tasksOverviewForMyBranch', authenticate, tasksOverviewForMyBranch);
router.get('/taskbyemployee/:id', authenticate, taskByemployee);

// tasks state  النسب خلال المكتملة خلال الشهر واالسنة
router.get('/getTasksStats' ,authenticate ,getTasksStats)

router.get('/:id',authenticate ,getTaskById)

router.post('/', authenticate,upload.single('attachments'), createTasks);
router.patch('/:id', authenticate, upload.single('attachments'), updateTask);
router.delete('/:id', authenticate, deleteTask);

module.exports = router;
