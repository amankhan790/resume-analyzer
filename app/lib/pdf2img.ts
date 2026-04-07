export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not typed as a module path
  loadPromise = import("pdfjs-dist/build/pdf.mjs")
    .then((lib) => {
      // Prefer the bundled worker path so dev/prod both resolve correctly.
      lib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      pdfjsLib = lib;
      return lib;
    })
    .catch((error) => {
      console.error("[pdf2img] Failed to load pdf.js", error);
      loadPromise = null;
      throw error;
    });

  return loadPromise;
}

export async function convertPdfToImage(
  file: File,
): Promise<PdfConversionResult> {
  try {
    if (file.type !== "application/pdf") {
      return {
        imageUrl: "",
        file: null,
        error: `Invalid file type: ${file.type || "unknown"}`,
      };
    }

    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 4 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    }

    if (!context) {
      return {
        imageUrl: "",
        file: null,
        error: "Failed to get 2D canvas context",
      };
    }

    await page.render({ canvasContext: context, viewport }).promise;

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create a File from the blob with the same name as the pdf
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });

            resolve({
              imageUrl: URL.createObjectURL(blob),
              file: imageFile,
            });
          } else {
            resolve({
              imageUrl: "",
              file: null,
              error: "Failed to create image blob",
            });
          }
        },
        "image/png",
        1.0,
      ); // Set quality to maximum (1.0)
    });
  } catch (err) {
    console.error("[pdf2img] PDF conversion failed", {
      error: err,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    return {
      imageUrl: "",
      file: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
