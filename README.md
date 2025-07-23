+ **环境**  
安装 nodejs 18 、 yarn、mysql 和 python。  
+ **前端**  
安装： ```yarn install```  
运行： ```yarn dev```  
调试： http://localhost:3000/  
+ **后端**  
安装：```pip install fastapi uvicorn sqlalchemy pymysql passlib[bcrypt]```  
运行：```uvicorn main:app --reload --host 0.0.0.0 --port 8000```  
调试： http://localhost:8000/docs#/  
+ **数据库**  
建数据库 SocraticMind；  
建表:  
  ```
  CREATE TABLE `users` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(64) NOT NULL UNIQUE,
    `password` VARCHAR(128) NOT NULL,
    PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;  
  CREATE TABLE `conversations` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `user_id` INT, `title` VARCHAR(255),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`), KEY `user_id` (`user_id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;  
  CREATE TABLE `messages` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `conversation_id` INT,
    `role` VARCHAR(20) NOT NULL,
    `content` TEXT, `created_at` DATETIME, PRIMARY KEY (`id`) ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  ```
