const { getPrisma } = require('../config/prisma');
const initialCampaigns = require('../data/initialMediaCampaigns.json');

const DEFAULT_PLAN_ID = 'current_editorial_plan';

function requirePrisma() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error('Prisma database client is not available.');
  }
  return prisma;
}

async function getMediaCampaigns(req, res) {
  try {
    const prisma = requirePrisma();
    let record = await prisma.mediaCampaign.findUnique({
      where: { id: DEFAULT_PLAN_ID },
    });

    if (!record) {
      // Seed default plan if not present
      record = await prisma.mediaCampaign.create({
        data: {
          id: DEFAULT_PLAN_ID,
          data: initialCampaigns,
          updatedBy: 'Initial Master Template',
        },
      });
    }

    return res.json({
      success: true,
      campaigns: record.data,
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
    });
  } catch (err) {
    console.error('[getMediaCampaigns] Error:', err);
    // Fallback to static JSON if database error
    return res.json({
      success: true,
      campaigns: initialCampaigns,
      updatedAt: new Date().toISOString(),
      updatedBy: 'Fallback Template',
      warning: err.message,
    });
  }
}

async function saveMediaCampaigns(req, res) {
  try {
    const prisma = requirePrisma();
    const { campaigns, updatedBy: bodyUpdatedBy } = req.body || {};

    if (!campaigns || typeof campaigns !== 'object') {
      return res.status(400).json({ success: false, error: 'Campaigns object is required.' });
    }

    const updatedBy = req.user?.fullName || bodyUpdatedBy || 'Editorial Team';

    const record = await prisma.mediaCampaign.upsert({
      where: { id: DEFAULT_PLAN_ID },
      create: {
        id: DEFAULT_PLAN_ID,
        data: campaigns,
        updatedBy,
      },
      update: {
        data: campaigns,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
    });
  } catch (err) {
    console.error('[saveMediaCampaigns] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to save media campaigns: ' + err.message,
    });
  }
}

async function resetMediaCampaigns(req, res) {
  try {
    const prisma = requirePrisma();
    const updatedBy = req.user?.fullName ? `${req.user.fullName} (Reset)` : 'System Reset';

    const record = await prisma.mediaCampaign.upsert({
      where: { id: DEFAULT_PLAN_ID },
      create: {
        id: DEFAULT_PLAN_ID,
        data: initialCampaigns,
        updatedBy,
      },
      update: {
        data: initialCampaigns,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    return res.json({
      success: true,
      campaigns: record.data,
      updatedAt: record.updatedAt,
      updatedBy: record.updatedBy,
    });
  } catch (err) {
    console.error('[resetMediaCampaigns] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset media campaigns: ' + err.message,
    });
  }
}

module.exports = {
  getMediaCampaigns,
  saveMediaCampaigns,
  resetMediaCampaigns,
};
