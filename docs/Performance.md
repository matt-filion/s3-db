## [Main Docs](./README.md)

# Performance
Some basic performance tests were done against bucket operations both remotely (North San Diego going to us-west-2) and within a Lambda function in the same region as the S3 bucket. The test code is available for anyone who is curious. Each test was run twice. It worth noting that the document size could dramatically affect the performance you encounter. These tests are admittedly primitive and aimed more to determine the performance of the s3-db code itself. More comprehensive tests will be done in the future for loading and saving of larger documents.

### 25 delete requests, of invalid records. bucket.delete()
| Environment | Average | Median | Total |
| -------- | ---- | ---- | ---- |
| Remote | 298.92 | 218 | 7486.5 |
| Lambda | 37.82 | 29 | 945.5 |

### 25 load requests, of the same document. bucket.load()
| Environment | Average | Median | Total |
| -------- | ---- | ---- | ---- |
| Remote | 221.5 | 215 | 5537.5 |
| Lambda | 28.4 | 22 | 710 |

### 25 save requests, of unique documents each time. bucket.save()
| Environment | Average | Median | Total |
| -------- | ---- | ---- | ---- |
| Remote | 221.5 | 215 | 6140.5 |
| Lambda | 59.14 | 40.5 | 1478.5 |

### 25 list requests, # of record pointers returned was between 70 and 100
| Environment | Average | Median | Total |
| -------- | ---- | ---- | ---- |
| Remote | 309.5 | 306.5 | 7747 |
| Lambda | 58.8 | 50 | 1472 |

### Load every document on a bucket.list() request via .get() on each record
| Environment | # of docs | Total Time| Average |
| -------- | ---- | ---- | ---- |
| Remote | 85.5 | 21701.5 | 256.5 |
| Lambda | 98 | 3280.5 | 33.6 |

### CRUD chain save(), modify, save(), reload(), delete()
| Environment | Average Total Time|
| -------- | -------- |
| Remote | 1369.5 |
| Lambda | 226 |
