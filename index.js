const express = require('express')
const aws = require('aws-sdk');
const crypto = require('crypto');

const app = express()
const port = 3000
require('dotenv').config()

//aws setup
aws.config.update({
  secretAccessKey: process.env.AWS_SECRET_KEY,
  accessKeyId: process.env.AWS_KEY_ID,
  region: process.env.AWS_DEFAULT_RIGION,
});

//s3 object 
const s3 = new aws.S3({
  endpoint: new aws.Endpoint(process.env.AWS_ENDPOINT),
});

app.get('/', (req, res) => {
    var jimp = require('jimp'); // jimp is the player of this game

    var images = ['https://images.hindustantimes.com/img/2021/08/11/1600x900/messi-psg-getty_1628645762654_1628645767352.jpg', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTP8a6D3Up6aWSnvMJPnomFfVVyzJ6KD0Xrbg&usqp=CAU'];
    
    var jimps = [];
    
    for (var i = 0; i < images.length; i++) {
      if(i==0) {
        jimps.push(jimp.read(images[i]).then(lenna => {
            return lenna
              .resize(640, 360) // resize
          }));
      } else {
        jimps.push(jimp.read(images[i]).then(lenna => {
            return lenna
              .resize(640, 80) // resize
          }));
      }
    }
    
    Promise.all(jimps).then(function(data) {
      return Promise.all(jimps);
    }).then(function(data) {
      data[0].composite(data[1],0,280); // merge two into one

      //either genarate a image 
      //or direct upload to s3 , then skip write function 
      data[0].write('seo-meta-image/overlay.png', async function() {
        const buffer = await data[0].getBufferAsync(jimp.AUTO); // taks buffer to upload s3
        const Key = `${crypto.randomBytes(24).toString('hex')}.jpg`         //to maintain uniqueness of image (crpto.randomBytes are using)
        const params = {
          Bucket: `${process.env.AWS_IMAGE_BUCKET}/example-backend-api/images`,
          Key,
          Body: buffer,
          ACL: 'public-read',
          // ContentEncoding: 'base64', social share doesn't support base64 encoding image!
          ContentType:'image/jpeg',
        };
        await s3.upload(params, async (err, s3res) => {
          if (err) {
            res.status(500).send({ err, status: 'error' });
          }
          //added cloudfront linkto response
          s3res.cloudFrontLink = process.env.AWS_CLOUDFRONT_ENDPOINT + Key
          res.status(200).send(s3res)
        });
      });
    });
})
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})