import type { Express, Request, Response as ExpressResponse } from "express";
import { Readable } from "node:stream";
import { eq, sql } from "drizzle-orm";
import { downloads, pdfFiles } from "../drizzle/schema";
import { getDb, getPdfStorageRecord } from "./db";
import { storageGetSignedUrl } from "./storage";

function copyFileHeaders(upstream: globalThis.Response, res: ExpressResponse) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Accept-Ranges", "bytes");
  const contentLength = upstream.headers.get("content-length");
  const contentRange = upstream.headers.get("content-range");
  if (contentLength) res.setHeader("Content-Length", contentLength);
  if (contentRange) res.setHeader("Content-Range", contentRange);
}

async function fetchStoredPdf(req: Request, res: ExpressResponse, disposition: "inline" | "attachment") {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid PDF id" });
    return null;
  }
  const record = await getPdfStorageRecord(id);
  if (!record) {
    res.status(404).json({ error: "PDF not found" });
    return null;
  }
  let signedUrl: string;
  try {
    signedUrl = await storageGetSignedUrl(record.fileKey);
  } catch (error) {
    console.error("[PDF] Signed URL generation failed", error);
    res.status(502).json({ error: "Stored PDF is unavailable" });
    return null;
  }
  let upstream: globalThis.Response;
  try {
    const headers: Record<string, string> = {};
    if (typeof req.headers.range === "string") headers.Range = req.headers.range;
    upstream = await fetch(signedUrl, { headers });
  } catch (error) {
    console.error("[PDF] Storage retrieval failed", error);
    res.status(502).json({ error: "Stored PDF could not be retrieved" });
    return null;
  }
  if (!upstream.ok && upstream.status !== 206) {
    console.error(`[PDF] Storage returned ${upstream.status} for ${record.fileKey}`);
    res.status(upstream.status === 404 ? 404 : 502).json({ error: "Stored PDF is missing" });
    return null;
  }
  copyFileHeaders(upstream, res);
  res.setHeader("Content-Disposition", disposition === "attachment" ? `attachment; filename="${record.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}"` : "inline");
  return { record, upstream };
}

export function registerPdfRoutes(app: Express) {
  app.get("/api/pdfs/:id/file", async (req, res) => {
    try {
      const result = await fetchStoredPdf(req, res, "inline");
      if (!result?.upstream.body) {
        if (!res.headersSent) res.status(502).json({ error: "Stored PDF has no content" });
        return;
      }
      Readable.fromWeb(result.upstream.body as import("node:stream/web").ReadableStream).pipe(res);
    } catch (error) {
      console.error("[PDF] File endpoint failed", error);
      if (!res.headersSent) res.status(500).json({ error: "Unable to serve PDF" });
    }
  });

  app.get("/api/pdfs/:id/download", async (req, res) => {
    try {
      const result = await fetchStoredPdf(req, res, "attachment");
      if (!result?.upstream.body) {
        if (!res.headersSent) res.status(502).json({ error: "Stored PDF has no content" });
        return;
      }
      const db = await getDb();
      if (!db) {
        res.status(503).json({ error: "Database unavailable" });
        return;
      }
      await db.insert(downloads).values({ pdfId: result.record.id, userId: null });
      await db.update(pdfFiles).set({ downloadCount: sql`${pdfFiles.downloadCount} + 1` }).where(eq(pdfFiles.id, result.record.id));
      Readable.fromWeb(result.upstream.body as import("node:stream/web").ReadableStream).pipe(res);
    } catch (error) {
      console.error("[PDF] Download endpoint failed", error);
      if (!res.headersSent) res.status(500).json({ error: "Unable to download PDF" });
    }
  });
}
