import JSZip from 'jszip';

/**
 * Triggers a direct browser file download from a Blob or URL
 */
export function triggerBlobDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Download a single asset file directly with original name
 */
export async function downloadSingleAsset(asset) {
  if (!asset || !asset.url) return;

  try {
    // If relative API URL, download with download=1 query to force Content-Disposition: attachment
    const downloadUrl = asset.url.startsWith('/')
      ? `${asset.url}${asset.url.includes('?') ? '&' : '?'}download=1`
      : asset.url;

    const res = await fetch(downloadUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    triggerBlobDownload(blob, asset.name || 'downloaded_asset');
  } catch (err) {
    console.warn('[downloadSingleAsset] Direct fetch failed, falling back to anchor trigger:', err);
    const a = document.createElement('a');
    a.href = asset.url;
    a.download = asset.name || 'asset';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Generate post caption & metadata text file content
 */
function generatePostNotesText(post) {
  return [
    `=============================================================`,
    `DAR AL-HAY SOCIAL MEDIA DELIVERABLE INFO`,
    `=============================================================`,
    `Title:          ${post.title || 'Untitled Post'}`,
    `Concept #:      ${post.conceptNumber || 'N/A'}`,
    `Scheduled Date: ${post.publishDate || 'N/A'} (${post.day || ''})`,
    `Format:         ${(post.format || 'reel').toUpperCase()}`,
    `Status:         ${(post.status || 'idea').toUpperCase()}`,
    `Tone of Voice:  ${post.tov || 'Authoritative Industrial & Fleet Economics'}`,
    `Platforms:      ${(post.platforms || []).join(', ')}`,
    ``,
    `-------------------------------------------------------------`,
    `DESCRIPTION & PRODUCTION NOTES:`,
    `-------------------------------------------------------------`,
    post.summary || post.description || 'No description provided.',
    ``,
    `-------------------------------------------------------------`,
    `ENGLISH CAPTION (🇬🇧):`,
    `-------------------------------------------------------------`,
    post.captionEn || '(No English caption drafted yet)',
    ``,
    `-------------------------------------------------------------`,
    `ARABIC CAPTION (🇰🇼):`,
    `-------------------------------------------------------------`,
    post.captionAr || '(لم تتم كتابة النص العربي بعد)',
    ``,
    `=============================================================`,
    `Exported from Dar Al-Hay Media Corner on ${new Date().toLocaleString()}`,
    `=============================================================`,
  ].join('\r\n');
}

/**
 * Fetch an asset as binary ArrayBuffer for JSZip
 */
async function fetchAssetBuffer(url) {
  const downloadUrl = url.startsWith('/')
    ? `${url}${url.includes('?') ? '&' : '?'}download=1`
    : url;
  const res = await fetch(downloadUrl);
  if (!res.ok) throw new Error(`Failed to fetch ${url} (HTTP ${res.status})`);
  return await res.arrayBuffer();
}

/**
 * Downloads all assets for a single post packaged as a ZIP
 */
export async function downloadPostAssetsZip(post, onProgress) {
  const attachments = post.attachments || [];
  if (attachments.length === 0) {
    alert('No asset files attached to this post to download.');
    return;
  }

  const zip = new JSZip();
  const safeTitle = (post.title || 'Post')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40);
  const dateStr = post.publishDate || new Date().toISOString().slice(0, 10);
  const zipName = `${dateStr}_${safeTitle}_Assets.zip`;

  // Add notes file
  zip.file('post_details_and_captions.txt', generatePostNotesText(post));

  // Download and add each attachment
  const total = attachments.length;
  for (let i = 0; i < total; i++) {
    const asset = attachments[i];
    if (onProgress) {
      onProgress({ current: i + 1, total, fileName: asset.name, stage: 'downloading' });
    }
    try {
      const buffer = await fetchAssetBuffer(asset.url);
      zip.file(asset.name || `file_${i + 1}`, buffer);
    } catch (err) {
      console.error(`[ZIP] Failed to fetch ${asset.name}:`, err);
      zip.file(`${asset.name || `file_${i + 1}`}_DOWNLOAD_FAILED.txt`, `Error downloading file from ${asset.url}: ${err.message}`);
    }
  }

  if (onProgress) {
    onProgress({ current: total, total, stage: 'zipping' });
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  triggerBlobDownload(blob, zipName);
}

/**
 * Downloads all assets for all posts in a month organized by day subfolders
 */
export async function downloadMonthAssetsZip(monthName, concepts = [], onProgress) {
  // Filter concepts that have attachments
  const conceptsWithFiles = concepts.filter((c) => c.attachments && c.attachments.length > 0);

  if (conceptsWithFiles.length === 0) {
    alert(`No asset files have been uploaded yet for ${monthName || 'this month'}.`);
    return false;
  }

  const zip = new JSZip();
  const safeMonthName = (monthName || 'Month')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_');
  const zipFileName = `DarAlHay_${safeMonthName}_Media_Assets.zip`;

  // Count total files to download
  let totalFiles = 0;
  conceptsWithFiles.forEach((c) => {
    totalFiles += c.attachments.length;
  });

  let downloadedFiles = 0;

  for (const concept of conceptsWithFiles) {
    const dateStr = concept.publishDate || 'no_date';
    const postNum = concept.conceptNumber ? `Day${concept.conceptNumber}` : 'Post';
    const safeTitle = (concept.title || 'Untitled')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 30);
    const folderName = `${dateStr}_${postNum}_${safeTitle}`;
    const folder = zip.folder(folderName);

    // Add post details in each folder
    folder.file('post_details_and_captions.txt', generatePostNotesText(concept));

    // Add attachments
    for (const asset of concept.attachments) {
      downloadedFiles++;
      if (onProgress) {
        onProgress({
          current: downloadedFiles,
          total: totalFiles,
          fileName: asset.name,
          postTitle: concept.title,
          stage: 'downloading',
        });
      }
      try {
        const buffer = await fetchAssetBuffer(asset.url);
        folder.file(asset.name || `asset_${downloadedFiles}`, buffer);
      } catch (err) {
        console.error(`[ZIP Month] Failed to fetch ${asset.name}:`, err);
        folder.file(`${asset.name}_DOWNLOAD_FAILED.txt`, `Error downloading: ${err.message}`);
      }
    }
  }

  if (onProgress) {
    onProgress({ current: totalFiles, total: totalFiles, stage: 'zipping' });
  }

  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  triggerBlobDownload(blob, zipFileName);
  return true;
}
