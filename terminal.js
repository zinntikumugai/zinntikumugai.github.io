var shell = $('.shell').resizable({
    minHeight: 108,
    minWidth: 250
}).draggable({
    handle: '> .status-bar .title'
});
// functions
function progress(percent, width) {
    var size = Math.round(width * percent / 100);
    var left = '', taken = '', i;
    for (i = size; i--;) {
        taken += '=';
    }
    if (taken.length > 0) {
        taken = taken.replace(/=$/, '>');
    }
    for (i = width - size; i--;) {
        left += ' ';
    }
    return '[' + taken + left + '] ' + percent + '%';
}
// functions
// no touch
var animation = false;
var timer;  //progress function
var prompt;
var string;
// no touch
var helpList = [];
var commands = {};
//progress <size> [time(s)]
commands['progress'] = function (cmd, command, term) {
    var i = 0,
        size = (typeof cmd.args[0] === 'number' ) ? cmd.args[0] : 100,
        sec = (typeof cmd.args[1] === 'number') ? cmd.args[1] : 10;
    prompt = term.get_prompt();
    string = progress(0, size);
    term.set_prompt(progress);
    animation = true;
    (function loop() {
        string = progress(i++, size);
        term.set_prompt(string);
        if (i < 100) {
            timer = setTimeout(loop, sec * 10 - sec);
        } else {
            term.echo(progress(i, size) + ' [[b;green;]OK]')
                .set_prompt(prompt);
            animation = false
        }
    })();
};
commands['test'] = function (cmd, command, term) {
    var cmdt = {
        command: "progress 100 10",
        args: [
            100,
            10
        ]
    };
    return commands['progress'](cmdt, cmdt.command, term)
};
commands['status'] = function (cmd, command, term) {
    var custom_uptime_ratio = [1, 7, 30, 365]; //dont remove
    $.ajax({
        type: 'GET',
        url: "./service.json",
        success: (json) => {
            json.forEach((data) => {
                var name = data.name;
                if(data.enable !== true) {
                    return;
                }
                $.ajax({
                    type: 'POST',
                    url: 'https://api.uptimerobot.com/v2/getMonitors',
                    data: {
                        api_key: data.apikey,
                        custom_uptime_ratios: custom_uptime_ratio.join('-'),
                        all_time_uptime_ratio: 1,
                        format: 'json'
                    },
                    success: (json) => {
                        if (json.stat != "ok") {
                            trem.echo(`[${name}]: ERROR`);
                            return;
                        }
                        var monitor = json.monitors[0];
                        var typeStr = (monitor => {
                            if (monitor.type === 1) return "HTTP/HTTPS";
                            else if (monitor.type === 2) return "Keyword";
                            else if (monitor.type === 3) return "Ping";
                            else if (monitor.type === 4) return "Port";
                            else return "NULL";
                        })(monitor);
                        var subTypeStr = (monitor => {
                            if (monitor.type !== 4) return null;
                            else {
                                if (monitor.sub_type === 1) return "HTTP";
                                else if (monitor.sub_type === 2) return "HTTPS";
                                else if (monitor.sub_type === 3) return "FTP";
                                else if (monitor.sub_type === 4) return "SMTP";
                                else if (monitor.sub_type === 5) return "POP3";
                                else if (monitor.sub_type === 6) return "IMAP";
                                else return monitor.port;
                            }
                        })(monitor);
                        var statusStr = (monitor => {
                            
                            var list = [
                                {
                                    id: 0,
                                    color: "#D2691E",
                                    str: "Paused"
                                }, {
                                    id: 1,
                                    color: "#D2691E",
                                    str: "Not Checkd Yet"
                                }, {
                                    id: 2,
                                    color: "#008000",
                                    str: "Up"
                                }, {
                                    id: 8,
                                    color: "#D2691E",
                                    str: "Seems Down"
                                }, {
                                    id: 9,
                                    color: "#FF0000",
                                    str: "Down"
                                }, {
                                    id: -1,
                                    color: "#FF0000",
                                    str: "Error"
                                }, {
                                    id: -2,
                                    color: "#FF0000",
                                    str: "STOP"
                                }
                            ];
                            var str = "";
                            var t = "";
                            var size = 0;
                            list.forEach(data => {
                                if (monitor.status === data.id) {
                                    str = `[[b;${data.color};]${data.str}]`;
                                    t = data.str;
                                    size = str.length - data.str.length;
                                }
                            });
                            if(str === ""){
                                list.forEach(data => {
                                    if (-1 === data.id) {
                                        str = `[[b;${data.color};]${data.str}]`;
                                        t = data.str;
                                        size = str.length - data.str.length;
                                    }
                                });
                            }
                            if (data.running === false) {

                                list.forEach(data => {
                                    if (-2 === data.id) {
                                        str = `[[bu;${data.color};]${data.str}]`;
                                        t = data.str;
                                        size = str.length - data.str.length;
                                    }
                                });
                            }
                            str = ((" ").repeat(20) + str).slice(-28);
                            return str;
                        })(monitor);
                        var customUptimeRatio = (monitor => {
                            var obj = {};
                            var data = monitor.custom_uptime_ratio.split('-');
                            custom_uptime_ratio.forEach((v, i, a) => {
                                obj[v] = data[i];
                            });
                            return obj;
                        })(monitor);
                        var str = [];
                        var sp = `\t> ------ | ${(('-').repeat(25))}`;
                        var url = ( monitor => {
                            var s = monitor.url;
                            s = s.replace(/https?:\/\//,'');
                            s = s.replace(/#.*$/,'');
                            return s;
                        })(monitor);
                        
                        str.push(`>[${name}]`);
                        //str.push("");
                        str.push(`\t> Type   | ${typeStr}${(subTypeStr !== null ? `(${subTypeStr})` : "")}`);
                        str.push(sp);
                        str.push(`\t> Status | ${statusStr}`);
                        str.push(sp);
                        Object.keys(customUptimeRatio).forEach(key => {
                            str.push(`\t>  Ratio |${(("     " + key).slice(-4))}[day]: ${('0000' + customUptimeRatio[key]).slice(-7)} %`);
                        });
                        str.push("");
                        term.echo(str.join('\n'));
                    },
                    error: () => {
                        term.echo("Opps.. Missing Get Data.");
                    }
                })
            });
        },
        error: ()=>{
            term.echo("Error Missing Data.");
        } 
    });
};

helpList.push('progress');
helpList.push('test');
helpList.push('status');
var term = $('.content').terminal(function (command, term) {
    var cmd = $.terminal.parse_command(command);
    console.log(JSON.stringify(cmd));
    switch (cmd.name) {
        // command
        case 'progress':
        case 'test':
        case 'status':
        // command
            var str;
            Object.keys(commands).forEach(function (name) {
                if (name == cmd.name) {
                    str = commands[name](cmd, command, term);
                }
            });
            if (typeof str === "string")
                this.echo(str);
            break;
        case 'help':
            var help = [];
            helpList.forEach((v, i, a) => {
                help.push(v);
            });
            help.push('help');
            help.push('clear');
            this.echo(help.sort().join(' '));
            break;
        default:
            this.echo("unknown command.");
    }
}, {
    greetings: function (set) {
        set(function () {
            var ascii_art = [
                " _______             _   _ _                                      _",
                "|___  (_)           | | (_) |                                    (_)",
                "   / / _ _ __  _ __ | |_ _| | ___   _ _ __ ___  _   _  __ _  __ _ _",
                "  / / | | '_ \\| '_ \\| __| | |/ / | | | '_ ` _ \\| | | |/ _` |/ _` | |",
                "./ /__| | | | | | | | |_| |   <| |_| | | | | | | |_| | (_| | (_| | |",
                "\\_____/_|_| |_|_| |_|\\__|_|_|\\_/\\__,_|_| |_| |_|\\__,_|\\__, |\\__,_|_|",
                "                                                       __/ |",
                "                                                      |___/",
                " _____                 _",
                "/  ___|               (_)",
                "\\ `--.  ___ _ ____   ___  ___ ___",
                " `--. \\/ _ \\ '__\\ \\ / / |/ __/ _ \\",
                "/\\__/ /  __/ |   \\ V /| | (_|  __/",
                "\\____/ \\___|_|    \\_/ |_|\\___\\___|",
                " _____ _        _",
                "/  ___| |      | |",
                "\\ `--.| |_ __ _| |_ _   _ ___",
                " `--. \\ __/ _` | __| | | / __|",
                "/\\__/ / || (_| | |_| |_| \\__ \\",
                "\\____/ \\__\\__,_|\\__|\\__,_|___/"
            ].join('\n');
            var cols = this.cols();
            var signature = [];
            if (cols >= 70) {
                signature.push(ascii_art);
                signature.push('');
            } else {
                signature.push("Zinntikumugai");
                signature.push("Service");
                signature.push("Status");
            }
            signature.push(">please type \"help\".");
            return signature.join('\n');
        });
    },
    name: 'zinntikumugai_service_status',
    prompt: 'status@Service:$ ',
    keydown: function (e, term) {
        if (animation) {
            if (e.which == 68 && e.ctrlKey) { // CTRL+D
                clearTimeout(timer);
                animation = false;
                term.echo(string + ' [[b;red;]FAIL]')
                    .set_prompt(prompt);
            }
            return false;
        }
    }
});
/*
$(function ($) {
    // functions
    function progress(percent, width) {
        var size = Math.round(width * percent / 100);
        var left = '', taken = '', i;
        for (i = size; i--;) {
            taken += '=';
        }
        if (taken.length > 0) {
            taken = taken.replace(/=$/, '>');
        }
        for (i = width - size; i--;) {
            left += ' ';
        }
        return '[' + taken + left + '] ' + percent + '%';
    }
    // functions
    // no touch
    var animation = false;
    var timer;  //progress function
    var prompt;
    var string;
    // no touch
    var helpList = [];
    var commands = {};
    //progress <size> [time(s)]
    commands['progress'] = function (cmd, command, term) {
        var i = 0, size = cmd.args[0], sec = (typeof cmd.args[1] !== 'undefined') ? cmd.args[1] : 10;
        prompt = term.get_prompt();
        string = progress(0, size);
        term.set_prompt(progress);
        animation = true;
        (function loop() {
            string = progress(i++, size);
            term.set_prompt(string);
            if (i < 100) {
                timer = setTimeout(loop, sec * 10 - sec);
            } else {
                term.echo(progress(i, size) + ' [[b;green;]OK]')
                    .set_prompt(prompt);
                animation = false
            }
        })();
    };
    commands['ping'] = function (cmd, command, term) {
        return "pong";
    };
    commands['test'] = function (cmd, command, term) {
        var cmdt = {
            command: "progress 100 10",
            args: [
                100,
                10
            ]
        };
        return commands['progress'](cmdt, cmdt.command, term)
    };
    commands['status'] = function (cmd, command, term) {

    };

    helpList.push('progress');
    helpList.push('ping');
    helpList.push('test');
    helpList.push('status');
    $('body').terminal(function (command, term) {
        var cmd = $.terminal.parse_command(command);
        switch (cmd.name) {
            // command
            case 'progress':
            case 'ping':
            case 'test':
            case 'status':
                // command
                var str;
                Object.keys(commands).forEach(function (name) {
                    if (name == cmd.name) {
                        str = commands[name](cmd, command, term);
                    }
                });
                if (typeof str === "string")
                    this.echo(str);
                break;
            case 'help':
                var help = [];
                helpList.forEach((v, i, a) => {
                    help.push(v);
                });
                help.push('help');
                this.echo(help.join(' '));
                break;
            default:
                this.echo("unknown command.");
        }
    }, {
        greetings: function (set) {
            set(function () {
                var ascii_art = [
                    " _______             _   _ _                                      _",
                    "|___  (_)           | | (_) |                                    (_)",
                    "   / / _ _ __  _ __ | |_ _| | ___   _ _ __ ___  _   _  __ _  __ _ _",
                    "  / / | | '_ \\| '_ \\| __| | |/ / | | | '_ ` _ \\| | | |/ _` |/ _` | |",
                    "./ /__| | | | | | | | |_| |   <| |_| | | | | | | |_| | (_| | (_| | |",
                    "\\_____/_|_| |_|_| |_|\\__|_|_|\\_\\__,_|_| |_| |_|\\__,_|\\__, |\\__,_|_|",
                    "                                                       __/ |",
                    "                                                      |___/",
                    " _____                 _",
                    "/  ___|               (_)",
                    "\\ `--.  ___ _ ____   ___  ___ ___",
                    " `--. \\/ _ \\ '__\\ \\ / / |/ __/ _ \\",
                    "/\\__/ /  __/ |   \\ V /| | (_|  __/",
                    "\\____/ \\___|_|    \\_/ |_|\\___\\___|",
                    " _____ _        _",
                    "/  ___| |      | |",
                    "\\ `--.| |_ __ _| |_ _   _ ___",
                    " `--. \\ __/ _` | __| | | / __|",
                    "/\\__/ / || (_| | |_| |_| \\__ \\",
                    "\\____/ \\__\\__,_|\\__|\\__,_|___/"
                ].join('\n');
                var cols = this.cols();
                var signature = [];
                if (cols >= 70) {
                    signature.push(ascii_art);
                    signature.push('');
                } else {
                    signature.push("Zinntikumugai");
                    signature.push("Service");
                    signature.push("Status");
                }
                signature.push(">please type \"help\".");
                return signature.join('\n');
            });
        },
        name: 'zinntikumugai_service_status',
        prompt: 'status@Service:$ ',
        keydown: function (e, term) {
            if (animation) {
                if (e.which == 68 && e.ctrlKey) { // CTRL+D
                    clearTimeout(timer);
                    animation = false;
                    term.echo(string + ' [[b;red;]FAIL]')
                        .set_prompt(prompt);
                }
                return false;
            }
        }
    });
});
*/