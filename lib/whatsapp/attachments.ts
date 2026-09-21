import fs from "fs";
import path from "path";

export function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".txt":
      return "text/plain";
    case ".py":
      return "text/x-python";
    case ".js":
      return "application/javascript";
    case ".html":
      return "text/html";
    case ".css":
      return "text/css";
    case ".sh":
      return "text/x-shellscript";
    case ".pdf":
      return "application/pdf";
    case ".csv":
      return "text/csv";
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".doc":
    case ".docx":
      return "application/msword";
    case ".xls":
    case ".xlsx":
      return "application/vnd.ms-excel";
    case ".zip":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}

export async function findAndSendFileAttachments(sock: any, targetJid: string, text: string) {
  if (!sock) return;

  const sentPaths = new Set<string>();
  const baseDir = process.cwd();
  const publicFilesDir = path.join(baseDir, "public", "files");

  // 1. Auto-send any recently created/modified file in public/files (created in last 2 minutes)
  if (fs.existsSync(publicFilesDir)) {
    try {
      const now = Date.now();
      const files = fs.readdirSync(publicFilesDir);
      for (const fileName of files) {
        const filePath = path.join(publicFilesDir, fileName);
        try {
          const stat = fs.statSync(filePath);
          if (stat.isFile() && now - stat.mtimeMs < 120000) {
            sentPaths.add(filePath);
            const mime = getMimeType(filePath);
            const fileBuffer = fs.readFileSync(filePath);
            console.log(
              `[WhatsApp File Attachment] Sending recently generated file ${fileName} (${fileBuffer.length} bytes) to ${targetJid}`
            );
            await sock.sendMessage(targetJid, {
              document: fileBuffer,
              mimetype: mime,
              fileName: fileName,
            });
          }
        } catch (e) {}
      }
    } catch (e) {}
  }

  // 2. Scan text for explicitly referenced file paths/names
  if (text) {
    const fileRegex =
      /\b[A-Za-z0-9_\-\.]+\.(?:txt|md|pdf|csv|png|jpg|jpeg|docx?|xlsx?)\b/gi;
    const matches = text.match(fileRegex);
    if (matches) {
      const searchDirs = [publicFilesDir];

      for (const match of matches) {
        const cleanMatch = match.replace(/[*_`]/g, "").trim();
        if (!cleanMatch) continue;

        let targetFilePath = "";

        const fileName = path.basename(cleanMatch);
        for (const dir of searchDirs) {
          const candidate = path.resolve(dir, fileName);
          if (candidate.startsWith(`${path.resolve(publicFilesDir)}${path.sep}`) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            targetFilePath = candidate;
            break;
          }
        }

        if (targetFilePath && !sentPaths.has(targetFilePath)) {
          sentPaths.add(targetFilePath);
          try {
            const fileName = path.basename(targetFilePath);
            const mime = getMimeType(targetFilePath);
            const fileBuffer = fs.readFileSync(targetFilePath);

            console.log(
              `[WhatsApp File Attachment] Sending ${fileName} (${fileBuffer.length} bytes) to ${targetJid}`
            );
            await sock.sendMessage(targetJid, {
              document: fileBuffer,
              mimetype: mime,
              fileName: fileName,
            });
          } catch (err) {
            console.error(`[WhatsApp File Attachment Error] Failed to send ${targetFilePath}:`, err);
          }
        }
      }
    }
  }
}
