#!/bin/bash
set -e

# Forcefully fix Apache MPM configuration at runtime
echo "Fixing Apache MPM configuration..."

# Remove all MPM module symlinks
rm -f /etc/apache2/mods-enabled/mpm_*.load
rm -f /etc/apache2/mods-enabled/mpm_*.conf

# Enable only mpm_prefork
ln -sf /etc/apache2/mods-available/mpm_prefork.load /etc/apache2/mods-enabled/mpm_prefork.load
ln -sf /etc/apache2/mods-available/mpm_prefork.conf /etc/apache2/mods-enabled/mpm_prefork.conf

echo "Apache MPM configuration fixed. Only mpm_prefork is enabled."

# Configure Apache to listen on Railway's PORT (default to 80 if not set)
export APACHE_PORT=${PORT:-80}
echo "Configuring Apache to listen on port $APACHE_PORT"

# Update ports.conf
sed -i "s/Listen 80/Listen $APACHE_PORT/g" /etc/apache2/ports.conf

# Update default VirtualHost
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:$APACHE_PORT>/g" /etc/apache2/sites-available/000-default.conf

echo "Apache configured to listen on port $APACHE_PORT"

# Start cron
cron

# Start Apache in foreground
exec apache2-foreground

