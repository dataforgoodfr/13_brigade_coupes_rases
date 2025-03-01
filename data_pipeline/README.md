## KeePass

- KeePass is the password manager used to store AWS credentials. These credentials are securely stored in the project's KeePass database.

- To use it, ensure that you have:

### The password for the KeePass file, stored in the `data_pipeline/.env` file locally  
### The KeePass file, stored locally  

- Once these requirements are met, launch the `PyKeePass.py` file. The variables `access_key` and `secret_key` will contain the AWS S3 bucket access and secret keys.  
