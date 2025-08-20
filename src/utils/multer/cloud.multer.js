import multer from "multer";

export const fileValidation = {
  image: ["image/jpeg", "image/png"],
  document: ["application/pdf", "application/json"],
};

export const cloudFileUpload = ({ validation } = {}) => {
  const storage = multer.diskStorage({});
  function fileFilter(req, file, callback) {
    if (validation.includes(file.mimetype)) {
      return callback(null, true);
    }
    return callback("In-valid file format ", false);
  }
  return multer({ fileFilter, storage });
};
