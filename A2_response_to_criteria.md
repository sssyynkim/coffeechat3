Assignment 1 - Web Server - Response to Criteria
================================================

Instructions
------------------------------------------------
- Keep this file named A2_response_to_criteria.md, do not change the name
- Upload this file along with your code in the root directory of your project
- Upload this file in the current Markdown format (.md extension)
- Do not delete or rearrange sections.  If you did not attempt a criterion, leave it blank
- Text inside [ ] like [eg. S3 ] are examples and should be removed


Overview
------------------------------------------------

- **Name:** Yeonseo Ko
- **Student number:** n11725605
- **Partner name (if applicable):** Suyeon Kim (n11682957)
- **Application name:** coffeechat
- **Two line description:**  A web application allowing users to chat, share images, and GIFs, utilizing AWS services for storage and authentication.
- **EC2 instance name or ID:** n11725605_YeonseoKo (i-04c75a4ee4d987951)

Core criteria
------------------------------------------------

### Core - First data persistence service

- **AWS service name:**  S3
- **What data is being stored?:** image, gif files
- **Why is this service suited to this data?:** S3 is optimized for storing large media files like images and GIFs due to its ability to scale and handle large objects.
- **Why is are the other services used not suitable for this data?:** DynamoDB is more suited for structured, low-latency data access, which is not optimal for large file storage.
- **Bucket/instance/table name:** n11725605-assignment2
- **Video timestamp:**
- **Relevant files:**
    - server/server.js
    - server/controllers/s3Controller.js

### Core - Second data persistence service

- **AWS service name:**  DynamoDB
- **What data is being stored?:** Metadata for posts (e.g., post titles, content, timestamps)
- **Why is this service suited to this data?:** DynamoDB is ideal for fast and scalable data storage and retrieval, especially for structured data like post metadata.
- **Why is are the other services used not suitable for this data?:** S3 is more suited for storing objects (files), and it does not handle structured metadata well.
- **Video timestamp:**
- **Relevant files:**
    - server/server.js
    - server/controllers/dynamoDBController.js

### Third data service

- **AWS service name:** EBS
- **What data is being stored?:** 
- **Why is this service suited to this data?:** 
- **Why is are the other services used not suitable for this data?:** 
- **Video timestamp:**
- **Relevant files:**
    -

### S3 Pre-signed URLs

- **S3 Bucket names:** n11725605-assignment2
- **Video timestamp:**
- **Relevant files:**
    - server/server.js
    - server/controllers/s3Controller.js

### In-memory cache

- **ElastiCache instance name:**
- **What data is being cached?:** [eg. Thumbnails from YouTube videos obatined from external API]
- **Why is this data likely to be accessed frequently?:** [ eg. Thumbnails from popular YouTube videos are likely to be shown to multiple users ]
- **Video timestamp:**
- **Relevant files:**
    -

### Core - Statelessness #이건 수정해야할지도 !!

- **What data is stored within your application that is not stored in cloud data services?:** Intermediate image or GIF processing data before it is uploaded to S3.
- **Why is this data not considered persistent state?:** Intermediate data can be recreated or reprocessed, so its loss does not affect the application's state permanently.
- **How does your application ensure data consistency if the app suddenly stops?:** If the app crashes, image processing can be restarted without losing uploaded or final data in S3 or DynamoDB.
- **Relevant files:**
    - server/server.js
    - server/controllers/s3Controller.js

### Graceful handling of persistent connections

- **Type of persistent connection and use:** [eg. server-side-events for progress reporting]
- **Method for handling lost connections:** [eg. client responds to lost connection by reconnecting and indicating loss of connection to user until connection is re-established ]
- **Relevant files:**
    -


### Core - Authentication with Cognito

- **User pool name:**
- **How are authentication tokens handled by the client?:** [eg. Response to login request sets a cookie containing the token.]
- **Video timestamp:**
- **Relevant files:**
    -

### Cognito multi-factor authentication

- **What factors are used for authentication:** [eg. password, SMS code]
- **Video timestamp:**
- **Relevant files:**
    -

### Cognito federated identities

- **Identity providers used:**
- **Video timestamp:**
- **Relevant files:**
    -

### Cognito groups

- **How are groups used to set permissions?:** [eg. 'admin' users can delete and ban other users]
- **Video timestamp:**
- **Relevant files:**
    -

### Core - DNS with Route53

- **Subdomain**:  www.coffeechat.cab432.com
- **Video timestamp:**


### Custom security groups

- **Security group names:**
- **Services/instances using security groups:**
- **Video timestamp:**
- **Relevant files:**
    -

### Parameter store

- **Parameter names:** /n11725605/s3/bucket-name
- **Video timestamp:**
- **Relevant files:**
    - server/server.js


### Secrets manager

- **Secrets names:** n11725605-coffeechat4
- **Video timestamp:**
- **Relevant files:**
    - server/server.js
    - server/config/secretsManager.js

### Infrastructure as code

- **Technology used:** Terraform
- **Services deployed:** s3, dynamo
- **Video timestamp:**
- **Relevant files:**
    - terraform/main.tf
    - terraform/outputs.tf
    - terraform/terraform.tfvars
    - terraform/varriables.tf

### Other (with prior approval only)

- **Description:**
- **Video timestamp:**
- **Relevant files:**
    -

### Other (with prior permission only)

- **Description:**
- **Video timestamp:**
- **Relevant files:**
    -
