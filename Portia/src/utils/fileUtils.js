// src/utils/fileUtils.js
export function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);      // base64 data URL
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
