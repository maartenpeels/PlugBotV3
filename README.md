Plug.DJ Moderation Bot
==========================
Written by Maarten Peels


**If you have any issues with the bot you want to bring up with me, then open an issue on the issues tab above.**

#Overview
This bot is written to help:

1. Automate certain aspects of room moderation
2. Provide moderators additional tools to make their job easier
3. Track certain room statistics to optimize DJing experience (AFK status, disconnect logs, play history)

#Bot Features
--------------

###Bot Automation
####Local Storage
*The bot will save all it's data. When you turn off the bot, and back on again, all the settings will be loaded, also the disconnect-log, user info, history etc.

####AFK Monitor
*When a user is on the waitlist and is not active(sending chat messages), he/she will be notified 2 times, and will then be removed from the waitlist.

####History
*When a new DJ starts playing, all the info from the last will be added to a list. It will keep track of the user, the song, and the woots/mehs/curates

####Disconnect-log
*When a user disconnects, he/she will be added to a list, with the time of disconnect and waitlist position. This will be used by the 'dclookup' command

####User info
*The bot keeps track of some user info, if he/she is in the room or not, afk warnings, etc.

###Bot Commands
####Temporary(will update readme)
addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith' }


afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith' }


afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact' }


afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith' }


afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith' }


autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact' }


autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact' }


banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith' }


blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith' }


clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact' }


commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact' }


cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith' }


cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact' }


voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith' }


togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact' }


dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith' }


emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact' }


etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith' }


filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact' }


helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact' }


joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact' }


jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith' }


kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith' }


killCommand: {
                command: 'kill',
                rank: 'manager',
                type: 'exact' }


leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact' }


linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact' }


lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact' }


lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith' }


lockskipposCommand: {
                command: 'lockskippos',
                rank: 'manager',
                type: 'startsWith' }


maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith' }


moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith' }


muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith' }


pingCommand: {
                command: 'ping',
                rank: 'bouncer',
                type: 'exact' }


reloadCommand: {
                command: 'reload',
                rank: 'manager',
                type: 'exact' }


removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith' }


restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact' }


rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact' }


sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact' }


skipCommand: {
                command: 'skip',
                rank: 'bouncer',
                type: 'exact' }


songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact' }


sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact' }


statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact' }


swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith' }


toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact' }


unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith' }


unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact' }


unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith' }


usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith' }


usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact' }


voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith' }


welcomeCommand: {
                command: 'welcome',
                rank: 'mod',
                type: 'exact' }
 
 
 clearlistCommand: {
                command: 'clearlist',
                rank: 'manager',
                type: 'startsWith' }
#How to run
------------------------------
To run the script in your webbrowser, you would have to make a new bookmark with the path to your `bot.js` file from, you can simply type:

```Javascript
javascript:$.getScript('[YOUR INCLUDE LOCATION]');
```

Into the bookmark url.  My file is usually on rawgit (https://rawgit.com), so my include would be:

```Javascript
javascript:$.getScript('https://rawgit.com/maartenpeels/PlugBotV3/master/bot.js');
```

That's all!
