const express = require("express");
const { client } = require("../db");
const { ObjectId } = require("mongodb");
const router = express.Router();
const { v4: uuidv4 } = require('uuid');


const taskCollection = client.db("MyTask").collection("tasks");


// get all tasks
router.get('/', async (req, res) =>{
    try{

        const tasks = await taskCollection.find().toArray();
        res.send(tasks);

    } catch (error) {
        console.error("Error getting task data:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

// get task by userEmail
router.get('/email/:email', async (req, res) =>{
    
    try{
        const taskData = await taskCollection.find({
            userEmail : req.params.email
        }).toArray();
        res.json(taskData);
        
    } catch (error) {
        console.error("Error getting single task data:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

// get task by user with paigination 
router.get('/email/:email/page/:page', async (req, res) =>{
    const { email, page } = req.params;
    const limit = 3;
    const skip = (page - 1) * limit;
    
    const total = await taskCollection.find({ userEmail: email }).count();
    const totalPages = Math.ceil(total / limit);
    try{
        const taskData = await taskCollection.find({
            userEmail : email
        }).skip(skip).limit(limit).toArray();
        res.json({
            taskData,
            page,
            limit,
            totalPages
        });
        
    } catch (error) {
        console.error("Error getting single task data:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

// get task by id
router.get('/:id', async (req, res) =>{
    
    try{
        const taskData = await taskCollection.find({
            _id : new ObjectId(req.params.id)
        }).toArray();
        res.json(taskData);
        
    } catch (error) {
        console.error("Error getting single task data:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})


// personalized data -> by email

// get tasks by tags
// ex: http://localhost:3000/api/tasks/email/john@example.com?tags=backend,web
router.get('/email/:email/tags', async (req, res) => {
    const { email } = req.params;
    const { tags } = req.query;

    try {
        const tagsArray = tags.split(',');
        const result = await taskCollection.find({
            userEmail: email,
            tags: { $in: tagsArray }
        }).toArray();

        res.json({ result, messge: "dfsfd" });
    } catch (error) {
        console.error("Error getting tasks by tags", error);
        res.status(500).json({ message: "Error found on server" });
    }
});


// show tasks of today
function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}


router.get('/:email/taskoftoday', async(req, res) =>{
    const {email} = req.params;
    try{
        const result = await taskCollection.find({
            userEmail : email,
            dueDate : formatDate(new Date)
        }).toArray()
        // console.log(result, formatDate(new Date));

        res.send(result);
    } catch(error){
        console.error("Error getting today's task:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

// {
//     "_id": "6609433230c4bcc304000df9",
//     "title": "Prepare for Job",
//     "description": "Become a joss web developer",
//     "userEmail": "john2@example.com",
//     "dueDate": "2025-04-15",
//     "priority": "High",
//     "status": "Completed",
//     "tags": [
//       "backend",
//       "development",
//       "web"
//     ],
//     "subtasks": {
//       "taskDone": 2,
//       "taskLeft": 0,
//       "totalTask": 2,
//       "tasks": [
//         {
//           "name": "Learn a programming language perfectly",
//           "_id": "9ea2362d-2729-4ceb-a967-710fb6268b65",
//           "status": "Completed",
//           "doneTime": "3/31/2024, 5:11:20 PM"
//         },
//         {
//           "name": "Pick a framework",
//           "_id": "ee0b53b7-57a9-48df-9079-81ca3800969f",
//           "status": "Completed",
//           "doneTime": "3/31/2024, 5:12:30 PM"
//         }
//       ]
//     }
//   },
//   {
//     "_id": "66094e6f488b6df75b6c871e",
//     "title": "New Task",
//     "description": "This is new task description",
//     "userEmail": "john@example.com",
//     "dueDate": "2024-05-12",
//     "priority": "High",
//     "status": "In Progress",
//     "tags": [
//       "new",
//       "task"
//     ],
//     "subtasks": {
//       "taskDone": 0,
//       "taskLeft": 0,
//       "totalTask": 0,
//       "tasks": [
        
//       ]
//     }
//   },
router.get('/alltags', async(req, res) =>{
    try{
        const result = await taskCollection.distinct("tags");
        res.json(result);
    } catch(error){
        console.error("Error getting all tags:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})


// task summary
router.get('/:email/summary', async(req, res) =>{
    
    try{
        const {email} = req.params;
        const taskData = await taskCollection.find({
            userEmail : email
        }).toArray();

        let totalTasks = 0, completedTasks = 0, pendingTasks = 0, inProgressTasks = 0;
        taskData.forEach(task => {
            if(task.status == 'completed' || (task.subtasks.taskDone === task.subtasks.totalTask && task.subtasks.totalTask != 0)){
                completedTasks++;
            }
            else if(task.subtasks.taskDone === 0){
                pendingTasks++;
            }
            else{
                inProgressTasks++;
            }
            totalTasks++;
        })

        res.json({
            totalTasks,
            completedTasks,
            pendingTasks,
            inProgressTasks
        })

    } catch (error) {
        console.error("Error getting task summary:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})


// add new data
router.post('/', async (req,res) =>{
    
    try{
        const taskData = req.body;
        const sameNameExists = await taskCollection.findOne({
            userEmail: taskData.userEmail, 
            title : taskData.title
        })
        // console.log(taskData, sameNameExists);
    
        if(sameNameExists){
            res.status(500).json({
                acknowledged: false,
                message : `You already have a task titled as ${taskData.title}. Please try another name.`
            })
        }
        else{
            const result = await taskCollection.insertOne(taskData);
            console.log(result);
            res.json({
                result,
                message : "task added successfully"
            })
        }
        
    } catch (error) {
        console.error("Error on adding tasks:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

// delete a task
router.delete('/:id', async(req, res) =>{
    try{
        const result = await taskCollection.deleteOne({ _id : new ObjectId(req.params.id) });
        res.send(result); 
        
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

// update task status
router.patch('/:id/status', async(req,res) =>{
    try{
        const {id} = req.params;
        const {status} = req.body;

        const result = await taskCollection.updateOne(
            { _id : new ObjectId(id)},
            { $set : {status} }
        )

        if(result.modifiedCount == 0){
            return res.status(500).json({
                message: "Task not found"
            })
        }

        res.json({
            message : "Task status successfully updated"
        })

    } catch(error){
        console.error("Error updating status", error);
        res.status(500).json({ error: "There was a server error"});
    }
})

// add subtask
router.post('/:taskId/addSubtasks', async(req, res) =>{
    try{
        const taskId = req.params.taskId;
        const newSubTaskData = req.body;
        const subtaskId = uuidv4();
        newSubTaskData._id = subtaskId;
        newSubTaskData.status = "Pending";
        newSubTaskData.doneTime = null;

        // add new subtasks
        const result = await taskCollection.updateOne(
            { _id : new ObjectId(taskId)},
            { 
                $push: {"subtasks.tasks": newSubTaskData}, 
                $inc: { "subtasks.totalTask": 1, "subtasks.taskLeft": 1 } 
            }
        )

        if( result.modifiedCount == 0){
            return res.status(500).json({
                message : "Task not found"
            })
        }
        
        res.json({
            message: "Subtask added successfully"
        })

    } catch (error) {
        console.error("Error :", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

// subtask completed
router.put('/:taskId/subtasks/:subtaskId/done', async(req, res) =>{
    try{
        const { taskId, subtaskId } = req.params;
        const {status} = req.body;
        console.log(taskId, subtaskId, status);

        let x = 0, y = 0;
        if(status == true){
            x = 1;
            y = -1;
        }
        else{
            x = -1;
            y = 1;
        }
        // Update subtask status to "Completed" and set doneTime to current time
        const result = await taskCollection.updateOne(
            { _id: new ObjectId(taskId), "subtasks.tasks.id": subtaskId},
            {
                $set: {
                    "subtasks.tasks.$.status": status,
                    "subtasks.tasks.$.doneTime": (new Date()).toLocaleString(),
                },
                $inc: {
                    "subtasks.taskDone" : x,
                    "subtasks.taskLeft" : y
                }
            }
        )
        
        if( result.modifiedCount == 0){
            return res.status(500).json({
                message : "Task or subtask not found"
            })
        }
        

        // check if all subtasks are done --> if done, then make the task as completed
        const tasks = await taskCollection.findOne({ _id : new ObjectId(taskId)})
        if(tasks.subtasks.taskDone === tasks.subtasks.totalTask){
            await taskCollection.updateOne(
                { _id : new ObjectId(taskId)},
                { $set: { status : "Completed" } }
            )
        }

        res.json({
            message: "Subtask Completed"
        })

    } catch (error) {
        console.error("Error :", error);
        res.status(500).json({ error: "There was a server error" });
    }
})

module.exports = router;