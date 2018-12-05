Scalinkd Distributed Python IDE
===============================


**Installation**
************

In order to install and configure as contributor/coordinator node, ensure the following prerequisites:

1) Anaconda V > 5.0
2) Cloned local source of repository

...and that's that.

The purpose of this implementation is to allow for the least dependant replication requirement. The conda environment contains
heirarchical file orientation and package requirements, and allows for overriding entirely local processed configuration. Simply remove the conda env (Scalinkd) to rid the installation and all requirements entirely.

For the sake of testing this beta implementation, it is required that all installation and operation occur via a Unix system. For Windows users, this can be avhieved through a Linux VM. 

Linux installation and server initialization (coordinator configuration):

    - Follow Anaconda installation instructions here: https://www.digitalocean.com/community/tutorials/how-to-install-the-anaconda-python-distribution-on-ubuntu-16-04
    - "git clone https://github.com/bradyjibanez/Scalinkd.git" (clone application source content)
    - "cd Scalinkd" (ls to ensure that Scalinkd.yaml exists)
    - "conda env update -f=Scalinkd.yaml"
    - "conda activate Scalinkd"
    - "cd src"
    - "python manage.py runserver"
    - Server runs at 127.0.0.1:8000. Check browser to begin distributed python coding!
    
Redis installation and activation:

    - wget http://download.redis.io/redis-stable.tar.gz
    - tar xvzf redis-stable.tar.gz
    - cd redis-stable
    - make
    - redis-server
   
 Redis installation will take a fair amount of time in a Linux VM

**Operation**
*********

Operation outlined here is for contributor/coordinator node operation. Thus far in development, there is only potential for these types of nodes to operate. Further development will include sole contributor node operation:




