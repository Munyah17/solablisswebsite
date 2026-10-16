# Solabliss - cPanel Deployment Guide

This guide covers deploying the Solabliss website on cPanel with PHP and MySQL.

## Prerequisites

- cPanel hosting account with PHP 7.4 or higher
- MySQL database access (via phpMyAdmin)
- FTP or File Manager access to upload files
- SSL certificate (recommended)

## Deployment Steps

### 1. Upload Files

Upload all files from the project directory to your cPanel folder. The location depends on your setup:

**Option A: Root domain (public_html)**
- Upload to: `public_html/`
- Access via: `https://yourdomain.com`

**Option B: Subdirectory (shared hosting)**
- Upload to: `public_html/solablisszimbabwe.co.zw/` (or your subdirectory name)
- Access via: `https://yourdomain.com/solablisszimbabwe.co.zw`

**Files to upload:**
```
[upload location]/
├── api/
│   ├── admin.php
│   ├── appliances.php
│   ├── auth.php
│   ├── estimate.php
│   ├── products.php
│   ├── projects.php
│   └── settings.php
├── css/
│   └── style.css
├── js/
│   ├── admin.js
│   ├── app.js
│   ├── contact.js
│   ├── estimator.js
│   ├── home.js
│   ├── portal.js
│   ├── products.js
│   ├── projects.js
│   ├── services.js
│   └── sizing.js
├── img/
│   ├── hero-solar.jpg
│   ├── logo.jpg
│   ├── panel-array.jpg
│   ├── proj-commercial.jpg
│   ├── proj-consulting.jpg
│   ├── proj-domestic.jpg
│   ├── proj-industrial.jpg
│   ├── sunset-panels.jpg
│   └── uploads/
├── .htaccess
├── admin.html
├── config.php
├── contact.html
├── database.sql
├── estimator.html
├── estimator.php
├── index.html
├── portal.html
├── products.html
├── projects.html
├── seed.php
├── services.html
├── sizing.html
├── DEPLOYMENT.md
└── README.md
```

**Important:** The `.htaccess` file should be in the same directory as `api/`, `css/`, `js/`, and the HTML files.

### 1b. Configure .htaccess for Subdirectory

If installing in a subdirectory (not root), edit `.htaccess` and uncomment the RewriteBase line:

```apache
# Set base directory (uncomment if installed in subdirectory like /solablisszimbabwe.co.zw)
RewriteBase /solablisszimbabwe.co.zw
```

Replace `/solablisszimbabwe.co.zw` with your actual subdirectory path.

### 2. Create MySQL Database

1. Log in to cPanel
2. Go to **MySQL® Databases**
3. Create a new database (e.g., `solabliss_db`)
4. Create a new database user with a strong password
5. Add the user to the database with **ALL PRIVILEGES**

### 3. Import Database Schema

1. Go to **phpMyAdmin** in cPanel
2. Select your newly created database
3. Click **Import** tab
4. Upload the `database.sql` file from the project
5. Click **Go** to import

This will create all required tables:
- users
- projects
- appliances
- quotes, quote_items
- invoices, invoice_items, payments
- messages
- settings
- leads
- products
- And more...

### 4. Configure Database Connection

Edit `config.php` in the root directory:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_actual_database_name');
define('DB_USER', 'your_actual_db_username');
define('DB_PASS', 'your_actual_db_password');
define('DB_CHARSET', 'utf8mb4');

// Secret key for JWT tokens (generate a random string)
define('JWT_SECRET', 'your-secret-key-change-this-in-production');

// Site configuration
define('SITE_URL', 'https://yourdomain.com');
define('UPLOAD_DIR', __DIR__ . '/public/img/uploads');
```

**Security:** Change `JWT_SECRET` to a random 32+ character string.

### 5. Seed Initial Data

Run the seeding script to populate initial data:

1. Open your browser and visit: `https://yourdomain.com/seed.php`
2. This will create:
   - Admin user (admin@solabliss.com / admin123)
   - Sample appliances
   - Sample projects
   - Sample products
   - Default settings
   - Sample leads and net metering data

3. **Important:** Delete `seed.php` and `database.sql` after successful seeding for security.

### 6. Secure Sensitive Files

The `.htaccess` file already protects sensitive files, but verify:
- `config.php` is not accessible via browser
- `seed.php` is deleted after use
- `database.sql` is deleted after use

### 7. Set File Permissions

Ensure proper permissions:

- Directories: `755`
- PHP files: `644`
- Upload directory (`public/img/uploads`): `755`

### 8. Test the Application

1. Visit your domain: `https://yourdomain.com`
2. Test public pages (Home, Services, Projects, Products)
3. Test sizing wizard and estimator
4. Access admin panel: `https://yourdomain.com/admin.html`
5. Login with: `admin@solabliss.com` / `admin123`
6. **Change the admin password immediately**

### 9. Configure SSL (Recommended)

1. In cPanel, go to **SSL/TLS Status**
2. Enable AutoSSL if available
3. Update `SITE_URL` in `config.php` to use `https://`
4. Uncomment the HTTPS redirect in `.htaccess`:
   ```apache
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

## Directory Structure After Deployment

```
public_html/
├── api/                    # PHP API endpoints
│   ├── admin.php          # Admin operations (users, quotes, invoices, etc.)
│   ├── appliances.php     # Appliance catalog
│   ├── auth.php           # Authentication (login, register, logout)
│   ├── estimate.php       # Solar estimator calculations
│   ├── products.php       # Product catalog
│   ├── projects.php       # Project portfolio
│   └── settings.php      # Site settings
├── public/                # Frontend files
│   ├── *.html            # HTML pages
│   ├── css/              # Stylesheets
│   ├── js/               # JavaScript files
│   └── img/              # Images
├── .htaccess             # Apache configuration
├── config.php            # Database & app configuration
└── estimator.php         # Estimation logic
```

## API Endpoints

### Public APIs
- `GET /api/products.php` - Get product catalog
- `GET /api/projects.php` - Get project portfolio
- `GET /api/settings.php` - Get site settings
- `GET /api/appliances.php` - Get appliance catalog
- `POST /api/estimate.php` - Run solar estimate
- `POST /api/auth.php?action=login` - User login
- `POST /api/auth.php?action=register` - User registration
- `POST /api/auth.php?action=logout` - User logout

### Admin APIs (requires authentication)
- `GET /api/admin.php?action=dashboard` - Dashboard stats
- `GET /api/admin.php?action=users` - List users
- `POST /api/admin.php?action=users` - Create user
- `PUT /api/admin.php?action=users/{id}` - Update user
- `DELETE /api/admin.php?action=users/{id}` - Delete user
- `GET /api/admin.php?action=quotes` - List quotes
- `POST /api/admin.php?action=quotes` - Create quote
- `GET /api/admin.php?action=invoices` - List invoices
- `POST /api/admin.php?action=invoices` - Create invoice
- `GET /api/admin.php?action=projects` - List projects (admin view)
- `POST /api/admin.php?action=projects` - Create/update project
- `GET /api/admin.php?action=products` - List products (admin view)
- `POST /api/admin.php?action=products` - Create/update product
- `GET /api/admin.php?action=leads` - List leads
- `POST /api/admin.php?action=leads` - Create lead
- `GET /api/admin.php?action=messages` - List messages
- `GET /api/admin.php?action=settings` - Get all settings
- `PUT /api/admin.php?action=settings` - Update setting

## Troubleshooting

### 500 Internal Server Error
- Check PHP error logs in cPanel
- Verify `config.php` has correct database credentials
- Ensure PHP version is 7.4 or higher
- Check file permissions

### Database Connection Failed
- Verify database name, username, and password in `config.php`
- Ensure database user has proper privileges
- Check that MySQL server is running

### API Returns 404
- Verify `.htaccess` is in the root directory
- Check that Apache `mod_rewrite` is enabled
- Ensure API files exist in `api/` directory

### Images Not Loading
- Check file paths in HTML/JS
- Verify `img/` directory exists in `public/`
- Check file permissions

## Security Checklist

- [ ] Changed default admin password
- [ ] Set strong `JWT_SECRET` in `config.php`
- [ ] Deleted `seed.php` after deployment
- [ ] Deleted `database.sql` after deployment
- [ ] Enabled SSL/HTTPS
- [ ] Verified `.htaccess` is protecting sensitive files
- [ ] Set proper file permissions
- [ ] Configured backups in cPanel

## Maintenance

### Regular Backups
- Use cPanel backup feature to schedule daily backups
- Export database via phpMyAdmin periodically
- Keep a copy of `database.sql` for reference

### Updating Content
- Projects, products, and settings can be updated via admin panel
- No code changes needed for content updates
- For code updates, re-upload modified files

### Monitoring
- Check cPanel error logs regularly
- Monitor disk space usage
- Review admin panel for new leads/messages

## Support

For issues or questions:
1. Check this documentation first
2. Review cPanel error logs
3. Verify database connection
4. Check PHP version and extensions

## Technical Stack

- **Backend:** PHP 7.4+
- **Database:** MySQL 5.7+ / MariaDB 10.3+
- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **Web Server:** Apache with mod_rewrite
- **Authentication:** PHP Sessions with token-based auth
