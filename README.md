<h1> Eventify </h1>

Eventify is a event finder. Type an artist, festival, or keyword, and it pulls concerts and other events, then helps you find necessities like: flights, hotels, and dates. It tracks popular searches, logs visits, and lets you save and share bookmarked events. A simple dashboard that has everything you need to plan for events starting from concerts to festivals.

How to run this project (terminal):

1. Open up your terminal

2. Go to your desired folder

3. git clone https://github.com/GustavsLieknins/Eventify.git

4. cd eventify

5. Open up any local database server of your choice, and go to that same file location and start it

6. Open one more terminal and go to that same location

7. In it type:

7.1. composer i

8. Open up any IDE of your choice and copy .env.example and paste it back in the same location as .env

9. Then in the same terminal that you did the composer i type this in - php artisan migrate --seed

10. Then click continue

11. Then in the last terminal that you didnt do anything except go to file, type in it:

11.1. npm i

11.2 npm run dev

12. Then in the terminal you typed in this - composer i type in:

12.1. php artisan serve

And done!

For now this project only works for bigger cities, like London, New York, Krakow and others (this is specificaly for flights search).

<h2>Login info</h2>
<h3>Regular User: </h3>
Email: <code>user@user.com</code>
Password: <code>user123</code>
</br>
<h3>Site Admin: </h3>
Email: <code>admin@admin.com</code>
Password: <code>adminadmin</code>
</br>
<h3>Super Admin: </h3>
Email: <code>superadmin@superadmin.com</code>
Password: <code>superadmin</code>
