// Photo "upload" replacement: files are converted to data URLs in the
// browser and stored directly as the profile_photo_path value — there is no
// real storage backend to upload to.
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
