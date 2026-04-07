import { prepareInstructions, AIResponseFormat } from "../../constants";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import FileUploader from "~/components/FileUploader";
import Navbar from "~/components/Navbar";
import { convertPdfToImage } from "~/lib/pdf2img";
import { usePuterStore } from "~/lib/puter";
import { generateUUID } from "~/lib/utils";

const upload = () => {
  const { fs, kv, ai, isLoading, auth } = usePuterStore();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (selectedFile: File | null) => {
    setFile(selectedFile);
  };

  const handleAnalysis = async ({
    companyName,
    jobTitle,
    jobDescription,
    file,
  }: {
    companyName: string;
    jobTitle: string;
    jobDescription: string;
    file: File;
  }) => {
    setIsProcessing(true);
    console.log("[analyze] started", {
      companyName,
      jobTitle,
      hasJobDescription: Boolean(jobDescription?.trim()),
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

    try {
      setStatusText("Uploading the file...");
      const uploadedFile = await fs.upload([file]);
      if (!uploadedFile) {
        console.error("[analyze] upload failed", { fileName: file.name });
        setStatusText("Error: Failed to upload the file. Please try again.");
        return;
      }

      setStatusText("Converting PDF to image...");
      const imageFile = await convertPdfToImage(file);

      if (!imageFile.file) {
        const details = imageFile.error ? ` Details: ${imageFile.error}` : "";
        console.error("[analyze] pdf conversion failed", {
          fileName: file.name,
          details: imageFile.error,
        });
        setStatusText(
          `Error: Failed to convert the PDF to an image.${details}`,
        );
        return;
      }

      setStatusText("Uploading the image...");
      const uploadedImage = await fs.upload([imageFile.file]);
      if (!uploadedImage) {
        console.error("[analyze] image upload failed", {
          imageFileName: imageFile.file.name,
        });
        setStatusText("Error: Failed to upload the image. Please try again.");
        return;
      }

      setStatusText("Preparing data for analysis...");
      const uuid = generateUUID();
      const data = {
        id: uuid,
        resumePath: uploadedFile.path,
        imagePath: uploadedImage.path,
        companyName,
        jobTitle,
        jobDescription,
        feedback: "",
      };
      await kv.set(`resume:${uuid}`, JSON.stringify(data));

      setStatusText("Analyzing the resume...");

      const feedback = await ai.feedback(
        uploadedFile.path,
        prepareInstructions({ jobDescription, jobTitle, AIResponseFormat }),
      );

      if (!feedback) {
        console.error("[analyze] ai feedback failed", {
          resumePath: uploadedFile.path,
        });
        setStatusText("Error: Failed to analyze the resume. Please try again.");
        return;
      }

      const feedBackText =
        typeof feedback.message.content === "string"
          ? feedback.message.content
          : feedback.message.content[0].text;

      data.feedback = JSON.parse(feedBackText);
      await kv.set(`resume:${uuid}`, JSON.stringify(data));
      setStatusText("Analysis complete! Redirecting...");
      console.log("[analyze] result", data);
    } catch (error) {
      console.error("[upload] Resume analysis failed", error);
      setStatusText(
        `Error: ${error instanceof Error ? error.message : "Unexpected error"}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget.closest("form");
    if (!form) return;

    const formData = new FormData(form);
    const companyName = formData.get("company-name") as string;
    const jobTitle = formData.get("job-title") as string;
    const jobDescription = formData.get("job-description") as string;

    if (!file) {
      console.warn("[analyze] submit ignored: no file selected");
      return;
    }

    handleAnalysis({ companyName, jobTitle, jobDescription, file });
  };

  return (
    <main className="bg-[url('/images/bg-main.svg')] bg-cover">
      <Navbar />

      <section className="main-section">
        <div className="page-heading px-16">
          <h1>Smart feedback for your resume</h1>
          {isProcessing ? (
            <>
              <h2>{statusText}</h2>
              <img src="/images/resume-scan.gif" alt="" />
            </>
          ) : (
            <h2>Upload your resume to get started</h2>
          )}
          {!isProcessing && (
            <form
              action="upload-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 mt-8"
            >
              <div className="form-div">
                <label htmlFor="company-name">Company Name</label>
                <input
                  type="text"
                  id="company-name"
                  name="company-name"
                  placeholder="Company Name"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-title">Job Title</label>
                <input
                  type="text"
                  id="job-title"
                  name="job-title"
                  placeholder="Job Title"
                />
              </div>
              <div className="form-div">
                <label htmlFor="job-description">Job Description</label>
                <textarea
                  rows={5}
                  id="job-description"
                  name="job-description"
                  placeholder="Job Description"
                />
              </div>
              <div className="form-div">
                <label htmlFor="upload">Upload Resume</label>
                <FileUploader onFileSelect={handleFileSelect} />
                <button className="primary-button" type="submit">
                  Analyze
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
};

export default upload;
