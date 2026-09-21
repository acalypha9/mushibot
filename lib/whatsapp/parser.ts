import { proto } from "@whiskeysockets/baileys";
import type { ValidateCommandPrefixResult } from "./types";

export function validateCommandPrefix(
  textContent: string,
  configuredPrefix?: string | null
): ValidateCommandPrefixResult {
  const rawPrefix =
    configuredPrefix !== undefined && configuredPrefix !== null ? configuredPrefix : ".ai";
  const prefix = (rawPrefix || "").trim();

  // If prefix is explicitly empty, all messages are allowed without prefix
  if (!prefix) {
    return { allowed: true, cleanedMessage: textContent.trim() };
  }

  const lowerText = textContent.toLowerCase();
  const lowerPrefix = prefix.toLowerCase();

  // 1. Message MUST start with the prefix (case-insensitive)
  if (!lowerText.startsWith(lowerPrefix)) {
    return {
      allowed: false,
      cleanedMessage: "",
      reason: `Message does not start with '${prefix}'`,
    };
  }

  // 2. Character right after prefix MUST be whitespace (space, tab, newline)
  const charAfter = textContent.charAt(prefix.length);
  if (!charAfter || !/\s/.test(charAfter)) {
    return {
      allowed: false,
      cleanedMessage: "",
      reason: `Message prefix '${prefix}' is not followed by a space (found '${
        charAfter || "EOF"
      }')`,
    };
  }

  // 3. Message after prefix must not be empty
  const cleanPrompt = textContent.slice(prefix.length).trim();
  if (!cleanPrompt) {
    return {
      allowed: false,
      cleanedMessage: "",
      reason: `Message contains only prefix '${prefix}' with no content`,
    };
  }

  return { allowed: true, cleanedMessage: cleanPrompt };
}

export function extractMessageText(msgContent: proto.IMessage | null | undefined): string {
  if (!msgContent) return "";
  if (msgContent.conversation) return msgContent.conversation;
  if (msgContent.extendedTextMessage?.text) return msgContent.extendedTextMessage.text;
  if (msgContent.imageMessage?.caption) return msgContent.imageMessage.caption;
  if (msgContent.videoMessage?.caption) return msgContent.videoMessage.caption;
  if (msgContent.documentMessage?.caption) return msgContent.documentMessage.caption;
  if (msgContent.buttonsResponseMessage?.selectedButtonId)
    return msgContent.buttonsResponseMessage.selectedButtonId;
  if (msgContent.buttonsResponseMessage?.selectedDisplayText)
    return msgContent.buttonsResponseMessage.selectedDisplayText;
  if (msgContent.listResponseMessage?.singleSelectReply?.selectedRowId)
    return msgContent.listResponseMessage.singleSelectReply.selectedRowId;
  if (msgContent.listResponseMessage?.title)
    return msgContent.listResponseMessage.title;
  if (msgContent.templateButtonReplyMessage?.selectedId)
    return msgContent.templateButtonReplyMessage.selectedId;
  if (msgContent.templateButtonReplyMessage?.selectedDisplayText)
    return msgContent.templateButtonReplyMessage.selectedDisplayText;
  if (msgContent.interactiveResponseMessage?.body?.text)
    return msgContent.interactiveResponseMessage.body.text;
  if (msgContent.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const parsed = JSON.parse(msgContent.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson);
      if (parsed.id || parsed.text) return parsed.text || parsed.id;
    } catch {}
  }
  if (msgContent.templateMessage?.hydratedTemplate?.hydratedContentText)
    return msgContent.templateMessage.hydratedTemplate.hydratedContentText;
  if (msgContent.templateMessage?.hydratedFourRowTemplate?.hydratedContentText)
    return msgContent.templateMessage.hydratedFourRowTemplate.hydratedContentText;
  if (msgContent.editedMessage?.message)
    return extractMessageText(msgContent.editedMessage.message);
  if (msgContent.protocolMessage?.editedMessage)
    return extractMessageText(msgContent.protocolMessage.editedMessage);
  if (msgContent.ephemeralMessage?.message)
    return extractMessageText(msgContent.ephemeralMessage.message);
  if (msgContent.viewOnceMessage?.message)
    return extractMessageText(msgContent.viewOnceMessage.message);
  if (msgContent.viewOnceMessageV2?.message)
    return extractMessageText(msgContent.viewOnceMessageV2.message);
  if (msgContent.documentWithCaptionMessage?.message)
    return extractMessageText(msgContent.documentWithCaptionMessage.message);
  if ((msgContent as any).viewOnceMessageV2Extension?.message)
    return extractMessageText((msgContent as any).viewOnceMessageV2Extension.message);
  return "";
}

export function normalizeWhatsAppMessage(text: string): string {
  if (!text) return "";
  let result = text;
  result = result.replace(/\*\*(.*?)\*\*/g, "*$1*");
  result = result.replace(/^#{1,6}\s+(.+)$/gm, "*$1*");

  const lines = result.split("\n");
  const processedLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const stripped = line.trim();

    if (stripped.startsWith("|") && stripped.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      const rows: string[][] = [];
      for (const tl of tableLines) {
        if (/^\|[\s\-:|]+\|$/.test(tl)) continue;
        const parts = tl.split("|").map((c) => c.trim());
        const cells = parts.slice(1, -1);
        if (cells.length > 0) rows.push(cells);
      }

      if (rows.length > 0) {
        let headers: string[] = [];
        let dataRows = rows;
        if (rows.length > 1) {
          const firstRowClean = rows[0].map((c) => c.replace(/[*_]/g, "").trim().toLowerCase());
          if (
            firstRowClean.some((h) =>
              [
                "detail",
                "field",
                "key",
                "property",
                "attribute",
                "item",
                "kolom",
                "fitur",
                "nama",
                "name",
                "no",
                "id",
                "produk",
                "product",
                "kategori",
              ].includes(h)
            )
          ) {
            headers = rows[0];
            dataRows = rows.slice(1);
          }
        }

        for (const row of dataRows) {
          if (row.length === 2) {
            const kClean = row[0].replace(/^[*_\s]+|[*_\s]+$/g, "");
            processedLines.push(`• *${kClean}*: ${row[1]}`);
          } else if (row.length > 2) {
            const itemTitle = row[0].replace(/^[*_\s]+|[*_\s]+$/g, "");
            processedLines.push(`*${itemTitle}*`);
            for (let idx = 1; idx < row.length; idx++) {
              const val = row[idx];
              const hdr = idx < headers.length ? headers[idx] : null;
              if (hdr) {
                const hdrClean = hdr.replace(/^[*_\s]+|[*_\s]+$/g, "");
                processedLines.push(`  • *${hdrClean}*: ${val}`);
              } else {
                processedLines.push(`  • ${val}`);
              }
            }
            processedLines.push("");
          } else if (row.length === 1) {
            processedLines.push(`• ${row[0]}`);
          }
        }
      }
    } else {
      processedLines.push(lines[i]);
      i++;
    }
  }

  result = processedLines.join("\n");
  result = result.replace(/\n{3,}/g, "\n\n");
  return result.trim();
}
