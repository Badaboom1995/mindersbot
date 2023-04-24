const cloudinary = require('cloudinary').v2;
const axios = require('axios');

const uploadImage = async (fileLink, ctx) => {
    return new Promise(async (resolve, reject) => {
    const imageFile = await axios.get(fileLink, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(imageFile.data, 'binary');
    await cloudinary.uploader.upload_stream(
        { resource_type: 'image' },
        (error, result) => {
            if (error) {
                reject(error);
                console.error('Upload error:', error);
            } else {
                resolve(result.secure_url);
                console.log('Image uploaded:', result.secure_url);
            }
        }
    ).end(imageBuffer);
    });
}

module.exports = {uploadImage}