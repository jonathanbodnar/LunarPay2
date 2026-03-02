FROM php:7.4.7-apache

RUN sed -i 's/deb.debian.org/archive.debian.org/g' /etc/apt/sources.list \
 && sed -i 's/security.debian.org/archive.debian.org/g' /etc/apt/sources.list \
 && echo 'Acquire::Check-Valid-Until "false";' > /etc/apt/apt.conf.d/99no-check-valid-until

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libpq-dev \
    unzip \
    zip \
    git \
    cron \
    tzdata \
    && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd zip pdo pdo_mysql pdo_pgsql mysqli bcmath 

# Set timezone system-wide
ENV TZ=America/Chicago
RUN ln -sf /usr/share/zoneinfo/$TZ /etc/localtime \
    && echo $TZ > /etc/timezone

# Enable Apache mod_rewrite and fix MPM configuration
RUN a2dismod mpm_event mpm_worker && \
    a2enmod mpm_prefork rewrite

# Set working dir
WORKDIR /var/www/html

# Copy all app files
COPY . .

# Set correct permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/application/uploads \
    && chmod -R 755 /var/www/html/application/logs \
    && chmod -R 775 /var/www/html/application/migrations

# PHP config
COPY php.ini /usr/local/etc/php/conf.d/

# Install Composer dependencies
RUN composer install --no-dev --optimize-autoloader --working-dir=/var/www/html/application

# Install Node.js 23.x and build frontend
RUN curl -fsSL https://deb.nodesource.com/setup_23.x | bash - \
    && apt-get install -y nodejs

ARG fortis_environment

RUN if [ "$fortis_environment" = "prd" ]; then \
      npm install --prefix /var/www/html/customer-hub && \
      npm run build --prefix /var/www/html/customer-hub; \
    else \
      npm install --prefix /var/www/html/customer-hub && \
      npm run build-staging --prefix /var/www/html/customer-hub; \
    fi

# Cron setup
COPY cronjob /etc/cron.d/my-cron-job
RUN chmod 0644 /etc/cron.d/my-cron-job \
    && crontab /etc/cron.d/my-cron-job

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Drop privileges for runtime verifyx 
#USER www-data

# Expose Apache (PORT can be overridden by environment variable)
EXPOSE 80
ENV PORT=80

# Use custom entrypoint that fixes MPM at runtime
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
