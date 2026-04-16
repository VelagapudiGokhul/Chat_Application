const express = require('express');
const groupController = require('../controller/groupController');
const verifyToken = require('../middleware/authMiddleware');

const groupRoute = express.Router();

groupRoute.post('/create', verifyToken, groupController.createGroup);
groupRoute.get('/my-groups', verifyToken, groupController.getMyGroups);
groupRoute.get('/:id', verifyToken, groupController.getGroup);
groupRoute.post('/:id/add-member', verifyToken, groupController.addMember);
groupRoute.delete('/:id/remove-member/:userId', verifyToken, groupController.removeMember);
groupRoute.get('/:id/messages', verifyToken, groupController.getGroupMessages);
groupRoute.post('/:id/send', verifyToken, groupController.sendGroupMessage);

module.exports = groupRoute;
