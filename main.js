// RequestAnimFrame: a browser API for getting smooth animations
// window.requestAnimFrame = (function() {
//     return //window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
//     function(callback) {
//         window.setTimeout(callback, 1000 / 60 / 10);
//     };
// })();

window.requestAnimFrame = function(callback) {window.setTimeout(callback, 1000 / 72);};

var canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d');

var width = 422, //宽高
    height = 552;

canvas.width = width; //设置画布大小
canvas.height = height;

//游戏全局变量
var platforms = [], //存放踏板的数组
    playerNum = 10,
    image = document.getElementById("sprite"), //获取Html中的ID
    player, player2,
    playerList = [player, player2], //玩家数组
    platformCount = 10, //10个踏板
    position = 0, //控制每个踏板一定的高度
    gravity = 0.2, //重力影响值
    animLoop, //函数变量，后面使用
    flag = 0, //游戏结束时空之玩家上移一段距离
    menuloop, //函数变量，后面使用
    broken = 0, //防止连续两个红色踏板
    dir, //全局方向变量
    score = 0, //分数
    firstRun = true; //判断是否点击Play按钮进入游戏


//地面
var Base = function() {
    this.height = 5; //要显示的地面高、宽
    this.width = width;

    //裁剪尺寸
    this.cx = 0;
    this.cy = 614; //地面y轴切割位置
    this.cwidth = 100; //裁剪的宽高
    this.cheight = 5;
    this.x = 0;
    this.y = height - this.height; //552-5  画布底部5厘米绘制

    this.draw = function() {
        try { //      裁剪x坐标     y        宽            高     显示x坐标    y       宽           高
            ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
        } catch (e) {}
    };
};

var base = new Base();

//玩家对象
var Player = function() {
    this.vy = 11; //y方向速度
    this.vx = 0; //x方向速度

    this.isMovingLeft = false; //左移
    this.isMovingRight = false; //右移
    this.isDead = false; //死亡

    this.width = 55; //显示的大小
    this.height = 40; //显示的大小

    //裁剪尺寸
    this.cx = 0;
    this.cy = 0; //由方向确定画哪个位置裁剪图
    this.cwidth = 110; //裁剪的宽高
    this.cheight = 80;

    this.dir = "left"; // 默认左方向

    this.x = Math.random() * width - this.width / 2; //422/2  - 55/2  =  211 - 27.5 = 183.5
    this.y = height; //  40

    //绘制函数
    this.draw = function() {
        try {
            if (this.dir == "right") this.cy = 121;
            else if (this.dir == "left") this.cy = 201;
            else if (this.dir == "right_land") this.cy = 289;
            else if (this.dir == "left_land") this.cy = 371;
            //      裁剪x坐标     y        宽            高     显示x坐标    y       宽           高
            ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
        } catch (e) {}
    };
    this.jump = function() {
        this.vy = -8; //一般情况下y方向速度为-8
    };
    this.jumpHigh = function() {
        this.vy = -16; //踩到弹簧时的速度
    };
};

//屏蔽
player = new Player();
player2 = new Player();

// //新建player对象
// for (var i = 0; i < playerList.length; i++) {
//     playerList[i] = new Player();
// }


//踏板
function Platform() {
    this.width = 70; //要显示的大小
    this.height = 17;
    this.x = Math.random() * (width - this.width); // 422 - 70 = 352  0最左，352最右，随机一个x轴位置
    this.y = position; // 0
    position += (height / platformCount); // 552 / 10 = 55.2
    this.flag = 0; //0 红色未踩
    this.state = 0; //0 白色未踩
    //裁剪尺寸
    this.cx = 0;
    this.cy = 0; // 根据类型确定位置
    this.cwidth = 105;
    this.cheight = 31;
    //绘制
    this.draw = function() {
        try {
            if (this.type == 1) this.cy = 0; //绿色
            else if (this.type == 2) this.cy = 61; //蓝色
            else if (this.type == 3 && this.flag === 0) this.cy = 31; //红色
            else if (this.type == 3 && this.flag == 1) this.cy = 1000; /////////////////////无
            else if (this.type == 4 && this.state === 0) this.cy = 90; //白色
            else if (this.type == 4 && this.state == 1) this.cy = 1000; /////////////////////无
            //      裁剪x坐标     y        宽            高     显示x坐标    y       宽           高
            ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
        } catch (e) {}
    };
    //Platform types              平台类型
    //1: Normal                     正常
    //2: Moving                     移动
    //3: Breakable (Go through)   易碎(通过)
    //4: Vanishable
    //Setting the probability of which type of platforms should be shown at what score
    //根据分数决定显示哪些踏板类型 1 绿  2 蓝  3 红  4 白
    if (score >= 5000) this.types = [2, 3, 3, 3, 4, 4, 4, 4]; //8
    else if (score >= 2000 && score < 5000) this.types = [2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4]; //11
    else if (score >= 1000 && score < 2000) this.types = [2, 2, 2, 3, 3, 3, 3, 3]; //8
    else if (score >= 500 && score < 1000) this.types = [1, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]; //13
    else if (score >= 100 && score < 500) this.types = [1, 1, 1, 1, 2, 2]; // 6
    else this.types = [1]; // 1
    this.type = 4
    // this.types[Math.floor(Math.random() * this.types.length)]; // 任取当前types数组一个踏板类型
    //不能同时放两个易碎踏板，否则可能无法继续游戏
    if (this.type == 3 && broken < 1) { //如果当前为红色踏板,且broken<1
        broken++;
    } else if (this.type == 3 && broken >= 1) { //如果当前为红色踏板,且broken >= 1
        this.type = 1; //设置this.type 为绿色踏板类型
        broken = 0;
    }
    this.vx = 1; //蓝色踏板 左右移动的速度
}

for (var i = 0; i < platformCount; i++) {
    platforms.push(new Platform()); // 数组保存10个踏板
}

//坏踏板对象
var Platform_broken_substitute = function() {
    this.height = 30; //要显示的大小
    this.width = 70;
    this.x = 0;
    this.y = 0;
    //裁剪尺寸
    this.cx = 0;
    this.cy = 554;
    this.cwidth = 105;
    this.cheight = 60;
    this.appearance = false; // 默认不显示
    this.draw = function() {
        try {
            if (this.appearance === true) //当要显示
                //      裁剪x坐标     y        宽            高     显示x坐标    y       宽           高
                ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
            else
                return;
        } catch (e) {}
    };
};

var platform_broken_substitute = new Platform_broken_substitute();

var spring = function() {
    //显示参数
    this.x = 0;
    this.y = 0;
    this.width = 26;
    this.height = 30;
    //裁剪参数，两种状态统一大小
    this.cx = 0;
    this.cy = 0;
    this.cwidth = 45;
    this.cheight = 53;
    this.state = 0; // 状态判断
    this.draw = function() {
        try {
            if (this.state === 0) this.cy = 445; // 未弹起
            else if (this.state == 1) this.cy = 501; // 弹起
            //绘制
            ctx.drawImage(image, this.cx, this.cy, this.cwidth, this.cheight, this.x, this.y, this.width, this.height);
        } catch (e) {}
    };
};

var Spring = new spring();

function init() {
    //游戏变量
    var dir = "left", // 局部变量dir为left
        jumpCount = 0; //控制红色踏板落下之后不再绘制出来
    firstRun = false; // 变量firstRun为false
    //每帧清除画布函数
    function paintCanvas() {
        ctx.clearRect(0, 0, width, height);
    }

    //角色计算函数   //
    function playerCalc() {
        if (dir == "left") { // 全局dir为left
            player.dir = "left";
            if (player.vy < -7 && player.vy > -15) //判断角色vy变量是否为 -15 ~ -7,相差8
                player.dir = "left_land";
        } else if (dir == "right") {
            player.dir = "right";
            if (player.vy < -7 && player.vy > -15)
                player.dir = "right_land";
        }

        goLeft = function(){
            dir = "left";
            player.isMovingLeft = true;
        }

        goRight = function(){
            dir = "right";
            player.isMovingRight = true; //向右移
        }

        //添加键盘控制
        document.onkeydown = function(e) { //键盘按下
            var key = e.keyCode;
            if (key == 37) { //左箭头
                
            } else if (key == 39) { //右箭头

            }
            if (key == 32 || key == 87) { // W键 或 空格键
                if (firstRun === true)
                    init();
                else
                    reset();
            }
        };
        //取消左右移动
        document.onkeyup = function(e) {
            var key = e.keyCode;
            if (key == 37) {
                dir = "left";
                player.isMovingLeft = false;
            } else if (key == 39) {
                dir = "right";
                player.isMovingRight = false;
            }
        };
        //按住键时加速
        if (player.isMovingLeft === true) { // 当按下左键
            player.x += player.vx; // 增加一个变化量
            player.vx -= 0.15; // x速度向左变大
        } else {
            player.x += player.vx; // 保持移动
            if (player.vx < 0)
                player.vx += 0.1; // 减速
        }
        if (player.isMovingRight === true) { // 同上
            player.x += player.vx;
            player.vx += 0.15;
        } else {
            player.x += player.vx;
            if (player.vx > 0)
                player.vx -= 0.1;
        }
        // x方向速度限制
        if (player.vx > 8)
            player.vx = 8;
        else if (player.vx < -8)
            player.vx = -8;
        // 停下来时角色停止移动
        if (player.vx > -0.1 && player.vx < 0.1) {
            player.vx = 0;
        }
        //使角色踩到地面后跳起
        if ((player.y + player.height) > base.y && base.y < height) //角色底部大于地面y值，且地面y值小于画布高度
            player.jump(); //设置角色y方向速度向上为8 (-8)
        //碰到底部结束游戏
        //if (base.y > height && (player.y + player.height) > height && player.isDead != "lol") //地面y值大于画布高度，角色底部大于画布高度，isDead != lol
        //    player.isDead = true;
        //使角色左右穿墙
        if (player.x > width) //角色x值大于画布宽度（向右穿过）
            player.x = 0 - player.width; //使角色位于左边一个角色宽度
        else if (player.x < 0 - player.width) //向左穿过（同上）
            player.x = width;
        //重力影响玩家的移动
        if (player.y >= (height / 2) - (player.height / 2)) // 552/2 - 40/2 = 276 - 20 = 256
        {
            player.y += player.vy; //改变角色y值 
            player.vy += gravity; //改变影响值
        } else { //当玩家向上移动达到一半高度时，移动踏板来创建滚动的效果，并重新创建不在视口之外的踏板
            //踏板数组遍历
            platforms.forEach(function(p, i) { //p为值，i为下标
                if (player.vy < 0) { //如果此时玩家的y速度向上(负值)
                    p.y -= player.vy; //让每个踏板下移
                }
                if (p.y > height) { //当前i下标 踏板超出底部
                    platforms[i] = new Platform(); //随机新增
                    platforms[i].y = p.y - height; //无缝连接
                }
            });
            // base.y -= player.vy;  //此时地面下移
            player.vy += gravity; //vy为负的即向上减速，为正的向下加速，屏蔽此句即一直向上移动
            //上面这句让vy加到>=0后，做下面的判断，让角色向下移动
            if (player.vy >= 0) {
                player.y += player.vy;
                player.vy += gravity; //加速
            }
            score++; //分数+1
        }
        //角色碰到踏板时跳跃
        collides();
        if (player.isDead === true) // 如果玩家死亡
            gameOver();
    }

    //弹簧计算
    function springCalc() {
        var s = Spring;
        var p = platforms[0];
        if (p.type == 1 || p.type == 2) { //如果踏板数组第一个为绿或蓝
            s.x = p.x + p.width / 2 - s.width / 2; // 确定弹簧x y坐标
            s.y = p.y - p.height - 10;
            if (s.y > height / 1.1) //如果弹簧y值大于 552/1.1 = 501 53
                s.state = 0;
            s.draw(); //绘制
        } else { //放在左上角
            s.x = 0 - s.width;
            s.y = 0 - s.height;
        }
    }

    //踏板移动计算
    function platformCalc() {
        var subs = platform_broken_substitute;
        platforms.forEach(function(p, i) {
            if (p.type == 2) { //蓝色踏板移动
                if (p.x < 0 || p.x + p.width > width) //限制左右边框之内
                    p.vx *= -1; //改变速度方向
                p.x += p.vx; //左右来回移动
            }
            if (p.flag == 1 && subs.appearance === false && jumpCount === 0) { //踩红 且 坏红未显示 且 之前未踩红板
                subs.x = p.x; // 替换当前红色踏板
                subs.y = p.y;
                subs.appearance = true; //标志显示
                jumpCount++; //
            }
            p.draw(); //绘制
        });
        if (subs.appearance === true) { //如果显示了坏踏板
            subs.draw(); //绘制
            subs.y += 8; //下掉
        }
        if (subs.y > height)
            subs.appearance = false; // 出界就隐藏
    }

    function collides() {
        //匹配哪一块踏板跟玩家碰撞
        platforms.forEach(function(p, i) { //角色最多在踏板向右探出40           向左40                                    角色y值在踏板高度以内
            if (player.vy > 0 && p.state === 0 && (player.x + 15 < p.x + p.width) && (player.x + player.width - 15 > p.x) && (player.y + player.height > p.y) && (player.y + player.height < p.y + p.height)) {

                if (p.type == 3 && p.flag === 0) { //若此踏板为红板，且未踩此踏板
                    p.flag = 1; //踩了红色踏板
                    jumpCount = 0; //
                    return;
                } else if (p.type == 4 && p.state === 0) { //白
                    player.jump(); // 将y方向上的速度设置为-8，让玩家重新向上移动
                    p.state = 1;

                } else if (p.flag == 1) //踩完红板后的状态，不设置vy，让其继续向下落下
                    return;
                else {
                    player.jump(); // 否则即踩到绿或蓝，向上移动
                }
            }
        });

        //弹簧
        var s = Spring; //                        角色最多在弹簧向右探出40                        左40                            角色y值在弹簧高度以内
        if (player.vy > 0 && (s.state === 0) && (player.x + 15 < s.x + s.width) && (player.x + player.width - 15 > s.x) && (player.y + player.height > s.y) && (player.y + player.height < s.y + s.height)) {
            s.state = 1; //弹簧弹起
            player.jumpHigh(); //将y方向的速度设置为-16，即更快向上移动
        }

    }

    //获取分数id元素，显示分数
    function updateScore() {
        var scoreText = document.getElementById("score");
        scoreText.innerHTML = score;
    }

    function gameOver() {
        //遍历每块踏板
        platforms.forEach(function(p, i) {
            p.y -= 12; //上移
        });

        if (player.y > height / 2 && flag === 0) { // 如果玩家在画布中间以下，且 flag = 0
            player.y -= 8; //玩家上移
            player.vy = 0; //速度为0
        } else if (player.y < height / 2) // 如果玩家在画布中间以上
            flag = 1; //设置flag = 1
        else if (player.y + player.height > height) { //如果玩家超出画布底部
            showGoMenu(); //显示结束菜单
            hideScore(); //隐藏分数
            player.isDead = "lol"; //设置死亡标志位lol
        }
    }

    //状态更新调用
    function update() {
        paintCanvas(); //清除画布
        platformCalc(); //踏板计算
        springCalc(); //弹簧计算
        playerCalc(); //玩家计算
        player.draw(); //玩家绘制
        base.draw(); //底板绘制
        updateScore(); //分数更新
    }

    menuLoop = function() {
        return;
    };
    animLoop = function() {
        update();
        requestAnimFrame(animLoop);
    };

    animLoop();

    hideMenu(); //隐藏菜单
    showScore(); //显示分数
}

//重置函数
function reset() {
    hideGoMenu();
    showScore();
    player.isDead = false;

    flag = 0;
    position = 0;
    score = 0;

    base = new Base();
    player = new Player();
    Spring = new spring();
    platform_broken_substitute = new Platform_broken_substitute();

    platforms = [];
    for (var i = 0; i < platformCount; i++) {
        platforms.push(new Platform());
    }
}

//隐藏菜单
function hideMenu() {
    var menu = document.getElementById("mainMenu");
    menu.style.zIndex = -1;
}

//显示结束菜单
function showGoMenu() {
    var menu = document.getElementById("gameOverMenu");
    menu.style.zIndex = 1;
    menu.style.visibility = "visible";

    var scoreText = document.getElementById("go_score");
    scoreText.innerHTML = "You scored " + score + " points!";
}

//隐藏结束菜单
function hideGoMenu() {
    var menu = document.getElementById("gameOverMenu");
    menu.style.zIndex = -1;
    menu.style.visibility = "hidden";
}

//显示计分板
function showScore() {
    var menu = document.getElementById("scoreBoard");
    menu.style.zIndex = 1;
}

//隐藏计分板
function hideScore() {
    var menu = document.getElementById("scoreBoard");
    menu.style.zIndex = -1;
}

//初始化函数
init();