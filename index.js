// Load dotenv package
require('dotenv').config();

// Load required module
const fs = require('fs');
const path = require('path');
const util = require('util');
const url = require('url');
const Jimp = require('jimp');
const readdir = util.promisify(fs.readdir);
const unlink = util.promisify(fs.unlink);

const express = require('express');
const app = express();
const multer = require('multer');
const { v4: uuid } = require('uuid');


const PORT = process.env.PORT;

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads')
	},
	filename: (req, file, cb) => {
		req.header.url = uuid() + '.' + file.originalname.split('.').pop()
		cb(null, req.header.url)
	}
})

const upload = multer({ storage: storage })

// Use cors middleware to allow/disallow 
const cors = require('cors');
const corsOptions = {
	origin: process.env.APP_ORIGIN && process.env.APP_ORIGIN != '*' ? process.env.APP_ORIGIN.split(',') : '*',
	optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// error handler
app.use(function (err, req, res, next) {
	filePath = path.join(__dirname, process.env.DEFAULT_IMAGE);
	// Display default image if there is error
	res.sendFile(filePath);
});

app.get('/:url', async function (req, res) {
	let file = url.parse(req.url).pathname;
	let filePath = path.join(__dirname, `uploads/${file}`);
	res.sendFile(path.resolve(`uploads/${file}`));
});

async function deleteAllFilesInDir(dirPath) {
	try {
		const files = await readdir(dirPath);
		const unlinkPromises = files.map(filename => unlink(`${dirPath}/${filename}`));
		return Promise.all(unlinkPromises);
	} catch (err) {
		console.log(err);
	}
}

app.post('/upload', upload.single('image'), (req, res) => {
	res.status(200).json({
		url: req.protocol + '://' + req.get('host') + '/' + req.header.url
	})
})

app.post('/clear', (req, res) => {
	deleteAllFilesInDir('uploads').then(() => {
		res.status(200).json("Clearead All images")
	});
})

app.listen(PORT, () => {
	console.log(`Server listening at http://localhost:${PORT}`);
});