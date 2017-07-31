var socketio = require('socket.io');
var io;
var guest_num = 0;
var userlist = new Array();
// 外部接口
exports.listen = function(server) {

    io = socketio(server);

    io.on('connection', function (socket) {
        var addedUser = false;


        /* *************** 用户emit消息"join"时，响应 *************** */
        socket.on('join', function (username) {
            if (addedUser) return;

            // 用户信息存储在socket会话中
            socket.username = username;
            ++guest_num;
            addedUser = true;
// 用户信息存储在socket会话中：在此之前，要检查是否重复
            for(var i=0; i<userlist.length; i++) {
                if(userlist[i] == username) {
                    username = username+Math.ceil(Math.random()*10000);
                    break;
                }
            }

            // 告知用户登录成功
            socket.emit('login', {
                username: socket.username,
                numUsers: guest_num
            });
            userlist.push(username)  // 将昵称加入数组
            // 广播告知所有用户
            socket.broadcast.emit('user_joined', {
                username: socket.username,
                msg: "欢迎 "+socket.username + " 进入聊天室",
                type: "BROADCAST",
                numUsers: guest_num
            });
        });


        /* *************** 用户离开 *************** */
        socket.on('disconnect', function () {
            if (addedUser) {
                --guest_num;

                // 告知所有用户
                socket.broadcast.emit('user_left', {
                    username: socket.username,
                    msg: socket.username + "离开了聊天室！",
                    type: "BROADCAST",
                    numUsers: guest_num
                });
            }
        });

        /* *************** 更改昵称 *************** */
        socket.on('change_name', function (newname) {
            if (addedUser) {
                var oldname = socket.username;
                socket.username = newname;
                for(var i=0; i<userlist.length; i++) {
                    if(userlist[i] == newname) {
                        // 通知该用户修改成功
                        socket.emit('name_changed_msg', {
                            res: "failed",
                            error: "已有此用户："+newname,
                            oldname: oldname,
                            newname: newname,
                            type: "RETURN"
                        });
                        return -1;
                    }
                }
                // 通知该用户修改成功
                socket.emit('name_changed_msg', {
                    res: "success",
                    error: null,
                    oldname: oldname,
                    newname: newname,
                    msg: "["+oldname+"] 改名为 ["+socket.username + "]",
                    type: "RETURN",
                    numUsers: guest_num
                });

                for(var i=0; i<userlist.length; i++) {
                    if(userlist[i] == oldname) {
                        userlist[i] = newname;
                        socket.username = newname;
                    }
                }


                // 告知所有用户
                socket.broadcast.emit('name_changed', {
                    username: newname,
                    msg: "["+oldname+"] 改名为 ["+socket.username + "]",
                    type: "BROADCAST",
                    numUsers: guest_num
                });
            }
        });


        /* *************** 发送消息 *************** */
        socket.on('send_msg', function (msg) {
            if (addedUser) {

                // 广播消息
                socket.broadcast.emit('msg_sent', {
                    username: socket.username,
                    msg: msg,
                    type: "BROADCAST",
                });
            }
        });
        /* *************** 更多 *************** */
        // 在这里添加更多监听的消息
        // ...
        /* *************** 更改昵称 *************** */


        // 移除数组元素
        var removeArr = function(arr, ele) {
            var new_arr = new Array();
            for(var i=0; i<arr.length; i++) {
                if(ele != arr[i]) {
                    new_arr.push(arr[i])
                }
            }
            return new_arr;
        }



    });

};

