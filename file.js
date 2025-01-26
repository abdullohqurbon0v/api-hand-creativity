const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class FileUpload {
     save(file) {
          try {
               const fileExtension = path.extname(file.name);
               const fileName = `${uuidv4()}${fileExtension}`;
               const staticDir = path.join(__dirname, 'static');
               const filePath = path.join(staticDir, fileName);
               if (!fs.existsSync(staticDir)) {
                    fs.mkdirSync(staticDir, { recursive: true });
               }
               file.mv(filePath);

               return fileName;
          } catch (error) {
               console.error("Error saving file:", error);
               throw new Error("Error saving file");
          }
     }
}

module.exports = new FileUpload();
