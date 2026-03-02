# Lunarpay Development Installation Guide

Lunarpay is a payment processing application built using CodeIgniter 3. 

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- [Docker](https://www.docker.com/get-started)
- [Docker Compose](https://docs.docker.com/compose/install/) 

## Steps to Install Lunarpay

1. **Clone the Repository**

   Clone the Lunarpay repository from GitHub (or your version control system):

   ```bash
   git clone https://github.com/MbizAI/LunarPay.git
   ```

2. **Navigate to the Project Directory**

   Change to the project directory:

   ```bash
   cd lunarpay
   ```
   Rename `application/config/secret_vault/application_secrets.env.example` to `application/config/secret_vault/application_secrets.env` 

3. **Build and Start the Docker Containers**

   Create a common network, for reaching this app from another container

   ```bash
   sudo docker network create common_network
   ```

   Use Docker Compose to build and start the application and database containers:

   ```bash
   sudo docker-compose -f docker-compose-local.yml up --build
   ```

   To stop the container
   ```bash
   sudo docker-compose -f docker-compose-local.yml down
   ```

   To start the container again:
   ```bash
   sudo docker-compose -f docker-compose-local.yml up
   ```

4. **Database and App configuration*

   Once the containers are running:

   1. Connect and create the database, use the database params in the .env.example file. 
      
      Import the SQL with initial data. Access phpmyadmin in your web browser:

        http://localhost:3002
   
   2. Install Dependencies with Composer Inside the Docker Container
        ```bash
        sudo docker exec -it lunarpay_app bash
        cd /var/www/html/application/
        composer install
        ```   
   3. Set permission to the www-data group for writting to the migrations and logs folders
        ```bash
        sudo docker exec -it lunarpay_app bash
        cd /var/www/html/application
        chown -R :www-data migrations/
        chown -R :www-data logs
        chown -R :www-data assets-versioning
        ```
   4. Access the Lunarpay application in your web browser:

        http://localhost:3001

5. **Using migrations for database structure updates**
      
   1. If you will update the database structure, create a migration file using: http://localhost:3001/utilities/migrate/create
      
      Modify the created migration file inside application/migrations/###.php

      Then

   2. Run migration: http://localhost:3001/utilities/migrate/run

## Additional Notes

- For issues or support, please contact the development team. 

## Customer HUB
## Customer HUB Frontend APP /customer-hub

### React + Vite inside CodeIgniter 3 — Routing Setup

This project runs a React + Vite frontend inside a CodeIgniter 3 PHP backend, under the path `/customer-hub`. This guide explains how routing is configured for both development and production environments.

---

## 🚧 Development Mode

### 🔧 Start the Dev Server

```bash
npm run dev
```

### 🔗 Dev URL

Access the app at:

```
http://localhost:5183/page1
```

✅ No need for `/customer-hub` in dev

---

### ⚙️ Dev Setup Summary

React Router is configured to detect the environment:

```jsx
<BrowserRouter basename={import.meta.env.MODE === 'production' ? '/customer-hub' : '/'}> 
```

Vite config sets the correct base:

```js
base: mode === 'production' ? '/customer-hub' : '/'
```

---

## 🚀 Production Build

```bash
npm run build
```

> package.json "build" script:
```json
"build": "tsc -b && vite build && cp .htaccess_dist dist/.htaccess"
```

This outputs static files to:

```
/customer-hub/dist
```

The `.htaccess_dist` file is copied automatically into `dist/` as part of the build.

---

## 📁 .htaccess Files

### 🔝 Root `.htaccess` (CodeIgniter)

Located at `/`, we only added this line to exclude the React app folder from being handled by CodeIgniter routes:

```apache
RewriteCond %{REQUEST_URI} !^/customer-hub/
```

---

### 📂 `/customer-hub/.htaccess`

This file removes the `dist` folder from the public URL and ensures requests are forwarded to the built app in `/dist`. It does not handle React routing.

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /customer-hub/

  # Redirect root /customer-hub to /customer-hub/dist/
  RewriteRule ^$ dist/ [L]

  # Serve static files from dist/assets/
  RewriteRule ^assets/(.*)$ dist/assets/$1 [L]

  # Serve existing files/folders directly
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Rewrite everything else to the React app
  RewriteRule ^ dist/index.html [L]
</IfModule>
```

---

### 📂 `/customer-hub/.htaccess_dist`

This file is used inside the built React app folder (`dist/`). It enables React Router to handle internal routes like `/customer-hub/page1` in production. It assumes the request has already been redirected here via `/customer-hub/.htaccess`.

It is automatically copied to `dist/.htaccess` during the build process.

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /customer-hub/

  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteRule ^ index.html [L]
</IfModule>
```