# Nginx Configuration Installation Guide

## Step-by-Step Instructions

### Step 1: Copy Content from nginx-config.conf

Open the file `nginx-config.conf` in this project and copy **ALL** its content.

### Step 2: Create Configuration File on Server

SSH into your server (43.224.137.27) and run:

```bash
# Navigate to nginx sites-available directory
cd /etc/nginx/sites-available

# Create the configuration file
sudo nano premium-calculator
```

### Step 3: Paste the Configuration

1. **Paste the entire content** from `nginx-config.conf` into the `premium-calculator` file
2. **Save the file**: Press `Ctrl+X`, then `Y`, then `Enter`

### Step 4: Enable the Site

```bash
# Create symlink to enable the site
sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/

# Remove default site (optional, but recommended)
sudo rm /etc/nginx/sites-enabled/default
```

### Step 5: Test Configuration

```bash
# Test nginx configuration syntax
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 6: Reload Nginx

```bash
# Reload nginx to apply changes
sudo systemctl reload nginx

# Or restart if reload doesn't work
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

### Step 7: Verify

```bash
# Check if nginx is listening on port 80
sudo netstat -tlnp | grep :80
# or
sudo ss -tlnp | grep :80

# Test from server
curl http://localhost/
curl http://localhost/comparison.html
```

## File Locations Summary

| File | Location | Purpose |
|------|----------|---------|
| **Source file** | `nginx-config.conf` (in project) | Template/Reference |
| **Server config** | `/etc/nginx/sites-available/premium-calculator` | Main configuration file |
| **Enabled link** | `/etc/nginx/sites-enabled/premium-calculator` | Symlink to enable site |

## Quick Copy-Paste Commands

If you want to do it all at once:

```bash
# On the server, run these commands:

# 1. Create the file (you'll paste content manually)
sudo nano /etc/nginx/sites-available/premium-calculator

# 2. After saving, enable it
sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# 3. Test and reload
sudo nginx -t && sudo systemctl reload nginx
```

## Alternative: Direct Copy Method

If you have the `nginx-config.conf` file on the server:

```bash
# Copy the file directly (if you uploaded it to server)
sudo cp /path/to/nginx-config.conf /etc/nginx/sites-available/premium-calculator

# Then enable it
sudo ln -s /etc/nginx/sites-available/premium-calculator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Important Notes

1. **File name**: The file must be named `premium-calculator` (no extension)
2. **Location**: Must be in `/etc/nginx/sites-available/`
3. **Permissions**: Should be readable by nginx (usually `root:root` with `644` permissions)
4. **Symlink**: The symlink in `sites-enabled/` is what actually enables the site

## Troubleshooting

### If nginx -t fails:
```bash
# Check the error message
sudo nginx -t

# Common issues:
# - Missing semicolon
# - Wrong syntax
# - Invalid path
```

### If site doesn't work:
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check your specific error log
sudo tail -f /var/log/nginx/premium-calculator-error.log
```

### Verify the file was created correctly:
```bash
# Check if file exists
ls -la /etc/nginx/sites-available/premium-calculator

# View the file content
cat /etc/nginx/sites-available/premium-calculator

# Check if symlink exists
ls -la /etc/nginx/sites-enabled/premium-calculator
```

