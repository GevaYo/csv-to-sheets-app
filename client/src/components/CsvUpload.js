import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { uploadCsvFile } from "../services/apiService";

const CsvUpload = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = (acceptedFiles) => {
    setFile(acceptedFiles[0]);
    setMessage("");
    setError(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ".csv",
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) {
      setError("Please select or drop a CSV file");
      return;
    }

    setIsLoading(true);
    setError(null);
    setMessage("");

    try {
      const result = await uploadCsvFile(file);
      setMessage(result);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="csv-upload-container">
      <div {...getRootProps()} className="dropzone">
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the CSV file here...</p>
        ) : file ? (
          <p>Selected file: {file.name}</p>
        ) : (
          <p>Drag & drop a CSV file here, or click to select one</p>
        )}
      </div>
      <button onClick={handleUpload} disabled={isLoading || !file}>
        {isLoading ? "Uploading..." : "Upload CSV"}
      </button>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default CsvUpload;
