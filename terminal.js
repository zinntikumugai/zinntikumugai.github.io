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