import imageCompression from 'browser-image-compression';

export const compressImage = async (file, options = {}) => {
  try {
    const defaultOptions = {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: options.useWebWorker !== undefined ? options.useWebWorker : true,
      fileType: file.type
    };

    const compressedFile = await imageCompression(file, defaultOptions);

    // FIX: Restore file name + proper extension
    const ext = file.name.split('.').pop();
    const fixedFile = new File([compressedFile], `${Date.now()}.${ext}`, {
      type: compressedFile.type
    });

    return fixedFile;

  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress image: ' + error.message);
  }
};
