# Small Plates App

This project was built for one of my religion classes. I definitely went overboard but it got me an A. TLDR; this app allows you to journal and share certain entries with friends and family. To connect with others, it is intentionally manual to prevent a social media like attittude towards sharing.

## Features

### Journal Entries
Pretty simple journal entries. Allows for a title and the entry itself. Just plain old text. The cool part is that you can share individual entries with your friend list. 

### Connecting with Friends
This is my favorite part of the app. I didn't want this to turn into a blog. I wanted it to be a serious journaling app so I wanted to make it difficult to share entires with strangers. From the home page there is an option to "Connect". This then gives you the option to generate a code or enter a code. The way to connect with friends is to have one friend generate a code and the other enter the code. The code changes every 30 seconds so the other friend has to be entering the code live with the user. This should prevent someone from just posting their name or profile and having people beomce their friends. You actually have to know them and be able to speak with them live to connect. Once conncted they will appear in your share list. 

### Custom Console
At the time I trying out developing web apps on my Ipad. I had vscode running from my home server and was connecting to it through a PWA on my Ipad. Becuase of this interesting setup, I didn't have access to the browser console because I was using IpadOS Safari to view my preview app. I still needed something to give me basic logging so I can kinda debug my code. So I built my own. Press ctr + alt + c to open the custom console. I can log to it using the _console.log() command in my code and it will even evaluate js for you in the console it self. It will parse stack traces and is color coded for different primitives. Just enough for me to debug this small app.

### Authentification
Basic sign up and sign in. I have a quick sign in on the home page for my TA to quickly grade my assignment without having to make an account or set up entries. 

### Firebase
I'm using firebase as my BaaS. It is handling authentification and the database.