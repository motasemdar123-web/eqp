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

async function uploadMediaAsset(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: 'No file provided.' });
    }

    const mediaAssetService = require('../services/mediaAssetService');
    const { conceptId, publishDate, uploadedBy: bodyUploadedBy } = req.body || {};
    const uploader = req.user?.fullName || bodyUploadedBy || 'Designer';

    const asset = await mediaAssetService.saveMediaAsset({
      fileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      buffer: file.buffer,
      conceptId,
      publishDate,
      uploadedBy: uploader,
    });

    return res.json({
      success: true,
      asset,
    });
  } catch (err) {
    console.error('[uploadMediaAsset] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload media asset: ' + err.message,
    });
  }
}

async function getMediaAssetFile(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).send('Asset ID is required.');
    }

    const mediaAssetService = require('../services/mediaAssetService');
    const asset = await mediaAssetService.getMediaAssetById(id);

    if (!asset || !asset.file_data) {
      return res.status(404).send('Media asset not found.');
    }

    const isDownload = req.query.download === '1' || req.query.download === 'true';
    const disposition = isDownload ? 'attachment' : 'inline';
    const encodedFileName = encodeURIComponent(asset.file_name);

    res.setHeader('Content-Type', asset.mime_type || 'application/octet-stream');
    res.setHeader('Content-Length', asset.file_size || asset.file_data.length);
    res.setHeader('Content-Disposition', `${disposition}; filename="${asset.file_name}"; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    return res.send(asset.file_data);
  } catch (err) {
    console.error('[getMediaAssetFile] Error:', err);
    return res.status(500).send('Error serving media file: ' + err.message);
  }
}

async function deleteMediaAsset(req, res) {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, error: 'Asset ID is required.' });
    }

    const mediaAssetService = require('../services/mediaAssetService');
    await mediaAssetService.deleteMediaAssetById(id);

    return res.json({ success: true, id });
  } catch (err) {
    console.error('[deleteMediaAsset] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete asset: ' + err.message,
    });
  }
}

module.exports = {
  getMediaCampaigns,
  saveMediaCampaigns,
  resetMediaCampaigns,
  uploadMediaAsset,
  getMediaAssetFile,
  deleteMediaAsset,
};
