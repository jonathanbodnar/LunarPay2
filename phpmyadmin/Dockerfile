FROM phpmyadmin/phpmyadmin

# Set the ServerName to suppress the warning
RUN echo "ServerName localhost" >> /etc/apache2/apache2.conf

# Copy the custom php.ini file into the container
COPY phpmyadmin.ini /usr/local/etc/php/conf.d/phpmyadmin.ini

#Copy the custom configuration file to be prompt with the db user name and pass
#COPY config.inc.php /etc/phpmyadmin/config.inc.php