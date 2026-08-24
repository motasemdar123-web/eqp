const commentRepository = require('../repositories/commentRepository');
const ApiError = require('../utils/ApiError');

async function listComments(req, res) {
  const { machine_model, document_type, service_stage, is_active, search } = req.query;

  const comments = await commentRepository.findAll({
    machineModel: machine_model,
    documentType: document_type,
    serviceStage: service_stage,
    isActive: is_active,
    search,
  });

  res.json({
    comments,
    total: comments.length,
  });
}

async function getCommentById(req, res) {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    throw new ApiError(400, 'Valid comment ID is required.');
  }

  const comment = await commentRepository.findById(id);
  if (!comment) {
    throw new ApiError(404, 'Comment not found.');
  }

  res.json({ comment });
}

async function createComment(req, res) {
  const {
    machine_model = 'HM400',
    document_type = 'in_operation',
    service_stage = 'scheduled_service',
    comment_text,
    frequency = 1,
    is_active = true,
  } = req.body;

  if (!comment_text || !String(comment_text).trim()) {
    throw new ApiError(400, 'Comment text is required.');
  }

  const created = await commentRepository.create({
    machineModel: String(machine_model).trim().toUpperCase(),
    documentType: String(document_type).trim().toLowerCase(),
    serviceStage: String(service_stage).trim().toLowerCase(),
    commentText: String(comment_text).trim(),
    frequency: Math.max(1, Number(frequency) || 1),
    isActive: is_active !== false,
    createdById: req.user?.id || null,
  });

  res.status(201).json({
    message: 'Comment created successfully.',
    comment: created,
  });
}

async function updateComment(req, res) {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    throw new ApiError(400, 'Valid comment ID is required.');
  }

  const {
    machine_model,
    document_type,
    service_stage,
    comment_text,
    frequency,
    is_active,
  } = req.body;

  const existing = await commentRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Comment not found.');
  }

  const updated = await commentRepository.update(id, {
    machineModel: machine_model !== undefined ? String(machine_model).trim().toUpperCase() : undefined,
    documentType: document_type !== undefined ? String(document_type).trim().toLowerCase() : undefined,
    serviceStage: service_stage !== undefined ? String(service_stage).trim().toLowerCase() : undefined,
    commentText: comment_text !== undefined ? String(comment_text).trim() : undefined,
    frequency: frequency !== undefined ? Math.max(1, Number(frequency) || 1) : undefined,
    isActive: is_active !== undefined ? Boolean(is_active) : undefined,
    updatedById: req.user?.id || null,
  });

  res.json({
    message: 'Comment updated successfully.',
    comment: updated,
  });
}

async function deleteComment(req, res) {
  const id = Number(req.params.id);
  if (!id || isNaN(id)) {
    throw new ApiError(400, 'Valid comment ID is required.');
  }

  const existing = await commentRepository.findById(id);
  if (!existing) {
    throw new ApiError(404, 'Comment not found.');
  }

  await commentRepository.remove(id);

  res.json({
    message: 'Comment deleted successfully.',
    id,
  });
}

module.exports = {
  listComments,
  getCommentById,
  createComment,
  updateComment,
  deleteComment,
};
