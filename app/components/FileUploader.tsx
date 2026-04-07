import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const selectedFile = acceptedFiles[0] || null;
      setFile(selectedFile);
      if (selectedFile) {
        onFileSelect(selectedFile);
      }
    },
    [onFileSelect],
  );
  const maxSize = 5 * 1024 * 1024;
  const { getRootProps, getInputProps, isDragActive, acceptedFiles } =
    useDropzone({
      onDrop,
      accept: { "application/pdf": [".pdf"] },
      multiple: false,
      maxSize: 5 * 1024 * 1024,
    });
  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <div className="space-y-4 cursor-pointer">
          <div className="mx-auto w-16 h-16 flex items-center justify-center">
            <img src="/icons/info.svg" alt="Upload" className="size-20" />
          </div>
          {file ? (
            <div
              className="uploader-selected-file"
              onClick={(e) => e.stopPropagation()}
            >
              <img src="/images/pdf.png" alt="Pdf" className="size-10" />
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm font-med text-gray-500">
                    <span className="font-semibold">{file.name}</span>
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatSize(file.size)}
                  </p>
                </div>
                <img
                  src="/icons/cross.svg"
                  alt="Remove"
                  className="size-6 cursor-pointer ml-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFile(null);
                  }}
                />
              </div>
            </div>
          ) : (
            <div>
              <div>
                <p className="text-lg text-gray-500">
                  <span className="font-semibold ">click to upload</span> or
                  drag and drop your resume here
                </p>
                <p className="text-sm text-gray-500">PDF(Max-5MB)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileUploader;
