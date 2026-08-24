const db = require('../src/config/database');
const commentRepository = require('../src/repositories/commentRepository');

jest.mock('../src/config/database', () => ({
  query: jest.fn(),
}));

jest.mock('../src/repositories/eqpTableResolver', () => ({
  resolveEqpTable: jest.fn().mockResolvedValue('eqp_report_comments'),
}));

describe('Comment Management Repository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('findAll constructs correct query with model and search filters', async () => {
    const mockRows = [
      { id: 1, machine_model: 'HM400', comment_text: 'Periodic check completed', frequency: 2, is_active: true },
    ];
    db.query.mockResolvedValueOnce({ rows: mockRows });

    const result = await commentRepository.findAll({
      machineModel: 'HM400',
      search: 'check',
      isActive: true,
    });

    expect(result).toEqual(mockRows);
    expect(db.query).toHaveBeenCalledTimes(1);
    const querySql = db.query.mock.calls[0][0];
    const queryParams = db.query.mock.calls[0][1];
    expect(querySql).toContain('machine_model = $1');
    expect(querySql).toContain('is_active = $2');
    expect(querySql).toContain('comment_text ILIKE $3');
    expect(queryParams).toEqual(['HM400', true, '%check%']);
  });

  it('findById fetches single comment by primary key', async () => {
    const mockComment = { id: 5, machine_model: 'PC400', comment_text: 'Test comment' };
    db.query.mockResolvedValueOnce({ rows: [mockComment] });

    const result = await commentRepository.findById(5);
    expect(result).toEqual(mockComment);
    expect(db.query.mock.calls[0][1]).toEqual([5]);
  });

  it('create inserts new comment record', async () => {
    const newRecord = {
      id: 10,
      machine_model: 'HM400',
      document_type: 'in_operation',
      service_stage: 'scheduled_service',
      comment_text: 'Brand new test comment',
      frequency: 3,
      is_active: true,
    };
    db.query.mockResolvedValueOnce({ rows: [newRecord] });

    const result = await commentRepository.create({
      machineModel: 'HM400',
      documentType: 'in_operation',
      serviceStage: 'scheduled_service',
      commentText: 'Brand new test comment',
      frequency: 3,
      isActive: true,
    });

    expect(result).toEqual(newRecord);
    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query.mock.calls[0][0]).toContain('INSERT INTO');
  });

  it('update modifies comment fields and returns updated record', async () => {
    const existing = {
      id: 10,
      machine_model: 'HM400',
      document_type: 'in_operation',
      service_stage: 'scheduled_service',
      comment_text: 'Original',
      frequency: 1,
      is_active: true,
    };
    const updated = {
      ...existing,
      comment_text: 'Updated Text',
      frequency: 5,
      is_active: false,
    };

    // First findById call
    db.query.mockResolvedValueOnce({ rows: [existing] });
    // Second update query call
    db.query.mockResolvedValueOnce({ rows: [updated] });

    const result = await commentRepository.update(10, {
      commentText: 'Updated Text',
      frequency: 5,
      isActive: false,
    });

    expect(result).toEqual(updated);
    expect(db.query).toHaveBeenCalledTimes(2);
    expect(db.query.mock.calls[1][0]).toContain('UPDATE');
  });

  it('remove deletes comment by id', async () => {
    const deleted = { id: 10, comment_text: 'Deleted' };
    db.query.mockResolvedValueOnce({ rows: [deleted] });

    const result = await commentRepository.remove(10);
    expect(result).toEqual(deleted);
    expect(db.query.mock.calls[0][0]).toContain('DELETE FROM');
    expect(db.query.mock.calls[0][1]).toEqual([10]);
  });
});
