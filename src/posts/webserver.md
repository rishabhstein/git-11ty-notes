---
title: "Webserver"
cdate: 2024-09-04
date: Last Modified
---

Being a linux user, I am familiar with two webservers: [Apache](http://httpd.apache.org/) and [Nginx](https://nginx.org/en/). My struggle to set up this [encyclopedia](enkuklopedia) and my [[blog]] was mostly with Apache. So I will only discuss about it.

[Apache](http://httpd.apache.org/) can be setup two ways: the first one is to modify default case (000-default); the second way is to create a virtualcase. We will go for the latter one. To create the configuration of virtualsite, do following:
	
  > "sudo vim /etc/apache2/sites-available/virtualcase.conf"

The easies way is to copy "000-default.conf" and edit the entries inside. After searching hours on google where everyone seems to tell different things, the following worked on RaspberryPi.

	- DocumentRoot /path/to/site-dir

        > <Directory /path/to/site-dir>
          Options Indexes FollowSymLinks
          AllowOverride All
          Require all granted
         </Directory>

	- To execute CGI, I didnt understand how to do it
	- For "php" script 

        > <Directory /path/to/php-dir>
          Options FollowSymLinks
          DirectoryIndex index.php
          AllowOverride All   
         </Directory>

Now the settings are ready to enable the website. It is important to disable default one as the "localhost" link is the same for both default and virtual case. To disable default one the command is:
	
  > sudo a2dissite 000-default.conf

and to enable the created website.
	
  > sudo a2ensite	vitualcase.conf

After setting up, the most important thing is to check permission of the directory especially if apache gives 404 error.
