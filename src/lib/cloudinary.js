import { v2 as cloudinary } from 'cloudinary'
cloudinary.config({
    cloud_name: 'dgb3zzh5h', 
    api_key: '253122813231654', 
    api_secret: '85jVP2VB9hb4hgii2kodWlIEp8Y' 
});
function uploadToCloudinary(filePath) {
 return new Promise((resolve, reject) => {
   cloudinary.uploader.upload(filePath, function (error, result) {
     if (error) reject(error);
     else resolve(result)
   });
 })
}
export default uploadToCloudinary;