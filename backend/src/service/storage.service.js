const ImageKit = require("@imagekit/nodejs").default;
const { toFile } = require("@imagekit/nodejs");

const client = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadFile({ buffer, filename, folder = "" }) {
    try {
        // @imagekit/nodejs v7+ does not accept a raw Buffer for `file`.
        // It must be wrapped with toFile(), otherwise the SDK's fetch-based
        // client hangs indefinitely instead of throwing.
        const file = await client.files.upload({
            file: await toFile(buffer, filename),
            fileName: filename,
            folder: folder
        });

        return file;
    } catch (error) {
        console.error("Error uploading file to ImageKit:", error);
        throw error;
    }
}

module.exports = { uploadFile };