import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - The compressed image file
 */
export const compressImage = async (file, options = {}) => {
  try {
    const defaultOptions = {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: options.useWebWorker !== undefined ? options.useWebWorker : true,
      fileType: file.type
    };

    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
    
  } catch (error) {
    console.error('Compression error:', error);
    throw new Error('Failed to compress image: ' + error.message);
  }
};