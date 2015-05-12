(function () {
    //DEBUG FUNCTION
    API.sendChat = function(message){
        console.debug(message);
        return -1;
    };

    API.getWaitListPosition = function(id){
        if(typeof id === 'undefined' || id === null){
            id = API.getUser().id;
        }
        var wl = API.getWaitList();
        for(var i = 0; i < wl.length; i++){
            if(wl[i].id === id){
                return i;
            }
        }
        return -1;
    };

    var kill = function () {
        clearInterval(plugBot.room.afkInterval);
        plugBot.status = false;
    };

    var storeToStorage = function () {
        localStorage.setItem("plugBotsettings", JSON.stringify(plugBot.settings));
        localStorage.setItem("plugBotRoom", JSON.stringify(plugBot.room));
        var plugBotStorageInfo = {
            time: Date.now(),
            stored: true,
            version: plugBot.version
        };
        localStorage.setItem("plugBotStorageInfo", JSON.stringify(plugBotStorageInfo));

    };

    var subChat = function (chat, obj) {
        if (typeof chat === "undefined") {
            API.chatLog("There is a chat text missing.");
            console.log("There is a chat text missing.");
            return "[Error] No text message found.";
        }
        var lit = '%%';
        for (var prop in obj) {
            chat = chat.replace(lit + prop.toUpperCase() + lit, obj[prop]);
        }
        return chat;
    };

    var retrieveSettings = function () {
        var settings = JSON.parse(localStorage.getItem("plugBotsettings"));
        if (settings !== null) {
            for (var prop in settings) {
                plugBot.settings[prop] = settings[prop];
            }
        }
    };

    var retrieveFromStorage = function () {
        var info = localStorage.getItem("plugBotStorageInfo");
        if (info === null) API.chatLog("No previous data found.");
        else {
            var settings = JSON.parse(localStorage.getItem("plugBotsettings"));
            var room = JSON.parse(localStorage.getItem("plugBotRoom"));
            var elapsed = Date.now() - JSON.parse(info).time;
            if ((elapsed < 1 * 60 * 60 * 1000)) {
                API.chatLog("Retrieving previously stored data.");
                for (var prop in settings) {
                    plugBot.settings[prop] = settings[prop];
                }
                plugBot.room.users = room.users;
                plugBot.room.afkList = room.afkList;
                plugBot.room.historyList = room.historyList;
                plugBot.room.mutedUsers = room.mutedUsers;
                plugBot.room.autoskip = room.autoskip;
                plugBot.room.roomstats = room.roomstats;
                plugBot.room.messages = room.messages;
                plugBot.room.queue = room.queue;
                plugBot.room.newBlacklisted = room.newBlacklisted;
                API.chatLog("Previously stored data successfully retrieved.");
            }
        }
    };

    var botCreator = "Maarten Peels (m44rt3n)";
    var botCreatorIDs = ["4090016"];

    var plugBot = {
        version: "1.0",
        status: false,
        name: "plugBot",
        loggedInID: null,
        scriptLink: "https://rawgit.com/maartenpeels/PlugBotV3/master/bot.js",
        cmdLink: "https://rawgit.com/maartenpeels/PlugBotV3/master/README.md",
        retrieveSettings: retrieveSettings,
        retrieveFromStorage: retrieveFromStorage,
        settings: {
            botName: "plugBot",
            startupCap: 200, // 1-200
            startupVolume: 0, // 0-100
            startupEmoji: true, // true or false
            maximumAfk: 120,
            afkRemoval: false,
            maximumDc: 60,
            blacklistEnabled: false,
            voteSkip: true,
            voteSkipLimit: 10,
            timeGuard: true,
            maximumSongLength: 10,
            commandCooldown: 10,
            usercommandsEnabled: true,
            lockskipPosition: 3,
            lockskipReasons: [
                ["theme", "This song does not fit the room theme. "],
                ["op", "This song is on the OP list. "],
                ["history", "This song is in the history. "],
                ["mix", "You played a mix, which is against the rules. "],
                ["sound", "The song you played had bad sound quality or no sound. "],
                ["nsfw", "The song you contained was NSFW (image or sound). "],
                ["unavailable", "The song you played was not available for some users. "]
            ],
            afkpositionCheck: 15,
            afkRankCheck: "ambassador",
            filterChat: true,
            etaRestriction: false,
            welcome: false,
            songstats: true,
            commandLiteral: "!",
        },
        room: {
            users: [],
            afkList: [],
            mutedUsers: [],
            bannedUsers: [],
            skippable: true,
            usercommand: true,
            allcommand: true,
            afkInterval: null,
            autoskip: true,
            autoskipTimer: null,
            queueing: 0,
            queueable: true,
            currentDJID: null,
            historyList: [],
            cycleTimer: setTimeout(function () {
            }, 1),
            roomstats: {
                accountName: null,
                totalWoots: 0,
                totalCurates: 0,
                totalMehs: 0,
                launchTime: null,
                songCount: 0,
                chatmessages: 0
            },
            messages: {
                from: [],
                to: [],
                message: []
            },
            queue: {
                id: [],
                position: []
            },
            blacklists: {

            },
            newBlacklisted: [],
            newBlacklistedSongFunction: null,
            roulette: {
                rouletteStatus: false,
                participants: [],
                countdown: null,
                startRoulette: function () {
                    plugBot.room.roulette.rouletteStatus = true;
                    plugBot.room.roulette.countdown = setTimeout(function () {
                        plugBot.room.roulette.endRoulette();
                    }, 20 * 1000);
                    API.sendChat("/me The roulette is now open! Type !join to participate, you have 20 seconds!");
                },
                endRoulette: function () {
                    plugBot.room.roulette.rouletteStatus = false;
                    var ind = Math.floor(Math.random() * plugBot.room.roulette.participants.length);
                    var winner = plugBot.room.roulette.participants[ind];
                    plugBot.room.roulette.participants = [];
                    var pos = Math.floor((Math.random() * API.getWaitList().length) + 1);
                    var user = plugBot.userUtilities.lookupUser(winner);
                    var name = user.username;
                    API.sendChat(subChat("/me A winner has been picked! the lucky one is @%%NAME%%, he/she will be set to position %%POSITION%%.", {name: name, position: pos}));
                    setTimeout(function (winner, pos) {
                        plugBot.userUtilities.moveUser(winner, pos, false);
                    }, 1 * 1000, winner, pos);
                }
            }
        },
        User: function (id, name) {
            this.id = id;
            this.username = name;
            this.jointime = Date.now();
            this.lastActivity = Date.now();
            this.votes = {
                woot: 0,
                meh: 0,
                curate: 0
            };
            this.lastEta = null;
            this.afkWarningCount = 0;
            this.afkCountdown = null;
            this.inRoom = true;
            this.isMuted = false;
            this.lastDC = {
                time: null,
                position: null,
                songCount: 0
            };
            this.lastKnownPosition = null;
            this.lastSlotsTime = null;
            this.lostSlots = 0;
        },
         userUtilities: {
            getJointime: function (user) {
                return user.jointime;
            },
            getUser: function (user) {
                return API.getUser(user.id);
            },
            updatePosition: function (user, newPos) {
                user.lastKnownPosition = newPos;
            },
            updateDC: function (user) {
                user.lastDC.time = Date.now();
                user.lastDC.position = user.lastKnownPosition;
                user.lastDC.songCount = plugBot.room.roomstats.songCount;
            },
            setLastActivity: function (user) {
                user.lastActivity = Date.now();
                user.afkWarningCount = 0;
                clearTimeout(user.afkCountdown);
            },
            getLastActivity: function (user) {
                return user.lastActivity;
            },
            getWarningCount: function (user) {
                return user.afkWarningCount;
            },
            setWarningCount: function (user, value) {
                user.afkWarningCount = value;
            },
            lookupUser: function (id) {
                for (var i = 0; i < plugBot.room.users.length; i++) {
                    if (plugBot.room.users[i].id === id) {
                        return plugBot.room.users[i];
                    }
                }
                return false;
            },
            lookupUserName: function (name) {
                for (var i = 0; i < plugBot.room.users.length; i++) {
                    var match = plugBot.room.users[i].username.trim() == name.trim();
                    if (match) {
                        return plugBot.room.users[i];
                    }
                }
                return false;
            },
            voteRatio: function (id) {
                var user = plugBot.userUtilities.lookupUser(id);
                var votes = user.votes;
                if (votes.meh === 0) votes.ratio = 1;
                else votes.ratio = (votes.woot / votes.meh).toFixed(2);
                return votes;

            },
            getPermission: function (obj) { //1 requests
                var u;
                if (typeof obj === "object") u = obj;
                else u = API.getUser(obj);
                for (var i = 0; i < botCreatorIDs.length; i++) {
                    if (botCreatorIDs[i].indexOf(u.id) > -1) return 10;
                }
                if (u.gRole < 2) return u.role;
                else {
                    switch (u.gRole) {
                        case 2:
                            return 7;
                        case 3:
                            return 8;
                        case 4:
                            return 9;
                        case 5:
                            return 10;
                    }
                }
                return 0;
            },
            moveUser: function (id, pos, priority) {
                var user = plugBot.userUtilities.lookupUser(id);
                var wlist = API.getWaitList();
                if (API.getWaitListPosition(id) === -1) {
                    if (wlist.length < 50) {
                        API.moderateAddDJ(id);
                        if (pos !== 0) setTimeout(function (id, pos) {
                            API.moderateMoveDJ(id, pos);
                        }, 1250, id, pos);
                    }
                    else {
                        var alreadyQueued = -1;
                        for (var i = 0; i < plugBot.room.queue.id.length; i++) {
                            if (plugBot.room.queue.id[i] === id) alreadyQueued = i;
                        }
                        if (alreadyQueued !== -1) {
                            plugBot.room.queue.position[alreadyQueued] = pos;
                            return API.sendChat(subChat("/me User is already being added! Changed the desired position to %%POSITION%%.", {position: plugBot.room.queue.position[alreadyQueued]}));
                        }
                        plugBot.roomUtilities.booth.lockBooth();
                        if (priority) {
                            plugBot.room.queue.id.unshift(id);
                            plugBot.room.queue.position.unshift(pos);
                        }
                        else {
                            plugBot.room.queue.id.push(id);
                            plugBot.room.queue.position.push(pos);
                        }
                        var name = user.username;
                        return API.sendChat(subChat("/me Added @%%NAME%% to the queue. Current queue: %%POSITION%%.", {name: name, position: plugBot.room.queue.position.length}));
                    }
                }
                else API.moderateMoveDJ(id, pos);
            },
            dclookup: function (id) {
                var user = plugBot.userUtilities.lookupUser(id);
                if (typeof user === 'boolean') return "/me User not found.";
                var name = user.username;
                if (user.lastDC.time === null) return subChat("/me @%%NAME%% did not disconnect during my time here.", {name: name});
                var dc = user.lastDC.time;
                var pos = user.lastDC.position;
                if (pos === null) return "/me No last position known. The waitlist needs to update at least once to register a user's last position.";
                var timeDc = Date.now() - dc;
                var validDC = false;
                if (plugBot.settings.maximumDc * 60 * 1000 > timeDc) {
                    validDC = true;
                }
                var time = plugBot.roomUtilities.msToStr(timeDc);
                if (!validDC) return (subChat("/me @%%NAME%%'s last disconnect (DC or leave) was too long ago: %%TIME%%.", {name: plugBot.userUtilities.getUser(user).username, time: time}));
                var songsPassed = plugBot.room.roomstats.songCount - user.lastDC.songCount;
                var afksRemoved = 0;
                var afkList = plugBot.room.afkList;
                for (var i = 0; i < afkList.length; i++) {
                    var timeAfk = afkList[i][1];
                    var posAfk = afkList[i][2];
                    if (dc < timeAfk && posAfk < pos) {
                        afksRemoved++;
                    }
                }
                var newPosition = user.lastDC.position - songsPassed - afksRemoved;
                if (newPosition <= 0) newPosition = 1;
                var msg = subChat("/me @%%NAME%% disconnected %%TIME%% ago and should be at position %%POSITION%%.", {name: plugBot.userUtilities.getUser(user).username, time: time, position: newPosition});
                plugBot.userUtilities.moveUser(user.id, newPosition, true);
                return msg;
            }
        },
        roomUtilities: {
            rankToNumber: function (rankString) {
                var rankInt = null;
                switch (rankString) {
                    case "admin":
                        rankInt = 10;
                        break;
                    case "ambassador":
                        rankInt = 7;
                        break;
                    case "host":
                        rankInt = 5;
                        break;
                    case "cohost":
                        rankInt = 4;
                        break;
                    case "manager":
                        rankInt = 3;
                        break;
                    case "bouncer":
                        rankInt = 2;
                        break;
                    case "residentdj":
                        rankInt = 1;
                        break;
                    case "user":
                        rankInt = 0;
                        break;
                }
                return rankInt;
            },
            msToStr: function (msTime) {
                var ms, msg, timeAway;
                msg = '';
                timeAway = {
                    'days': 0,
                    'hours': 0,
                    'minutes': 0,
                    'seconds': 0
                };
                ms = {
                    'day': 24 * 60 * 60 * 1000,
                    'hour': 60 * 60 * 1000,
                    'minute': 60 * 1000,
                    'second': 1000
                };
                if (msTime > ms.day) {
                    timeAway.days = Math.floor(msTime / ms.day);
                    msTime = msTime % ms.day;
                }
                if (msTime > ms.hour) {
                    timeAway.hours = Math.floor(msTime / ms.hour);
                    msTime = msTime % ms.hour;
                }
                if (msTime > ms.minute) {
                    timeAway.minutes = Math.floor(msTime / ms.minute);
                    msTime = msTime % ms.minute;
                }
                if (msTime > ms.second) {
                    timeAway.seconds = Math.floor(msTime / ms.second);
                }
                if (timeAway.days !== 0) {
                    msg += timeAway.days.toString() + 'd';
                }
                if (timeAway.hours !== 0) {
                    msg += timeAway.hours.toString() + 'h';
                }
                if (timeAway.minutes !== 0) {
                    msg += timeAway.minutes.toString() + 'm';
                }
                if (timeAway.minutes < 1 && timeAway.hours < 1 && timeAway.days < 1) {
                    msg += timeAway.seconds.toString() + 's';
                }
                if (msg !== '') {
                    return msg;
                } else {
                    return false;
                }
            },
            booth: {
                lockTimer: setTimeout(function () {
                }, 1000),
                locked: false,
                lockBooth: function () {
                    API.moderateLockWaitList(!plugBot.roomUtilities.booth.locked);
                    plugBot.roomUtilities.booth.locked = false;
                    if (plugBot.settings.lockGuard) {
                        plugBot.roomUtilities.booth.lockTimer = setTimeout(function () {
                            API.moderateLockWaitList(plugBot.roomUtilities.booth.locked);
                        }, plugBot.settings.maximumLocktime * 60 * 1000);
                    }
                },
                unlockBooth: function () {
                    API.moderateLockWaitList(plugBot.roomUtilities.booth.locked);
                    clearTimeout(plugBot.roomUtilities.booth.lockTimer);
                }
            },
            afkCheck: function () {
                if (!plugBot.status || !plugBot.settings.afkRemoval) return void (0);
                var rank = plugBot.roomUtilities.rankToNumber(plugBot.settings.afkRankCheck);
                var djlist = API.getWaitList();
                var lastPos = Math.min(djlist.length, plugBot.settings.afkpositionCheck);
                if (lastPos - 1 > djlist.length) return void (0);
                for (var i = 0; i < lastPos; i++) {
                    if (typeof djlist[i] !== 'undefined') {
                        var id = djlist[i].id;
                        var user = plugBot.userUtilities.lookupUser(id);
                        if (typeof user !== 'boolean') {
                            var plugUser = plugBot.userUtilities.getUser(user);
                            if (rank !== null && plugBot.userUtilities.getPermission(plugUser) <= rank) {
                                var name = plugUser.username;
                                var lastActive = plugBot.userUtilities.getLastActivity(user);
                                var inactivity = Date.now() - lastActive;
                                var time = plugBot.roomUtilities.msToStr(inactivity);
                                var warncount = user.afkWarningCount;
                                if (inactivity > plugBot.settings.maximumAfk * 60 * 1000) {
                                    if (warncount === 0) {
                                        API.sendChat(subChat("/me @%%NAME%%, you have been afk for %%TIME%%, please respond within 2 minutes or you will be removed.", {name: name, time: time}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 1;
                                        }, 90 * 1000, user);
                                    }
                                    else if (warncount === 1) {
                                        API.sendChat(subChat("/me @%%NAME%%, you will be removed due to AFK soon if you don't respond.", {name: name}));
                                        user.afkWarningCount = 3;
                                        user.afkCountdown = setTimeout(function (userToChange) {
                                            userToChange.afkWarningCount = 2;
                                        }, 30 * 1000, user);
                                    }
                                    else if (warncount === 2) {
                                        var pos = API.getWaitListPosition(id);
                                        if (pos !== -1) {
                                            pos++;
                                            plugBot.room.afkList.push([id, Date.now(), pos]);
                                            user.lastDC = {

                                                time: null,
                                                position: null,
                                                songCount: 0
                                            };
                                            API.moderateRemoveDJ(id);
                                            API.sendChat(subChat("/me @%%NAME%%, you have been removed for being afk for %%TIME%%. You were at position %%POSITION%%. Chat at least once every %%MAXIMUMAFK%% minutes if you want to play a song.", {name: name, time: time, position: pos, maximumafk: plugBot.settings.maximumAfk}));
                                        }
                                        user.afkWarningCount = 0;
                                    }
                                }
                            }
                        }
                    }
                }
            },
            updateBlacklists: function () {
                for (var bl in plugBot.settings.blacklists) {
                    plugBot.room.blacklists[bl] = [];
                    if (typeof plugBot.settings.blacklists[bl] === 'function') {
                        plugBot.room.blacklists[bl] = plugBot.settings.blacklists();
                    }
                    else if (typeof plugBot.settings.blacklists[bl] === 'string') {
                        if (plugBot.settings.blacklists[bl] === '') {
                            continue;
                        }
                        try {
                            (function (l) {
                                $.get(plugBot.settings.blacklists[l], function (data) {
                                    if (typeof data === 'string') {
                                        data = JSON.parse(data);
                                    }
                                    var list = [];
                                    for (var prop in data) {
                                        if (typeof data[prop].mid !== 'undefined') {
                                            list.push(data[prop].mid);
                                        }
                                    }
                                    plugBot.room.blacklists[l] = list;
                                })
                            })(bl);
                        }
                        catch (e) {
                            API.chatLog('Error setting' + bl + 'blacklist.');
                            console.log('Error setting' + bl + 'blacklist.');
                            console.log(e);
                        }
                    }
                }
            },
            logNewBlacklistedSongs: function () {
                if (typeof console.table !== 'undefined') {
                    console.table(plugBot.room.newBlacklisted);
                }
                else {
                    console.log(plugBot.room.newBlacklisted);
                }
            },
            exportNewBlacklistedSongs: function () {
                var list = {};
                for (var i = 0; i < plugBot.room.newBlacklisted.length; i++) {
                    var track = plugBot.room.newBlacklisted[i];
                    list[track.list] = [];
                    list[track.list].push({
                        title: track.title,
                        author: track.author,
                        mid: track.mid
                    });
                }
                return list;
            }
        },
        eventChat: function (chat) {
            chat.message = chat.message.trim();
            for (var i = 0; i < plugBot.room.users.length; i++) {
                if (plugBot.room.users[i].id === chat.uid) {
                    plugBot.userUtilities.setLastActivity(plugBot.room.users[i]);
                    if (plugBot.room.users[i].username !== chat.un) {
                        plugBot.room.users[i].username = chat.un;
                    }
                }
            }
            if (plugBot.chatUtilities.chatFilter(chat)) return void (0);
            if (!plugBot.chatUtilities.commandCheck(chat))
                plugBot.chatUtilities.action(chat);
        },
        eventUserjoin: function (user) {
            var known = false;
            var index = null;
            for (var i = 0; i < plugBot.room.users.length; i++) {
                if (plugBot.room.users[i].id === user.id) {
                    known = true;
                    index = i;
                }
            }
            var greet = true;
            var welcomeback = null;
            if (known) {
                plugBot.room.users[index].inRoom = true;
                var u = plugBot.userUtilities.lookupUser(user.id);
                var jt = u.jointime;
                var t = Date.now() - jt;
                if (t < 10 * 1000) greet = false;
                else welcomeback = true;
            }
            else {
                plugBot.room.users.push(new plugBot.User(user.id, user.username));
                welcomeback = false;
            }
            for (var j = 0; j < plugBot.room.users.length; j++) {
                if (plugBot.userUtilities.getUser(plugBot.room.users[j]).id === user.id) {
                    plugBot.userUtilities.setLastActivity(plugBot.room.users[j]);
                    plugBot.room.users[j].jointime = Date.now();
                }

            }
            if (plugBot.settings.welcome && greet) {
                welcomeback ?
                    setTimeout(function (user) {
                        API.sendChat(subChat("/me Welcome back, %%NAME%%", {name: user.username}));
                    }, 1 * 1000, user)
                    :
                    setTimeout(function (user) {
                        API.sendChat(subChat("/me Welcome %%NAME%%", {name: user.username}));
                    }, 1 * 1000, user);
            }
        },
        eventUserleave: function (user) {
            for (var i = 0; i < plugBot.room.users.length; i++) {
                if (plugBot.room.users[i].id === user.id) {
                    plugBot.userUtilities.updateDC(plugBot.room.users[i]);
                    plugBot.room.users[i].inRoom = false;
                }
            }
        },
        eventVoteupdate: function (obj) {
            for (var i = 0; i < plugBot.room.users.length; i++) {
                if (plugBot.room.users[i].id === obj.user.id) {
                    if (obj.vote === 1) {
                        plugBot.room.users[i].votes.woot++;
                    }
                    else {
                        plugBot.room.users[i].votes.meh++;
                    }
                }
            }

            var mehs = API.getScore().negative;
            var woots = API.getScore().positive;
            var dj = API.getDJ();

            if (plugBot.settings.voteSkip) {
                if ((mehs - woots) >= (plugBot.settings.voteSkipLimit)) {
                    API.sendChat(subChat("/me @%%NAME%%, your song has exceeded the voteskip limit (%%LIMIT%% mehs).", {name: dj.username, limit: plugBot.settings.voteSkipLimit}));
                    API.moderateForceSkip();
                }
            }

        },
        eventCurateupdate: function (obj) {
            for (var i = 0; i < plugBot.room.users.length; i++) {
                if (plugBot.room.users[i].id === obj.user.id) {
                    plugBot.room.users[i].votes.curate++;
                }
            }
        },
        eventDjadvance: function (obj) {
            $("#woot").click();
            var user = plugBot.userUtilities.lookupUser(obj.dj.id)
            for(var i = 0; i < plugBot.room.users.length; i++){
                if(plugBot.room.users[i].id === user.id){
                    plugBot.room.users[i].lastDC = {
                        time: null,
                        position: null,
                        songCount: 0
                    };
                }
            }

            var lastplay = obj.lastPlay;
            if (typeof lastplay === 'undefined') return;
            if (plugBot.settings.songstats) {
                    API.sendChat(subChat("/me %%ARTIST%% - %%TITLE%%: %%WOOTS%%W/%%GRABS%%G/%%MEHS%%M.", {artist: lastplay.media.author, title: lastplay.media.title, woots: lastplay.score.positive, grabs: lastplay.score.grabs, mehs: lastplay.score.negative}))
            }
            plugBot.room.roomstats.totalWoots += lastplay.score.positive;
            plugBot.room.roomstats.totalMehs += lastplay.score.negative;
            plugBot.room.roomstats.totalCurates += lastplay.score.grabs;
            plugBot.room.roomstats.songCount++;
            plugBot.roomUtilities.intervalMessage();
            plugBot.room.currentDJID = obj.dj.id;

            var mid = obj.media.format + ':' + obj.media.cid;
            for (var bl in plugBot.room.blacklists) {
                if (plugBot.settings.blacklistEnabled) {
                    if (plugBot.room.blacklists[bl].indexOf(mid) > -1) {
                        API.sendChat(subChat("/me This track is on the %%BLACKLIST%% blacklist! Skipping...", {blacklist: bl}));
                        return API.moderateForceSkip();
                    }
                }
            }

            var alreadyPlayed = false;
            for (var i = 0; i < plugBot.room.historyList.length; i++) {
                if (plugBot.room.historyList[i][0] === obj.media.cid) {
                    var firstPlayed = plugBot.room.historyList[i][1];
                    var plays = plugBot.room.historyList[i].length - 1;
                    var lastPlayed = plugBot.room.historyList[i][plays];
                    API.sendChat(subChat("/me :repeat: This song has been played %%PLAYS%% time(s) in the last %%TIMETOTAL%%, last play was %%LASTTIME%% ago. :repeat:", {plays: plays, timetotal: plugBot.roomUtilities.msToStr(Date.now() - firstPlayed), lasttime: plugBot.roomUtilities.msToStr(Date.now() - lastPlayed)}));
                    plugBot.room.historyList[i].push(+new Date());
                    alreadyPlayed = true;
                }
            }
            if (!alreadyPlayed) {
                plugBot.room.historyList.push([obj.media.cid, +new Date()]);
            }
            var newMedia = obj.media;
            if (plugBot.settings.timeGuard && newMedia.duration > plugBot.settings.maximumSongLength * 60 && !plugBot.room.roomevent) {
                var name = obj.dj.username;
                API.sendChat(subChat("/me @%%NAME%%, your song is longer than %%MAXLENGTH%% minutes, you need permission to play longer songs.", {name: name, maxlength: plugBot.settings.maximumSongLength}));
                API.moderateForceSkip();
            }
            if (user.ownSong) {
                API.sendChat(subChat("/me :up: @%%NAME%% has permission to play their own production!", {name: user.username}));
                user.ownSong = false;
            }
            clearTimeout(plugBot.room.autoskipTimer);
            if (plugBot.room.autoskip) {
                var remaining = obj.media.duration * 1000;
                plugBot.room.autoskipTimer = setTimeout(function () {
                    console.log("Skipping track.");
                    API.moderateForceSkip();
                }, remaining + 3000);
            }
            storeToStorage();

        },
        eventWaitlistupdate: function (users) {
            if (users.length < 50) {
                if (plugBot.room.queue.id.length > 0 && plugBot.room.queueable) {
                    plugBot.room.queueable = false;
                    setTimeout(function () {
                        plugBot.room.queueable = true;
                    }, 500);
                    plugBot.room.queueing++;
                    var id, pos;
                    setTimeout(
                        function () {
                            id = plugBot.room.queue.id.splice(0, 1)[0];
                            pos = plugBot.room.queue.position.splice(0, 1)[0];
                            API.moderateAddDJ(id, pos);
                            setTimeout(
                                function (id, pos) {
                                    API.moderateMoveDJ(id, pos);
                                    plugBot.room.queueing--;
                                    if (plugBot.room.queue.id.length === 0) setTimeout(function () {
                                        plugBot.roomUtilities.booth.unlockBooth();
                                    }, 1000);
                                }, 1000, id, pos);
                        }, 1000 + plugBot.room.queueing * 2500);
                }
            }
            for (var i = 0; i < users.length; i++) {
                var user = plugBot.userUtilities.lookupUser(users[i].id);
                plugBot.userUtilities.updatePosition(user, API.getWaitListPosition(users[i].id) + 1);
            }
        },
        chatcleaner: function (chat) {
            if (!plugBot.settings.filterChat) return false;
            if (plugBot.userUtilities.getPermission(chat.uid) > 1) return false;
            var msg = chat.message;
            var containsLetters = false;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === ':' || ch === '^') containsLetters = true;
            }
            if (msg === '') {
                return true;
            }
            if (!containsLetters && (msg.length === 1 || msg.length > 3)) return true;
            msg = msg.replace(/[ ,;.:\/=~+%^*\-\\"'&@#]/g, '');
            var capitals = 0;
            var ch;
            for (var i = 0; i < msg.length; i++) {
                ch = msg.charAt(i);
                if (ch >= 'A' && ch <= 'Z') capitals++;
            }
            if (capitals >= 40) {
                API.sendChat(subChat("/me @%%NAME%%, unglue your capslock button please.", {name: chat.un}));
                return true;
            }
            msg = msg.toLowerCase();
            if (msg === 'skip') {
                API.sendChat(subChat("/me @%%NAME%%, don't ask for skips.", {name: chat.un}));
                return true;
            }
            for (var j = 0; j < plugBot.chatUtilities.spam.length; j++) {
                if (msg === plugBot.chatUtilities.spam[j]) {
                    API.sendChat(subChat("/me @%%NAME%%, please don't spam.", {name: chat.un}));
                    return true;
                }
            }
            return false;
        },
        chatUtilities: {
            chatFilter: function (chat) {
                var msg = chat.message;
                var perm = plugBot.userUtilities.getPermission(chat.uid);
                var user = plugBot.userUtilities.lookupUser(chat.uid);
                var isMuted = false;
                for (var i = 0; i < plugBot.room.mutedUsers.length; i++) {
                    if (plugBot.room.mutedUsers[i] === chat.uid) isMuted = true;
                }
                if (isMuted) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (plugBot.settings.lockdownEnabled) {
                    if (perm === 0) {
                        API.moderateDeleteChat(chat.cid);
                        return true;
                    }
                }
                if (plugBot.chatcleaner(chat)) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }
                if (msg.indexOf('http://adf.ly/') > -1) {
                    API.moderateDeleteChat(chat.cid);
                    API.sendChat(subChat("/me @%%NAME%%, please change your autowoot program. We suggest PlugCubed: http://plugcubed.net/", {name: chat.un}));
                    return true;
                }
                if (msg.indexOf('autojoin was not enabled') > 0 || msg.indexOf('AFK message was not enabled') > 0 || msg.indexOf('!afkdisable') > 0 || msg.indexOf('!joindisable') > 0 || msg.indexOf('autojoin disabled') > 0 || msg.indexOf('AFK message disabled') > 0) {
                    API.moderateDeleteChat(chat.cid);
                    return true;
                }

                var rlJoinChat = "/me @%%NAME%% joined the roulette! (!leave if you regret it.)";
                var rlLeaveChat = "/me @%%NAME%% left the roulette!";

                var joinedroulette = rlJoinChat.split('%%NAME%%');
                if (joinedroulette[1].length > joinedroulette[0].length) joinedroulette = joinedroulette[1];
                else joinedroulette = joinedroulette[0];

                var leftroulette = rlLeaveChat.split('%%NAME%%');
                if (leftroulette[1].length > leftroulette[0].length) leftroulette = leftroulette[1];
                else leftroulette = leftroulette[0];

                if ((msg.indexOf(joinedroulette) > -1 || msg.indexOf(leftroulette) > -1) && chat.uid === plugBot.loggedInID) {
                    setTimeout(function (id) {
                        API.moderateDeleteChat(id);
                    }, 2 * 1000, chat.cid);
                    return true;
                }
                return false;
            },
            commandCheck: function (chat) {
                var cmd;
                if (chat.message.charAt(0) === '!') {
                    var space = chat.message.indexOf(' ');
                    if (space === -1) {
                        cmd = chat.message;
                    }
                    else cmd = chat.message.substring(0, space);
                }
                else return false;
                var userPerm = plugBot.userUtilities.getPermission(chat.uid);
                //console.log("name: " + chat.un + ", perm: " + userPerm);
                if (chat.message !== "!join" && chat.message !== "!leave") {
                    if (userPerm === 0 && !plugBot.room.usercommand) return void (0);
                    if (!plugBot.room.allcommand) return void (0);
                }
                if (chat.message === '!eta' && plugBot.settings.etaRestriction) {
                    if (userPerm < 2) {
                        var u = plugBot.userUtilities.lookupUser(chat.uid);
                        if (u.lastEta !== null && (Date.now() - u.lastEta) < 1 * 60 * 60 * 1000) {
                            API.moderateDeleteChat(chat.cid);
                            return void (0);
                        }
                        else u.lastEta = Date.now();
                    }
                }
                var executed = false;

                for (var comm in plugBot.commands) {
                    var cmdCall = plugBot.commands[comm].command;
                    if (!Array.isArray(cmdCall)) {
                        cmdCall = [cmdCall]
                    }
                    for (var i = 0; i < cmdCall.length; i++) {
                        if (plugBot.settings.commandLiteral + cmdCall[i] === cmd) {
                            plugBot.commands[comm].functionality(chat, plugBot.settings.commandLiteral + cmdCall[i]);
                            executed = true;
                            break;
                        }
                    }
                }

                if (executed && userPerm === 0) {
                    plugBot.room.usercommand = false;
                    setTimeout(function () {
                        plugBot.room.usercommand = true;
                    }, plugBot.settings.commandCooldown * 1000);
                }
                if (executed) {
                    API.moderateDeleteChat(chat.cid);
                    plugBot.room.allcommand = false;
                    setTimeout(function () {
                        plugBot.room.allcommand = true;
                    }, 5 * 1000);
                }
                return executed;
            },
            action: function (chat) {
                var user = plugBot.userUtilities.lookupUser(chat.uid);
                if (chat.type === 'message') {
                    for (var j = 0; j < plugBot.room.users.length; j++) {
                        if (plugBot.userUtilities.getUser(plugBot.room.users[j]).id === chat.uid) {
                            plugBot.userUtilities.setLastActivity(plugBot.room.users[j]);
                        }

                    }
                }
                plugBot.room.roomstats.chatmessages++;
            },
            spam: [
                'hueh', 'hu3', 'brbr', 'heu', 'brbr', 'kkkk', 'spoder', 'mafia', 'zuera', 'zueira',
                'zueria', 'aehoo', 'aheu', 'alguem', 'algum', 'brazil', 'zoeira', 'fuckadmins', 'affff', 'vaisefoder', 'huenaarea',
                'hitler', 'ashua', 'ahsu', 'ashau', 'lulz', 'huehue', 'hue', 'huehuehue', 'merda', 'pqp', 'puta', 'mulher', 'pula', 'retarda', 'caralho', 'filha', 'ppk',
                'gringo', 'fuder', 'foder', 'hua', 'ahue', 'modafuka', 'modafoka', 'mudafuka', 'mudafoka', 'ooooooooooooooo', 'foda'
            ],
            curses: [
                'nigger', 'faggot', 'nigga', 'niqqa', 'motherfucker', 'modafocka'
            ]
        },
        connectAPI: function () {
            this.proxy = {
                eventChat: $.proxy(this.eventChat, this),
                eventUserskip: $.proxy(this.eventUserskip, this),
                eventUserjoin: $.proxy(this.eventUserjoin, this),
                eventUserleave: $.proxy(this.eventUserleave, this),
                eventUserfan: $.proxy(this.eventUserfan, this),
                eventFriendjoin: $.proxy(this.eventFriendjoin, this),
                eventFanjoin: $.proxy(this.eventFanjoin, this),
                eventVoteupdate: $.proxy(this.eventVoteupdate, this),
                eventCurateupdate: $.proxy(this.eventCurateupdate, this),
                eventRoomscoreupdate: $.proxy(this.eventRoomscoreupdate, this),
                eventDjadvance: $.proxy(this.eventDjadvance, this),
                eventDjupdate: $.proxy(this.eventDjupdate, this),
                eventWaitlistupdate: $.proxy(this.eventWaitlistupdate, this),
                eventVoteskip: $.proxy(this.eventVoteskip, this),
                eventModskip: $.proxy(this.eventModskip, this),
                eventChatcommand: $.proxy(this.eventChatcommand, this),
                eventHistoryupdate: $.proxy(this.eventHistoryupdate, this)

            };
            API.on(API.CHAT, this.proxy.eventChat);
            API.on(API.USER_SKIP, this.proxy.eventUserskip);
            API.on(API.USER_JOIN, this.proxy.eventUserjoin);
            API.on(API.USER_LEAVE, this.proxy.eventUserleave);
            API.on(API.USER_FAN, this.proxy.eventUserfan);
            API.on(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.on(API.GRAB_UPDATE, this.proxy.eventCurateupdate);
            API.on(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.on(API.ADVANCE, this.proxy.eventDjadvance);
            API.on(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.on(API.MOD_SKIP, this.proxy.eventModskip);
            API.on(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.on(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        disconnectAPI: function () {
            API.off(API.CHAT, this.proxy.eventChat);
            API.off(API.USER_SKIP, this.proxy.eventUserskip);
            API.off(API.USER_JOIN, this.proxy.eventUserjoin);
            API.off(API.USER_LEAVE, this.proxy.eventUserleave);
            API.off(API.USER_FAN, this.proxy.eventUserfan);
            API.off(API.VOTE_UPDATE, this.proxy.eventVoteupdate);
            API.off(API.CURATE_UPDATE, this.proxy.eventCurateupdate);
            API.off(API.ROOM_SCORE_UPDATE, this.proxy.eventRoomscoreupdate);
            API.off(API.ADVANCE, this.proxy.eventDjadvance);
            API.off(API.WAIT_LIST_UPDATE, this.proxy.eventWaitlistupdate);
            API.off(API.MOD_SKIP, this.proxy.eventModskip);
            API.off(API.CHAT_COMMAND, this.proxy.eventChatcommand);
            API.off(API.HISTORY_UPDATE, this.proxy.eventHistoryupdate);
        },
        startup: function () {
            Function.prototype.toString = function () {
                return 'Function.'
            };
            var u = API.getUser();
            if (plugBot.userUtilities.getPermission(u) < 2) return API.chatLog("Only bouncers and up can run a bot.");
            if (plugBot.userUtilities.getPermission(u) === 2) API.chatLog("The bot can't move people when it's run as a bouncer.");
            plugBot.connectAPI();
            API.moderateDeleteChat = function (cid) {
                $.ajax({
                    url: "https://plug.dj/_/chat/" + cid,
                    type: "DELETE"
                })
            };
            retrieveSettings();
            retrieveFromStorage();
            window.bot = plugBot;
            plugBot.roomUtilities.updateBlacklists();
            setInterval(plugBot.roomUtilities.updateBlacklists, 60 * 60 * 1000);
            if (plugBot.room.roomstats.launchTime === null) {
                plugBot.room.roomstats.launchTime = Date.now();
            }

            for (var j = 0; j < plugBot.room.users.length; j++) {
                plugBot.room.users[j].inRoom = false;
            }
            var userlist = API.getUsers();
            for (var i = 0; i < userlist.length; i++) {
                var known = false;
                var ind = null;
                for (var j = 0; j < plugBot.room.users.length; j++) {
                    if (plugBot.room.users[j].id === userlist[i].id) {
                        known = true;
                        ind = j;
                    }
                }
                if (known) {
                    plugBot.room.users[ind].inRoom = true;
                }
                else {
                    plugBot.room.users.push(new plugBot.User(userlist[i].id, userlist[i].username));
                    ind = plugBot.room.users.length - 1;
                }
                var wlIndex = API.getWaitListPosition(plugBot.room.users[ind].id) + 1;
                plugBot.userUtilities.updatePosition(plugBot.room.users[ind], wlIndex);
            }
            plugBot.room.afkInterval = setInterval(function () {
                plugBot.roomUtilities.afkCheck()
            }, 10 * 1000);
            plugBot.loggedInID = API.getUser().id;
            plugBot.status = true;
            API.sendChat('/cap ' + plugBot.settings.startupCap);
            API.setVolume(plugBot.settings.startupVolume);
            $("#woot").click();
            if (plugBot.settings.startupEmoji) {
                var emojibuttonoff = $(".icon-emoji-off");
                if (emojibuttonoff.length > 0) {
                    emojibuttonoff[0].click();
                }
                API.chatLog(':smile: Emojis enabled.');
            }
            else {
                var emojibuttonon = $(".icon-emoji-on");
                if (emojibuttonon.length > 0) {
                    emojibuttonon[0].click();
                }
                API.chatLog('Emojis disabled.');
            }
            API.chatLog('Avatars capped at ' + plugBot.settings.startupCap);
            API.chatLog('Volume set to ' + plugBot.settings.startupVolume);
            API.sendChat(subChat("/me %%BOTNAME%% v%%VERSION%% online!", {botname: plugBot.settings.botName, version: plugBot.version}));
        },
        commands: {
            executable: function (minRank, chat) {
                var id = chat.uid;
                var perm = plugBot.userUtilities.getPermission(id);
                var minPerm;
                switch (minRank) {
                    case 'admin':
                        minPerm = 10;
                        break;
                    case 'ambassador':
                        minPerm = 7;
                        break;
                    case 'host':
                        minPerm = 5;
                        break;
                    case 'cohost':
                        minPerm = 4;
                        break;
                    case 'manager':
                        minPerm = 3;
                        break;
                    case 'mod':
                        if (plugBot.settings.bouncerPlus) {
                            minPerm = 2;
                        }
                        else {
                            minPerm = 3;
                        }
                        break;
                    case 'bouncer':
                        minPerm = 2;
                        break;
                    case 'residentdj':
                        minPerm = 1;
                        break;
                    case 'user':
                        minPerm = 0;
                        break;
                    default:
                        API.chatLog('error assigning minimum permission');
                }
                return perm >= minPerm;

            },
            /**
             command: {
                        command: 'cmd',
                        rank: 'user/bouncer/mod/manager',
                        type: 'startsWith/exact',
                        functionality: function(chat, cmd){
                                if(this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                                if( !plugBot.commands.executable(this.rank, chat) ) return void (0);
                                else{
                                
                                }
                        }
                },
             **/
            //===COMMANDS===
            activeCommand: {
                command: 'active',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var now = Date.now();
                        var chatters = 0;
                        var time;
                        if (msg.length === cmd.length) time = 60;
                        else {
                            time = msg.substring(cmd.length + 1);
                            if (isNaN(time)) return API.sendChat(subChat("/me [@%%NAME%%] Invalid time specified.", {name: chat.un}));
                        }
                        for (var i = 0; i < plugBot.room.users.length; i++) {
                            userTime = plugBot.userUtilities.getLastActivity(plugBot.room.users[i]);
                            if ((now - userTime) <= (time * 60 * 1000)) {
                                chatters++;
                            }
                        }
                        API.sendChat(subChat("/me [@%%NAME%% There have been %%AMOUNT%% users chatting in the past %%TIME%% minutes.", {name: chat.un, amount: chatters, time: time}));
                    }
                }
            },

            addCommand: {
                command: 'add',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (msg.length > cmd.length + 2) {
                            if (typeof user !== 'undefined') {
                                if (plugBot.room.roomevent) {
                                    plugBot.room.eventArtists.push(user.id);
                                }
                                API.moderateAddDJ(user.id);
                            } else API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        }
                    }
                }
            },

            afklimitCommand: {
                command: 'afklimit',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No limit specified.", {name: chat.un}));
                        var limit = msg.substring(cmd.length + 1);
                        if (!isNaN(limit)) {
                            plugBot.settings.maximumAfk = parseInt(limit, 10);
                            API.sendChat(subChat("/me [@%%NAME%%] Maximum afk duration set to %%TIME%% minutes.", {name: chat.un, time: plugBot.settings.maximumAfk}));
                        }
                        else API.sendChat(subChat("/me [@%%NAME%%] Invalid limit.", {name: chat.un}));
                    }
                }
            },

            afkremovalCommand: {
                command: 'afkremoval',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.settings.afkRemoval) {
                            plugBot.settings.afkRemoval = !plugBot.settings.afkRemoval;
                            clearInterval(plugBot.room.afkInterval);
                            API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "AFK removal"}));
                        }
                        else {
                            plugBot.settings.afkRemoval = !plugBot.settings.afkRemoval;
                            plugBot.room.afkInterval = setInterval(function () {
                                plugBot.roomUtilities.afkCheck()
                            }, 2 * 1000);
                            API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "AFK removal"}));
                        }
                    }
                }
            },

            afkresetCommand: {
                command: 'afkreset',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        plugBot.userUtilities.setLastActivity(user);
                        API.sendChat(subChat("/me [@%%NAME%%] Reset the afk status of @%%USERNAME%%.", {name: chat.un, username: name}));
                    }
                }
            },

            afktimeCommand: {
                command: 'afktime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        var lastActive = plugBot.userUtilities.getLastActivity(user);
                        var inactivity = Date.now() - lastActive;
                        var time = plugBot.roomUtilities.msToStr(inactivity);
                        API.sendChat(subChat("/me [@%%NAME%%] @%%USERNAME%% has been inactive for %%TIME%%.", {name: chat.un, username: name, time: time}));
                    }
                }
            },

            autoskipCommand: {
                command: 'autoskip',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.room.autoskip) {
                            plugBot.room.autoskip = !plugBot.room.autoskip;
                            clearTimeout(plugBot.room.autoskipTimer);
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "autoskip"}));
                        }
                        else {
                            plugBot.room.autoskip = !plugBot.room.autoskip;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "autoskip"}));
                        }
                    }
                }
            },

            autowootCommand: {
                command: 'autowoot',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat("/me We recommend PlugCubed for autowooting: http://plugcubed.net/");
                    }
                }
            },

            banCommand: {
                command: 'ban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var name = msg.substr(cmd.length + 2);
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        API.moderateBanUser(user.id, 1, API.BAN.DAY);
                    }
                }
            },

            blacklistCommand: {
                command: ['blacklist', 'bl'],
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No list specified.", {name: chat.un}));
                        var list = msg.substr(cmd.length + 1);
                        if (typeof plugBot.room.blacklists[list] === 'undefined') return API.sendChat(subChat("/me [@%%NAME%%] Invalid list specified.", {name: chat.un}));
                        else {
                            var media = API.getMedia();
                            var track = {
                                list: list,
                                author: media.author,
                                title: media.title,
                                mid: media.format + ':' + media.cid
                            };
                            plugBot.room.newBlacklisted.push(track);
                            plugBot.room.blacklists[list].push(media.format + ':' + media.cid);
                            API.sendChat(subChat("/me [@%%NAME%%] This track belongs on the %%BLACKLIST%% blacklist! [ %%AUTHOR%% - %%TITLE%% - %%MID%% ]", {name: chat.un, blacklist: list, author: media.author, title: media.title, mid: media.format + ':' + media.cid}));
                            API.moderateForceSkip();
                            if (typeof plugBot.room.newBlacklistedSongFunction === 'function') {
                                plugBot.room.newBlacklistedSongFunction(track);
                            }
                        }
                    }
                }
            },

            clearchatCommand: {
                command: 'clearchat',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var currentchat = $('#chat-messages').children();
                        for (var i = 0; i < currentchat.length; i++) {
                            API.moderateDeleteChat(currentchat[i].getAttribute("data-cid"));
                        }
                        return API.sendChat(subChat("/me [@%%NAME%%] Cleared the chat.", {name: chat.un}));
                    }
                }
            },

            commandsCommand: {
                command: 'commands',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat("/me %%BOTNAME%% commands: %%LINK%%", {botname: plugBot.settings.botName, link: plugBot.cmdLink}));
                    }
                }
            },

            cookieCommand: {
                command: 'cookie',
                rank: 'user',
                type: 'startsWith',
                cookies: ['has given you a chocolate chip cookie!',
                    'has given you a soft homemade oatmeal cookie!',
                    'has given you a plain, dry, old cookie. It was the last one in the bag. Gross.',
                    'gives you a sugar cookie. What, no frosting and sprinkles? 0/10 would not touch.',
                    'gives you a chocolate chip cookie. Oh wait, those are raisins. Bleck!',
                    'gives you an enormous cookie. Poking it gives you more cookies. Weird.',
                    'gives you a fortune cookie. It reads "Why aren\'t you working on any projects?"',
                    'gives you a fortune cookie. It reads "Give that special someone a compliment"',
                    'gives you a fortune cookie. It reads "Take a risk!"',
                    'gives you a fortune cookie. It reads "Go outside."',
                    'gives you a fortune cookie. It reads "Don\'t forget to eat your veggies!"',
                    'gives you a fortune cookie. It reads "Do you even lift?"',
                    'gives you a fortune cookie. It reads "m808 pls"',
                    'gives you a fortune cookie. It reads "If you move your hips, you\'ll get all the ladies."',
                    'gives you a fortune cookie. It reads "I love you."',
                    'gives you a Golden Cookie. You can\'t eat it because it is made of gold. Dammit.',
                    'gives you an Oreo cookie with a glass of milk!',
                    'gives you a rainbow cookie made with love :heart:',
                    'gives you an old cookie that was left out in the rain, it\'s moldy.',
                    'bakes you fresh cookies, it smells amazing.'
                ],
                getCookie: function () {
                    var c = Math.floor(Math.random() * this.cookies.length);
                    return this.cookies[c];
                },
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;

                        var space = msg.indexOf(' ');
                        if (space === -1) {
                            API.sendChat("/me eats a cookie.");
                            return false;
                        }
                        else {
                            var name = msg.substring(space + 2);
                            var user = plugBot.userUtilities.lookupUserName(name);
                            if (user === false || !user.inRoom) {
                                return API.sendChat(subChat("/em doesn't see %%NAME%% in room and eats a cookie himself.", {name: name}));
                            }
                            else if (user.username === chat.un) {
                                return API.sendChat(subChat("/me @%%NAME%%, you're a bit greedy, aren't you? Giving cookies to yourself, bah. Share some with other people!", {name: name}));
                            }
                            else {
                                return API.sendChat(subChat("/me @%%NAMETO%%, @%%NAMEFROM%% %%COOKIE%%", {nameto: user.username, namefrom: chat.un, cookie: this.getCookie()}));
                            }
                        }
                    }
                }
            },

            cycleCommand: {
                command: 'cycle',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        plugBot.roomUtilities.changeDJCycle();
                    }
                }
            },

            voteskipCommand: {
                command: 'voteskip',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length <= cmd.length + 1) return API.sendChat(subChat("/me [@%%NAME%%] Voteskip limit is currently set to %%LIMIT%% mehs.", {name: chat.un, limit: plugBot.settings.voteSkipLimit}));
                        var argument = msg.substring(cmd.length + 1);
                        if (!plugBot.settings.voteSkip) plugBot.settings.voteSkip = !plugBot.settings.voteSkip;
                        if (isNaN(argument)) {
                            API.sendChat(subChat("/me [@%%NAME%%] Invalid voteskip limit, please try again using a number to signify the number of mehs.", {name: chat.un}));
                        }
                        else {
                            plugBot.settings.voteSkipLimit = argument;
                            API.sendChat(subChat("/me [@%%NAME%%] Voteskip limit set to %%LIMIT%%.", {name: chat.un, limit: plugBot.settings.voteSkipLimit}));
                        }
                    }
                }
            },

            togglevoteskipCommand: {
                command: 'togglevoteskip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.settings.voteSkip) {
                            plugBot.settings.voteSkip = !plugBot.settings.voteSkip;
                            API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "voteskip"}));
                        }
                        else {
                            plugBot.settings.motdEnabled = !plugBot.settings.motdEnabled;
                            API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "voteskip"}));
                        }
                    }
                }
            },

            dclookupCommand: {
                command: ['dclookup', 'dc'],
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var name;
                        if (msg.length === cmd.length) name = chat.un;
                        else {
                            name = msg.substring(cmd.length + 2);
                            var perm = plugBot.userUtilities.getPermission(chat.uid);
                            if (perm < 2) return API.sendChat(subChat("/me [@%%NAME%%] Only bouncers and above can do a lookup for others.", {name: chat.un}));
                        }
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        var toChat = plugBot.userUtilities.dclookup(user.id);
                        API.sendChat(toChat);
                    }
                }
            },

            emojiCommand: {
                command: 'emoji',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = 'http://www.emoji-cheat-sheet.com/';
                        API.sendChat(subChat("/me Emoji list: %%LINK%%", {link: link}));
                    }
                }
            },

            etaCommand: {
                command: 'eta',
                rank: 'user',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var perm = plugBot.userUtilities.getPermission(chat.uid);
                        var msg = chat.message;
                        var name;
                        if (msg.length > cmd.length) {
                            if (perm < 2) return void (0);
                            name = msg.substring(cmd.length + 2);
                        } else name = chat.un;
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        var pos = API.getWaitListPosition(user.id);
                        if (pos < 0) return API.sendChat(subChat("/me @%%NAME%%, you are not on the waitlist.", {name: name}));
                        var timeRemaining = API.getTimeRemaining();
                        var estimateMS = ((pos + 1) * 4 * 60 + timeRemaining) * 1000;
                        var estimateString = plugBot.roomUtilities.msToStr(estimateMS);
                        API.sendChat(subChat("/me @%%NAME%% you will reach the booth in approximately %%TIME%%.", {name: name, time: estimateString}));
                    }
                }
            },

            filterCommand: {
                command: 'filter',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.settings.filterChat) {
                            plugBot.settings.filterChat = !plugBot.settings.filterChat;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "chatfilter"}));
                        }
                        else {
                            plugBot.settings.filterChat = !plugBot.settings.filterChat;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "chatfilter"}));
                        }
                    }
                }
            },

            helpCommand: {
                command: 'help',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var link = "http://i.imgur.com/SBAso1N.jpg";
                        API.sendChat(subChat("/me This image will get you started on plug: %%LINK%%", {link: link}));
                    }
                }
            },

            joinCommand: {
                command: 'join',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.room.roulette.rouletteStatus && plugBot.room.roulette.participants.indexOf(chat.uid) < 0) {
                            plugBot.room.roulette.participants.push(chat.uid);
                            API.sendChat(subChat("/me @%%NAME%% joined the roulette! (!leave if you regret it.)", {name: chat.un}));
                        }
                    }
                }
            },

            slotsCommand: {
                command: 'slots',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var user = plugBot.userUtilities.lookupUser(chat.uid);
                        if(API.getWaitListPosition(chat.uid) > -1)
                        {
                            var resultInMinutes = 0;
                            if(user.lastSlotsTime != null){
                                var endTime = new Date();
                                var difference = endTime.getTime() - user.lastSlotsTime.getTime(); // This will give difference in milliseconds
                                resultInMinutes = Math.round(difference / 60000);
                            }
     
                            if(user.lastSlotsTime == null || resultInMinutes >= 5)
                            {
                                user.lastSlotsTime = new Date();
                                setTimeout(function () {
                                    //get 3 random strings from array
                                    var fruits = [":watermelon:", ":strawberry:", ":grapes:", ":lemon:", ":peach:", ":cherries:"];
                                    var slots = [fruits[Math.floor(Math.random()*fruits.length)], fruits[Math.floor(Math.random()*fruits.length)], fruits[Math.floor(Math.random()*fruits.length)]];
                                    
                                    //check if user has won something
                                    var msg = "/me [@"+chat.un+"] "+slots[0]+"-"+slots[1]+"-"+slots[2]+", ";
                                    if(slots[0] == slots[1] && slots[1] == slots[2])
                                    {//3 in a row, gain 5 waitlist spots
                                        msg += "you got 3 in a row! You gain 5 waitlist spots!";
                                        var newPos = 0;
                                        var oldPos = API.getWaitListPosition(user.id);

                                        if(oldPos < 5) newPos = 0;
                                        if(oldPos >= 5) newPos = oldPos-5;

                                        moveUser(user.id, newPos, true);
                                    }else if(slots[0] == slots[1] || slots[1] == slots[2])
                                    {//2 in a row, play again now
                                        msg += "you got 2 in a row! Play again immediately!";
                                        user.lastSlotsTime = null;
                                    }else if((slots[0] != slots[1]) && (slots[1] != slots[2]) && (slots[0] != slots[2]))
                                    {//all different, user.lostSlots + 1
                                        user.lostSlots = user.lostSlots+1;
                                        if(user.lostSlots >= 5)
                                        {
                                            msg += "you have had 5 losses in a row, you will be put back 2 spots in the waitlist!";
                                            var newPos = 0;
                                            var oldPos = API.getWaitListPosition(user.id);

                                            newPos = oldPos + 2;
                                            if(newPos > 50) newPos = 50;

                                            moveUser(user.id, newPos, true);
                                        }else{
                                            msg += "you got nothing! Amount of losses in a row is now " + user.lostSlots;
                                        }
                                    } 
                                    API.sendChat(msg); 
                                }, 500);
                            }else{
                                setTimeout(function () {
                                    API.sendChat(subChat("/me [@%%NAME%%] You can't use slots more than once every 5 minutes.", {name: chat.un}));
                                }, 500);                            
                            }
                        }else{
                            setTimeout(function () {
                                API.sendChat(subChat("/me [@%%NAME%%] You can't use slots when you are not in the waitlist.", {name: chat.un}));
                            }, 500);  
                        }
                    }
                }
            },

            jointimeCommand: {
                command: 'jointime',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        var join = plugBot.userUtilities.getJointime(user);
                        var time = Date.now() - join;
                        var timeString = plugBot.roomUtilities.msToStr(time);
                        API.sendChat(subChat("/me [@%%NAMEFROM%%] @%%USERNAME%% has been in the room for %%TIME%%.", {namefrom: chat.un, username: name, time: timeString}));
                    }
                }
            },

            kickCommand: {
                command: 'kick',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var lastSpace = msg.lastIndexOf(' ');
                        var time;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            time = 0.25;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }

                        var user = plugBot.userUtilities.lookupUserName(name);
                        var from = chat.un;
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));

                        var permFrom = plugBot.userUtilities.getPermission(chat.uid);
                        var permTokick = plugBot.userUtilities.getPermission(user.id);

                        if (permFrom <= permTokick)
                            return API.sendChat(subChat("/me [@%%NAME%%] you can't kick users with an equal or higher rank than you!", {name: chat.un}));

                        if (!isNaN(time)) {
                            API.sendChat(subChat("/me [@%%NAME%%], @%%USERNAME%% you are being kicked from the community for %%TIME%% minutes.", {name: chat.un, username: name, time: time}));
                            if (time > 24 * 60 * 60) API.moderateBanUser(user.id, 1, API.BAN.PERMA);
                            else API.moderateBanUser(user.id, 1, API.BAN.DAY);
                            setTimeout(function (id, name) {
                                API.moderateUnbanUser(id);
                                console.log('Unbanned @' + name + '. (' + id + ')');
                            }, time * 60 * 1000, user.id, name);
                        }
                        else API.sendChat(subChat("/me [@%%NAME%%] Invalid time specified.", {name: chat.un}));
                    }
                }
            },

            killCommand: {
                command: 'kill',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        storeToStorage();
                        API.sendChat("/me Shutting down.");
                        plugBot.disconnectAPI();
                        setTimeout(function () {
                            kill();
                        }, 1000);
                    }
                }
            },

            leaveCommand: {
                command: 'leave',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var ind = plugBot.room.roulette.participants.indexOf(chat.uid);
                        if (ind > -1) {
                            plugBot.room.roulette.participants.splice(ind, 1);
                            API.sendChat(subChat("/me @%%NAME%% left the roulette!", {name: chat.un}));
                        }
                    }
                }
            },

            linkCommand: {
                command: 'link',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var media = API.getMedia();
                        var from = chat.un;
                        var user = plugBot.userUtilities.lookupUser(chat.uid);
                        var perm = plugBot.userUtilities.getPermission(chat.uid);
                        var dj = API.getDJ().id;
                        var isDj = false;
                        if (dj === chat.uid) isDj = true;
                        if (perm >= 1 || isDj) {
                            if (media.format === 1) {
                                var linkToSong = "https://www.youtube.com/watch?v=" + media.cid;
                                API.sendChat(subChat("/me [@%%NAME%%] Link to current song: %%LINK%%", {name: from, link: linkToSong}));
                            }
                            if (media.format === 2) {
                                SC.get('/tracks/' + media.cid, function (sound) {
                                    API.sendChat(subChat("/me [@%%NAME%%] Link to current song: %%LINK%%", {name: from, link: sound.permalink_url}));
                                });
                            }
                        }
                    }
                }
            },

            lockCommand: {
                command: 'lock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        plugBot.roomUtilities.booth.lockBooth();
                    }
                }
            },

            lockskipCommand: {
                command: 'lockskip',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.room.skippable) {
                            var dj = API.getDJ();
                            var id = dj.id;
                            var name = dj.username;
                            var msgSend = '@' + name + ': ';
                            plugBot.room.queueable = false;

                            if (chat.message.length === cmd.length) {
                                API.sendChat(subChat("/me [%%NAME%% used lockskip.]", {name: chat.un}));
                                plugBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    plugBot.room.skippable = false;
                                    setTimeout(function () {
                                        plugBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        plugBot.userUtilities.moveUser(id, plugBot.settings.lockskipPosition, false);
                                        plugBot.room.queueable = true;
                                        setTimeout(function () {
                                            plugBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                            var validReason = false;
                            var msg = chat.message;
                            var reason = msg.substring(cmd.length + 1);
                            for (var i = 0; i < plugBot.settings.lockskipReasons.length; i++) {
                                var r = plugBot.settings.lockskipReasons[i][0];
                                if (reason.indexOf(r) !== -1) {
                                    validReason = true;
                                    msgSend += plugBot.settings.lockskipReasons[i][1];
                                }
                            }
                            if (validReason) {
                                API.sendChat(subChat("/me [%%NAME%% used lockskip.]", {name: chat.un}));
                                plugBot.roomUtilities.booth.lockBooth();
                                setTimeout(function (id) {
                                    API.moderateForceSkip();
                                    plugBot.room.skippable = false;
                                    API.sendChat(msgSend);
                                    setTimeout(function () {
                                        plugBot.room.skippable = true
                                    }, 5 * 1000);
                                    setTimeout(function (id) {
                                        plugBot.userUtilities.moveUser(id, plugBot.settings.lockskipPosition, false);
                                        plugBot.room.queueable = true;
                                        setTimeout(function () {
                                            plugBot.roomUtilities.booth.unlockBooth();
                                        }, 1000);
                                    }, 1500, id);
                                }, 1000, id);
                                return void (0);
                            }
                        }
                    }
                }
            },

            lockskipposCommand: {
                command: 'lockskippos',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var pos = msg.substring(cmd.length + 1);
                        if (!isNaN(pos)) {
                            plugBot.settings.lockskipPosition = pos;
                            return API.sendChat(subChat("/me [@%%NAME%%] Lockskip will now move the dj to position %%POSITION%%.", {name: chat.un, position: plugBot.settings.lockskipPosition}));
                        }
                        else return API.sendChat(subChat("/me [@%%NAME%%] Invalid position specified.", {name: chat.un}));
                    }
                }
            },

            maxlengthCommand: {
                command: 'maxlength',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var maxTime = msg.substring(cmd.length + 1);
                        if (!isNaN(maxTime)) {
                            plugBot.settings.maximumSongLength = maxTime;
                            return API.sendChat(subChat("/me [@%%NAME%%] The maximum song duration is set to %%TIME%% minutes.", {name: chat.un, time: plugBot.settings.maximumSongLength}));
                        }
                        else return API.sendChat(subChat("/me [@%%NAME%%] Invalid time specified.", {name: chat.un}));
                    }
                }
            },

            moveCommand: {
                command: 'move',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var pos;
                        var name;
                        if (isNaN(parseInt(msg.substring(lastSpace + 1)))) {
                            pos = 1;
                            name = msg.substring(cmd.length + 2);
                        }
                        else {
                            pos = parseInt(msg.substring(lastSpace + 1));
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        if (user.id === plugBot.loggedInID) return API.sendChat(subChat("/me @%%NAME%%, don't try to add me to the waitlist, please.", {name: chat.un}));
                        if (!isNaN(pos)) {
                            API.sendChat(subChat("/me [%%NAME%% used move.]", {name: chat.un}));
                            plugBot.userUtilities.moveUser(user.id, pos, false);
                        } else return API.sendChat(subChat("/me [@%%NAME%%] Invalid position specified.", {name: chat.un}));
                    }
                }
            },

            muteCommand: {
                command: 'mute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var lastSpace = msg.lastIndexOf(' ');
                        var time = null;
                        var name;
                        if (lastSpace === msg.indexOf(' ')) {
                            name = msg.substring(cmd.length + 2);
                            time = 45;
                        }
                        else {
                            time = msg.substring(lastSpace + 1);
                            if (isNaN(time) || time == "" || time == null || typeof time == "undefined") {
                                return API.sendChat(subChat("/me [@%%NAME%%] Invalid time specified.", {name: chat.un}));
                            }
                            name = msg.substring(cmd.length + 2, lastSpace);
                        }
                        var from = chat.un;
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        var permFrom = plugBot.userUtilities.getPermission(chat.uid);
                        var permUser = plugBot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                            if (time > 45) {
                                API.sendChat(subChat("/me [@%%NAME%%] You can only mute for maximum %%TIME%% minutes.", {name: chat.un, time: "45"}));
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                            }
                            else if (time === 45) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat( "/me [@%%NAME%%] Muted @%%USERNAME%% for %%TIME%% minutes.", {name: chat.un, username: name, time: time}));

                            }
                            else if (time > 30) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.LONG);
                                API.sendChat(subChat( "/me [@%%NAME%%] Muted @%%USERNAME%% for %%TIME%% minutes.", {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else if (time > 15) {
                                API.moderateMuteUser(user.id, 1, API.MUTE.MEDIUM);
                                API.sendChat(subChat( "/me [@%%NAME%%] Muted @%%USERNAME%% for %%TIME%% minutes.", {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                            else {
                                API.moderateMuteUser(user.id, 1, API.MUTE.SHORT);
                                API.sendChat(subChat( "/me [@%%NAME%%] Muted @%%USERNAME%% for %%TIME%% minutes.", {name: chat.un, username: name, time: time}));
                                setTimeout(function (id) {
                                    API.moderateUnmuteUser(id);
                                }, time * 60 * 1000, user.id);
                            }
                        }
                        else API.sendChat(subChat("/me [@%%NAME%%] You can't mute persons with an equal or higher rank than you.", {name: chat.un}));
                    }
                }
            },

            pingCommand: {
                command: 'ping',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat("/me Pong!")
                    }
                }
            },

            reloadCommand: {
                command: 'reload',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat("/me Be right back.");
                        storeToStorage();
                        plugBot.disconnectAPI();
                        kill();
                        setTimeout(function () {
                            $.getScript(plugBot.scriptLink);
                        }, 2000);
                    }
                }
            },

            removeCommand: {
                command: 'remove',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length > cmd.length + 2) {
                            var name = msg.substr(cmd.length + 2);
                            var user = plugBot.userUtilities.lookupUserName(name);
                            if (typeof user !== 'boolean') {
                                user.lastDC = {
                                    time: null,
                                    position: null,
                                    songCount: 0
                                };
                                if (API.getDJ().id === user.id) {
                                    API.moderateForceSkip();
                                    setTimeout(function () {
                                        API.moderateRemoveDJ(user.id);
                                    }, 1 * 1000, user);
                                }
                                else API.moderateRemoveDJ(user.id);
                            } else API.sendChat(subChat("/me [@%%NAME%%] Specified user @%%USERNAME%% is not in the waitlist.", {name: chat.un, username: name}));
                        } else API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                    }
                }
            },

            restrictetaCommand: {
                command: 'restricteta',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.settings.etaRestriction) {
                            plugBot.settings.etaRestriction = !plugBot.settings.etaRestriction;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "etarestriction"}));
                        }
                        else {
                            plugBot.settings.etaRestriction = !plugBot.settings.etaRestriction;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "etarestriction"}));
                        }
                    }
                }
            },

            rouletteCommand: {
                command: 'roulette',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (!plugBot.room.roulette.rouletteStatus) {
                            plugBot.room.roulette.startRoulette();
                        }
                    }
                }
            },

            sessionstatsCommand: {
                command: 'sessionstats',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var woots = plugBot.room.roomstats.totalWoots;
                        var mehs = plugBot.room.roomstats.totalMehs;
                        var grabs = plugBot.room.roomstats.totalCurates;
                        API.sendChat(subChat("/me [@%%NAME%%] Total woots: %%WOOTS%%, total mehs: %%MEHS%%, total grabs: %%GRABS%%.", {name: from, woots: woots, mehs: mehs, grabs: grabs}));
                    }
                }
            },

            skipCommand: {
                command: 'skip',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat("/me [%%NAME%% used skip.]", {name: chat.un}));
                        API.moderateForceSkip();
                        plugBot.room.skippable = false;
                        setTimeout(function () {
                            plugBot.room.skippable = true
                        }, 5 * 1000);

                    }
                }
            },

            songstatsCommand: {
                command: 'songstats',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.settings.songstats) {
                            plugBot.settings.songstats = !plugBot.settings.songstats;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "songstats"}));
                        }
                        else {
                            plugBot.settings.songstats = !plugBot.settings.songstats;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "songstats"}));
                        }
                    }
                }
            },

            sourceCommand: {
                command: 'source',
                rank: 'user',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat('/me This bot was created by ' + botCreator + ".");
                    }
                }
            },

            statusCommand: {
                command: 'status',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var from = chat.un;
                        var msg = '/me [@' + from + '] ';

                        msg += 'afkremoval: ';
                        if (plugBot.settings.afkRemoval) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';
                        msg += "afksremoved: " + plugBot.room.afkList.length + '. ';
                        msg += 'afklimit: ' + plugBot.settings.maximumAfk + '. ';
                    
                        msg += 'blacklist: ';
                        if (plugBot.settings.blacklistEnabled) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += 'chatfilter: ';
                        if (plugBot.settings.filterChat) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        msg += 'voteskip: ';
                        if (plugBot.settings.voteskip) msg += 'ON';
                        else msg += 'OFF';
                        msg += '. ';

                        var launchT = plugBot.room.roomstats.launchTime;
                        var durationOnline = Date.now() - launchT;
                        var since = plugBot.roomUtilities.msToStr(durationOnline);
                        msg += subChat("I have been active for %%TIME%%.", {time: since});

                        return API.sendChat(msg);
                    }
                }
            },

            swapCommand: {
                command: 'swap',
                rank: 'mod',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var firstSpace = msg.indexOf(' ');
                        var lastSpace = msg.lastIndexOf(' ');
                        var name1 = msg.substring(cmd.length + 2, lastSpace);
                        var name2 = msg.substring(lastSpace + 2);
                        var user1 = plugBot.userUtilities.lookupUserName(name1);
                        var user2 = plugBot.userUtilities.lookupUserName(name2);
                        if (typeof user1 === 'boolean' || typeof user2 === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified. (No names with spaces!)", {name: chat.un}));
                        if (user1.id === plugBot.loggedInID || user2.id === plugBot.loggedInID) return API.sendChat(subChat("/me @%%NAME%%, don't try to add me to the waitlist, please.", {name: chat.un}));
                        var p1 = API.getWaitListPosition(user1.id) + 1;
                        var p2 = API.getWaitListPosition(user2.id) + 1;
                        if (p1 < 0 || p2 < 0) return API.sendChat(subChat("/me [@%%NAME%%] Please only swap users that are in the waitlist!", {name: chat.un}));
                        API.sendChat(subChat("/me Swapping %%NAME1%% with %%NAME2%%.", {'name1': name1, 'name2': name2}));
                        if (p1 < p2) {
                            plugBot.userUtilities.moveUser(user2.id, p1, false);
                            setTimeout(function (user1, p2) {
                                plugBot.userUtilities.moveUser(user1.id, p2, false);
                            }, 2000, user1, p2);
                        }
                        else {
                            plugBot.userUtilities.moveUser(user1.id, p2, false);
                            setTimeout(function (user2, p1) {
                                plugBot.userUtilities.moveUser(user2.id, p1, false);
                            }, 2000, user2, p1);
                        }
                    }
                }
            },

            toggleblCommand: {
                command: 'togglebl',
                rank: 'bouncer',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var temp = plugBot.settings.blacklistEnabled;
                        plugBot.settings.blacklistEnabled = !temp;
                        if (plugBot.settings.blacklistEnabled) {
                          return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "blacklist"}));
                        }
                        else return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "blacklist"}));
                    }
                }
            },

            unbanCommand: {
                command: 'unban',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        $(".icon-population").click();
                        $(".icon-ban").click();
                        setTimeout(function (chat) {
                            var msg = chat.message;
                            if (msg.length === cmd.length) return API.sendChat();
                            var name = msg.substring(cmd.length + 2);
                            var bannedUsers = API.getBannedUsers();
                            var found = false;
                            var bannedUser = null;
                            for (var i = 0; i < bannedUsers.length; i++) {
                                var user = bannedUsers[i];
                                if (user.username === name) {
                                    bannedUser = user;
                                    found = true;
                                }
                            }
                            if (!found) {
                                $(".icon-chat").click();
                                return API.sendChat(subChat("/me [@%%NAME%%] The user was not banned.", {name: chat.un}));
                            }
                            API.moderateUnbanUser(bannedUser.id);
                            console.log("Unbanned " + name);
                            setTimeout(function () {
                                $(".icon-chat").click();
                            }, 1000);
                        }, 1000, chat);
                    }
                }
            },

            unlockCommand: {
                command: 'unlock',
                rank: 'mod',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        plugBot.roomUtilities.booth.unlockBooth();
                    }
                }
            },

            unmuteCommand: {
                command: 'unmute',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var permFrom = plugBot.userUtilities.getPermission(chat.uid);
                        var from = chat.un;
                        var name = msg.substr(cmd.length + 2);

                        var user = plugBot.userUtilities.lookupUserName(name);

                        if (typeof user === 'boolean') return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));

                        var permUser = plugBot.userUtilities.getPermission(user.id);
                        if (permFrom > permUser) {
                            try {
                                API.moderateUnmuteUser(user.id);
                                API.sendChat(subChat("/me [@%%NAME%%] Unmuted @%%USERNAME%%.", {name: chat.un, username: name}));
                            }
                            catch (e) {
                                API.sendChat(subChat("/me [@%%NAME%%] that user wasn't muted.", {name: chat.un}));
                            }
                        }
                        else API.sendChat(subChat("/me [@%%NAME%%] You can't unmute persons with an equal or higher rank than you.", {name: chat.un}));
                    }
                }
            },

            usercmdcdCommand: {
                command: 'usercmdcd',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        var cd = msg.substring(cmd.length + 1);
                        if (!isNaN(cd)) {
                            plugBot.settings.commandCooldown = cd;
                            return API.sendChat(subChat("/me [@%%NAME%%] The cooldown for commands by users is now set to %%TIME%% seconds.", {name: chat.un, time: plugBot.settings.commandCooldown}));
                        }
                        else return API.sendChat(subChat("/me [@%%NAME%%] Invalid time specified.", {name: chat.un}));
                    }
                }
            },

            usercommandsCommand: {
                command: 'usercommands',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.settings.usercommandsEnabled) {
                            API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "usercommands"}));
                            plugBot.settings.usercommandsEnabled = !plugBot.settings.usercommandsEnabled;
                        }
                        else {
                            API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "usercommands"}));
                            plugBot.settings.usercommandsEnabled = !plugBot.settings.usercommandsEnabled;
                        }
                    }
                }
            },

            voteratioCommand: {
                command: 'voteratio',
                rank: 'bouncer',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        var msg = chat.message;
                        if (msg.length === cmd.length) return API.sendChat(subChat("/me [@%%NAME%%] No user specified.", {name: chat.un}));
                        var name = msg.substring(cmd.length + 2);
                        var user = plugBot.userUtilities.lookupUserName(name);
                        if (user === false) return API.sendChat(subChat("/me [@%%NAME%%] Invalid user specified.", {name: chat.un}));
                        var vratio = user.votes;
                        var ratio = null;
                        if (vratio.meh == 0){
                            ratio = vratio.woot;
                        }else{
                            ration = vratio.woot / vratio.meh;
                        }
                        
                        API.sendChat(subChat("/me [@%%NAME%%] @%%USERNAME%% ~ woots: %%WOOT%%, mehs: %%MEHS%%, ratio (w/m): %%RATIO%%.", {name: chat.un, username: name, woot: vratio.woot, mehs: vratio.meh, ratio: ratio.toFixed(2)}));
                    }
                }
            },

            welcomeCommand: {
                command: 'welcome',
                rank: 'manager',
                type: 'exact',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        if (plugBot.settings.welcome) {
                            plugBot.settings.welcome = !plugBot.settings.welcome;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% disabled.", {name: chat.un, 'function': "welcomemsg"}));
                        }
                        else {
                            plugBot.settings.welcome = !plugBot.settings.welcome;
                            return API.sendChat(subChat("/me [@%%NAME%%] %%FUNCTION%% enabled.", {name: chat.un, 'function': "welcomemsg"}));
                        }
                    }
                }
            },

            clearlistCommand: {
                command: 'clearlist',
                rank: 'manager',
                type: 'startsWith',
                functionality: function (chat, cmd) {
                    if (this.type === 'exact' && chat.message.length !== cmd.length) return void (0);
                    if (!plugBot.commands.executable(this.rank, chat)) return void (0);
                    else {
                        API.sendChat(subChat("/me [%%NAME%% cleared waitlist.]", {name: chat.un}));
                        var msg = chat.message;
                        var lock = !(msg.length === cmd.length);
                        plugBot.roomUtilities.booth.lockBooth();
                        var wlist = API.getWaitList();
                        for (var i = 0; i < wlist.length; i++) {
                            API.moderateRemoveDJ(wlist[i].id);
                        }
                        if(!lock)
                        {
                            setTimeout(function () {
                                plugBot.roomUtilities.booth.unlockBooth();
                            }, 1000);
                        }
                    }
                }
            }
        }
    };
    plugBot.startup();
}).call(this);
