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
+ **改动by junqi**
1.修改了主题样式，包括部分文字和主题颜色，主题颜色可以在styles/globals.scss中找到，主要为primary和second的颜色；
2.修改了chat.ts的部分逻辑，主要会让第一次对话先生成解题步骤，后续对话都会使用这个解题步骤，保存在session.problemFramework中；
3.增删了预设面具，主要添加了自定义的苏格拉底导师，提示词等可见public/masks.json；  