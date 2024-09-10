document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const uploadForm = document.getElementById("uploadForm");
  const fileUploadedMessage = document.getElementById("fileUploadedMessage");

  dropZone.addEventListener("click", () => {
    fileInput.click();
  });

  dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
    const files = event.dataTransfer.files;
    if (files.length) {
      fileInput.files = files;
      dropZone.classList.add("uploaded");
      fileUploadedMessage.style.display = "block";
    }
  });

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length) {
      dropZone.classList.add("uploaded");
      fileUploadedMessage.style.display = "block";
    }
  });

  uploadForm.addEventListener("submit", (event) => {
    if (!fileInput.files.length) {
      alert("Please select a file before submitting.");
      event.preventDefault();
    }
  });
});
