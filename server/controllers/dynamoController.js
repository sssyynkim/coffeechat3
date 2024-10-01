// require('dotenv').config();
// const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');  // DynamoDBClient를 올바르게 가져옴
// const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
// const { v4: uuidv4 } = require("uuid");
// const { getPreSignedUrlWithUser, uploadFileToS3 } = require('./s3Controller');

// const tableName = process.env.DYNAMO_TABLE_NAME;
// const qutUsername = process.env.QUT_USERNAME;  // 고정된 사용자 이름

// // DynamoDB Client 생성 및 DocumentClient로 변환하는 함수
// async function createDynamoDBClient() {
//     const client = new DynamoDBClient({
//         region: process.env.AWS_REGION,
//         credentials: {
//             accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//             secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//             sessionToken: process.env.AWS_SESSION_TOKEN
//         }
//     });

//     const docClient = DynamoDBDocumentClient.from(client);
//     return docClient;
// }

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
//         // S3에 파일 업로드를 위한 프리사인 URL 생성
//         const fileName = `${Date.now()}_${file.originalname}`;
//         const preSignedUrl = await getPreSignedUrlWithUser(fileName, userId);

//         // 파일을 S3에 업로드
//         await uploadFileToS3(req.file.buffer, preSignedUrl, req.file.mimetype);

//         // DynamoDB에 포스트 정보 저장
//         const docClient = await createDynamoDBClient();
//         const postData = {
//             "qut-username": qutUsername,  // 파티션 키
//             "postId": postId,  // 정렬 키 (UUID)
//             title,
//             content,
//             imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userId}/${fileName}`,  // S3에 업로드된 파일 경로
//             timestamp: new Date().toISOString(),
//             uploadedBy: userId  // 업로드한 사용자 정보
//         };

//         const params = {
//             TableName: tableName,
//             Item: postData
//         };

//         await docClient.send(new PutCommand(params));
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
//         "qut-username": process.env.QUT_USERNAME, // Partition key 값
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

// module.exports = {
//     addPost,
//     getPost,
//     addTestItem
// };


require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');  // DynamoDB Client
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require("uuid");
const { getPreSignedUrlWithUser, uploadFileToS3 } = require('./s3Controller'); // Assuming you have this controller for S3 uploads

const tableName = process.env.DYNAMO_TABLE_NAME;
const qutUsername = process.env.QUT_USERNAME;  // Fixed partition key

// DynamoDB Client setup and conversion to DocumentClient
async function createDynamoDBClient() {
    const client = new DynamoDBClient({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN
        }
    });

    return DynamoDBDocumentClient.from(client); // Return DocumentClient
}

// Function to add a post
async function addPost(req, res) {
    const { title, content } = req.body;
    const file = req.file;

    if (!title || !content || !file) {
        return res.status(400).send("Title, content, or image file is missing.");
    }

    const postId = uuidv4();  // Generate a unique postId
    const userId = req.user.sub;  // Cognito user ID

    try {
        // S3 file upload
        const fileName = `${Date.now()}_${file.originalname}`;
        const preSignedUrl = await getPreSignedUrlWithUser(fileName, userId);
        await uploadFileToS3(req.file.buffer, preSignedUrl, req.file.mimetype);

        // Post data to DynamoDB
        const docClient = await createDynamoDBClient();
        const postData = {
            "qut-username": qutUsername,  // Partition key
            "postId": postId,  // Sort key (UUID)
            title,
            content,
            imageUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${userId}/${fileName}`,  // S3 file URL
            timestamp: new Date().toISOString(),
            uploadedBy: userId // Uploading user info
        };

        await docClient.send(new PutCommand({ TableName: tableName, Item: postData }));
        res.status(201).send({ message: "Post created successfully", postId });
    } catch (err) {
        console.error("Error adding post:", err);
        res.status(500).send("Error adding post");
    }
}

// Function to get a single post
async function getPost(req, res) {
    const { postId } = req.params;

    try {
        const docClient = await createDynamoDBClient();
        const params = {
            TableName: tableName,
            Key: {
                "qut-username": qutUsername,
                "postId": postId
            }
        };

        const data = await docClient.send(new GetCommand(params));
        if (data.Item) {
            res.status(200).send(data.Item);
        } else {
            res.status(404).send("Post not found");
        }
    } catch (err) {
        console.error("Error fetching post:", err);
        res.status(500).send("Error fetching post");
    }
}

// Function to get all posts
async function getAllPosts(req, res) {
    try {
        const docClient = await createDynamoDBClient();
        const params = {
            TableName: tableName
        };

        const data = await docClient.send(new ScanCommand(params)); // Use 'scan' to get all items
        if (data.Items && data.Items.length > 0) {
            res.status(200).render('list', { posts: data.Items }); // Assuming 'list' is your view
        } else {
            res.status(404).send("No posts found");
        }
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).send("Error fetching posts");
    }
}

// Function to add a test item (for debugging purposes)
async function addTestItem() {
    const testItem = {
        "qut-username": process.env.QUT_USERNAME, // Partition key value
        "postId": "testPost SY YS", // Test Post ID
        "title": "Test Title",
        "content": "This is test content for DynamoDB.",
        "fileUrl": "https://example.com/test-image.jpg", // Test file URL
        "timestamp": new Date().toISOString(),
        "uploadedBy": "testUser@example.com", // Test uploader info
        "userId": "testUserId" // Test user ID
    };

    try {
        const docClient = await createDynamoDBClient();
        const command = new PutCommand({
            TableName: process.env.DYNAMO_TABLE_NAME,
            Item: testItem
        });
        
        // Log the command and response
        console.log("Sending PutCommand to DynamoDB:", command);
        const response = await docClient.send(command);
        
        console.log('DynamoDB PutCommand Response:', response);  // Log the response
        
    } catch (err) {
        console.error('Error adding test item:', err);  // Log errors
    }
}


module.exports = {
    createDynamoDBClient,
    addPost,  // If needed in other files
    getPost,  // If needed in other files
    getAllPosts,  // If needed in other files
    addTestItem  // If needed in other files
};
