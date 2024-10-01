// require('dotenv').config();
// const express = require('express');
// const path = require('path');
// const http = require('http');
// const cookieParser = require('cookie-parser');
// const { connectDB } = require('./config/db');
// const session = require('express-session');
// const MongoStore = require('connect-mongo');
// const flash = require('connect-flash');
// const passport = require('./config/passport');
// const cors = require('cors');
// const { getDB } = require('./config/db');
// const configureSocketIO = require('./config/socketio');
// const ensureAuthenticated = require('./middleware/auth');
// const multer = require('multer'); // Add multer for file upload handling
// const upload = multer({ storage: multer.memoryStorage() });

// // AWS SDK imports
// const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
// const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');  // 올바르게 가져온 DynamoDBClient
// const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
// const { v4: uuidv4 } = require('uuid'); // UUID for postId

// // S3 and DynamoDB setup using environment variables
// const bucketName = process.env.AWS_BUCKET_NAME; // Bucket name from .env
// const region = process.env.AWS_REGION; // AWS region from .env
// const tableName = process.env.DYNAMO_TABLE_NAME; // DynamoDB table name
// const qutUsername = process.env.QUT_USERNAME; // Fixed partition key for DynamoDB

// // AWS SDK 클라이언트 설정 (.env에서 자격 증명 사용)
// const s3Client = new S3Client({
//     region,
//     credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//         sessionToken: process.env.AWS_SESSION_TOKEN // 필요한 경우 임시 자격증명을 추가합니다.
//     }
// });

// // DynamoDB 클라이언트 생성 함수
// async function createDynamoDBClient() {
//     const client = new DynamoDBClient({
//         region: process.env.AWS_REGION,
//         credentials: {
//             accessKeyId: process.env.AWS_ACCESS_KEY_ID,  // .env에서 가져온 Access Key ID
//             secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  // .env에서 가져온 Secret Access Key
//             sessionToken: process.env.AWS_SESSION_TOKEN  // (선택사항) 임시 자격 증명인 경우 Session Token도 필요합니다.
//         }
//     });

//     // DynamoDBDocumentClient로 변환하여 사용 (더 쉽게 문서 작업)
//     const docClient = DynamoDBDocumentClient.from(client);
//     return docClient;
// }

// const app = express();

// // MongoDB connection
// connectDB().then(() => {
//     console.log("Connected to the database successfully");
// }).catch(err => {
//     console.error("Failed to connect to the database:", err);
//     process.exit(1);
// });

// // CORS Setup
// app.use(cors({
//     origin: ['http://localhost:3000'],
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//     credentials: true,
//     optionsSuccessStatus: 204
// }));

// // Middleware Setup
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(cookieParser());
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());

// // Session Setup
// app.use(session({
//     secret: process.env.SESSION_SECRET,
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//         mongoUrl: process.env.DB_URL
//     }),
//     cookie: { maxAge: 3600000 } // 1 hour
// }));

// // Flash Messages Setup
// app.use(flash());
// app.use((req, res, next) => {
//     res.locals.success_msg = req.flash('success_msg');
//     res.locals.error_msg = req.flash('error_msg');
//     next();
// });

// // Passport Setup
// app.use(passport.initialize());
// app.use(passport.session());

// // View Engine Setup
// app.set('view engine', 'ejs');
// app.set('views', path.join(__dirname, 'views'));

// // 포스트 추가 함수 (S3 파일 업로드 포함)
// async function addPost(req, res) {
//     const { title, content } = req.body;
//     const file = req.file;

//     if (!title || !content || !file) {
//         return res.status(400).send("Title, content, or image file is missing.");
//     }

//     const postId = uuidv4();  // UUID로 postId 생성
//     const userId = req.user.sub;  // Cognito 사용자 ID

//     try {
//         // S3에 파일 업로드
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const params = {
//             Bucket: bucketName,
//             Key: `${userId}/${fileName}`,
//             Body: file.buffer,
//             ContentType: file.mimetype,
//             Metadata: {
//                 'uploaded-by': req.user.email // 사용자 이메일 추가
//             }
//         };

//         const command = new PutObjectCommand(params);
//         await s3Client.send(command);

//         const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${userId}/${fileName}`;

//         // DynamoDB에 포스트 정보 저장
//         const docClient = await createDynamoDBClient();
//         const postData = {
//             "qut-username": qutUsername,  // 파티션 키
//             "postId": postId,  // 정렬 키 (UUID)
//             title,
//             content,
//             imageUrl: fileUrl,  // S3에 업로드된 파일 경로
//             timestamp: new Date().toISOString(),
//             uploadedBy: userId  // 업로드한 사용자 정보
//         };

//         const paramsDynamoDB = {
//             TableName: tableName,
//             Item: postData
//         };

//         await docClient.send(new PutCommand(paramsDynamoDB));
//         res.status(201).send({ message: "Post created successfully", postId });
//     } catch (err) {
//         console.error("Error adding post:", err);
//         res.status(500).send("Error adding post");
//     }
// }

// // 포스트 조회 함수
// async function getPost(req, res) {
//     const { postId } = req.params;

//     try {
//         const docClient = await createDynamoDBClient();
//         const params = {
//             TableName: tableName,
//             Key: {
//                 "qut-username": qutUsername,
//                 "postId": postId
//             }
//         };

//         const data = await docClient.send(new GetCommand(params));
//         if (data.Item) {
//             res.status(200).send(data.Item);
//         } else {
//             res.status(404).send("Post not found");
//         }
//     } catch (err) {
//         console.error("Error fetching post:", err);
//         res.status(500).send("Error fetching post");
//     }
// }

// // 테스트 아이템 추가 함수
// async function addTestItem() {
//     const testItem = {
//         "qut-username": qutUsername, // Partition key 값
//         "postId": "testPost123", // 테스트용 Post ID
//         "title": "Test Title", // 테스트용 제목
//         "content": "This is a test content for DynamoDB.", // 테스트용 콘텐츠
//         "fileUrl": "https://example.com/test-image.jpg", // 테스트용 파일 URL
//         "timestamp": new Date().toISOString(), // 현재 타임스탬프
//         "uploadedBy": "testUser@example.com", // 테스트용 업로더 정보
//         "userId": "testUserId" // 테스트용 유저 ID
//     };

//     try {
//         const docClient = await createDynamoDBClient();
//         const command = new PutCommand({
//             TableName: tableName,
//             Item: testItem
//         });
//         const response = await docClient.send(command);
//         console.log('Test item added successfully:', response);
//     } catch (error) {
//         console.error('Error adding test item:', error);
//     }
// }

// // 테스트 아이템 추가 함수 호출
// addTestItem();

// // Test Session Route
// app.get('/test-session', (req, res) => {
//     console.log('Session data:', req.session);
//     res.send(req.session); // Return session data to check if token exists
// });

// // 기본 라우트
// app.get('/', async (req, res) => {
//     try {
//         const db = getDB();
//         if (req.session.token) {
//             const userPosts = await db.collection('post').find().toArray();
//             res.render('index', { user: true, posts: userPosts });
//         } else {
//             res.render('index', { user: null, posts: [] });
//         }
//     } catch (err) {
//         console.error('Error fetching posts:', err);
//         res.status(500).send('Internal Server Error');
//     }
// });

// // Routes for posts
// app.post('/posts/add', ensureAuthenticated, upload.single('file'), addPost);
// app.get('/posts/:postId', ensureAuthenticated, getPost);

// // Additional routes
// const authRoutes = require('./routes/authRoutes');
// const chatRoutes = require('./routes/chatRoutes');
// const commentRoutes = require('./routes/commentRoutes');

// app.use('/auth', authRoutes);
// app.use('/chat', ensureAuthenticated, chatRoutes);
// app.use('/comment', ensureAuthenticated, commentRoutes);

// // 서버 시작
// const PORT = process.env.PORT || 8080;
// const server = http.createServer(app);
// configureSocketIO(server);
// server.listen(PORT, () => {
//     console.log(`Server running at http://localhost:${PORT}`);
// });

// require('events').EventEmitter.defaultMaxListeners = 20; // Increase the limit as needed

require('dotenv').config();
const express = require('express');
const path = require('path');
const http = require('http');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const passport = require('./config/passport');
const cors = require('cors');
const { getDB } = require('./config/db');
const configureSocketIO = require('./config/socketio');
const ensureAuthenticated = require('./middleware/auth');
const multer = require('multer'); // Add multer
const upload = multer({ storage: multer.memoryStorage() });
const { addTestItem } = require('./controllers/dynamoController'); // Import the function


// AWS SDK v3 imports for S3 and DynamoDB
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

// AWS S3 and DynamoDB configuration using environment variables
const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_REGION;
const tableName = process.env.DYNAMO_TABLE_NAME;
const qutUsername = process.env.QUT_USERNAME; // Partition key for DynamoDB

// AWS SDK S3 client setup
const s3Client = new S3Client({
    region,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN // Optional if using temporary credentials
    }
});

// DynamoDB Client creation function
async function createDynamoDBClient() {
    const client = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN
        }
    });

    return DynamoDBDocumentClient.from(client); // Convert to DocumentClient for easier interaction
}

const app = express();

// MongoDB connection
connectDB().then(() => {
    console.log("Connected to the database successfully");
}).catch(err => {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
});

// CORS Setup
app.use(cors({
    origin: ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
}));

// Middleware Setup
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.DB_URL
    }),
    cookie: { maxAge: 3600000 } // 1 hour
}));

// Flash Messages Setup
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

// View Engine Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// File upload route with S3 and DynamoDB
app.post('/upload', ensureAuthenticated, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const userId = req.user.sub; // Cognito user ID
    const email = req.user.email; // User email

    // S3 Upload
    const params = {
        Bucket: bucketName,
        Key: `${userId}/${req.file.originalname}`, // User-specific folder
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
        Metadata: {
            'uploaded-by': email
        }
    };

    console.log('Uploading to bucket:', bucketName);
    console.log('Uploading file with key:', `${userId}/${req.file.originalname}`);

    try {
        const command = new PutObjectCommand(params);
        await s3Client.send(command);

        const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${userId}/${req.file.originalname}`;

        // Save post data in DynamoDB
        const docClient = await createDynamoDBClient();
        const postId = uuidv4(); // Generate unique post ID

        const postData = {
            "qut-username": qutUsername, // Partition key
            "postId": postId, // Sort key
            title: req.body.title,
            content: req.body.content,
            imageUrl: fileUrl, // S3 file URL
            timestamp: new Date().toISOString(),
            uploadedBy: userId
        };

        await docClient.send(new PutCommand({ TableName: tableName, Item: postData }));
        res.status(201).send({ message: 'Post created successfully', postId });

    } catch (err) {
        console.error('Error uploading file or adding post:', err);
        res.status(500).send('File upload failed or post creation failed');
    }
});


// Test route to trigger addTestItem function
app.get('/test/add-item', async (req, res) => {
    try {
        await addTestItem(); // Call the function to add the test item
        res.status(200).send("Test item added successfully");
    } catch (err) {
        console.error("Error adding test item:", err);
        res.status(500).send("Failed to add test item");
    }
});


// Test Session Route
app.get('/test-session', (req, res) => {
    console.log('Session data:', req.session);
    res.send(req.session); // Return session data to check if token exists
});

// Disable ETag
app.disable('etag');

// Routes
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const chatRoutes = require('./routes/chatRoutes');
const commentRoutes = require('./routes/commentRoutes');

app.use('/auth', authRoutes);
app.use('/posts', ensureAuthenticated, postRoutes);
app.use('/chat', ensureAuthenticated, chatRoutes);
app.use('/comment', ensureAuthenticated, commentRoutes);

// Default Route
app.get('/', async (req, res) => {
    try {
        const db = getDB();
        if (req.session.token) {
            const userPosts = await db.collection('post').find().toArray();
            res.render('index', { user: true, posts: userPosts });
        } else {
            res.render('index', { user: null, posts: [] });
        }
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).send('Internal Server Error');
    }
});

// Start the Server
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);
configureSocketIO(server);
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

require('events').EventEmitter.defaultMaxListeners = 20;
