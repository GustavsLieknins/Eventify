<h1> Eventify </h1>

Eventify is a event finder. Type an artist, festival, or keyword, and it pulls concerts and other events, then helps you find necessities like: flights, hotels, and dates. It tracks popular searches, logs visits, and lets you save and share bookmarked events. A simple dashboard that has everything you need to plan for events starting from concerts to festivals.

How to run this project (terminal):

1. Opel up terminal

2. Go to your desired folder

3. git clone https://github.com/GustavsLieknins/Eventify.git

4. cd eventify

5. cd eventify

6. Open up any local database server of your choice, and go to that same file location and start it

7. Open 2 more terminals and go to that same location

8. In one of them type:

8.1. composer i

9. Open up any IDE of your choice and copy .env.example and paste it back in the same location as .env

10. Then in the same terminal that you did the composer i type this in - php artisan migrate

11. Then click continue

12. Then in any of the two terminals that you didnt do anything except go to file, type in it:

12.1. npm i

12.2 npm run dev

13. Then in the last free terminal type in:

13.1. php artisan queue:work database --queue=default -vvv

14. Then in the terminal you typed in this - composer i type in:

14.1. php artisan serve

And done!
