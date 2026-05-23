// lib/fetchLatestDriveVideo.js
export async function fetchLatestDriveVide(folderId, apiKey) {
  const endpoint = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+mimeType='video/mp4'&orderBy=createdTime+desc&fields=files(id,name)&key=${apiKey}`;

  const res = await fetch(endpoint);
  const data = await res.json();

  if (!res.ok || !data.files || !data.files.length) return null;

  const latestFileId = data.files[0].id;
  return `https://www.googleapis.com/drive/v3/files/${latestFileId}?alt=media&key=${apiKey}`;
}
