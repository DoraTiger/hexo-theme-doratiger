class Background {
    constructor() {
        this.starDensity = 0.216; // 星星密度
        this.speedCoeff = 0.05; // 速度系数
        this.width = 0; // 画布宽度
        this.height = 0; // 画布高度
        this.starCount = 0; // 星星数量
        this.giantColor = "180,184,240"; // 巨型星星颜色
        this.starColor = "226,225,142"; // 普通星星颜色
        this.cometColor = "226,225,224"; // 彗星颜色
        this.canva = document.getElementById("universe"); // 画布元素
        this.stars = []; // 星星数组
        this.universe = null; // 画布上下文
        this.animationFrameId = null; // 动画帧 ID

        this.init();
    }

    init() {
        this.windowResizeHandler();
        window.addEventListener(
            "resize",
            () => this.windowResizeHandler(),
            false
        );
        this.createUniverse();
    }

    // 窗口大小变化处理
    windowResizeHandler() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.starCount = this.width * this.starDensity; // 根据窗口宽度计算星星数量
        this.canva.setAttribute("width", this.width); // 设置画布宽度
        this.canva.setAttribute("height", this.height); // 设置画布高度

        // 重新初始化星星
        this.stars = [];
        this.createUniverse();
    }

    // 创建星空
    createUniverse() {
        this.universe = this.canva.getContext("2d"); // 获取画布上下文
        for (let i = 0; i < this.starCount; i++) {
            this.stars[i] = new Star(this); // 创建星星对象
            this.stars[i].reset(); // 初始化星星属性
        }
        this.startAnimation();
    }

    // 启动动画
    startAnimation() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId); // 取消之前的动画帧请求
        }
        this.draw();
    }

    // 绘制动画
    draw() {
        this.universe.clearRect(0, 0, this.width, this.height); // 清空画布
        for (const star of this.stars) {
            star.move(); // 移动星星
            star.fadeIn(); // 淡入效果
            star.fadeOut(); // 淡出效果
            star.draw(); // 绘制星星
        }
        this.animationFrameId = window.requestAnimationFrame(() => this.draw()); // 递归调用，实现动画
    }
}

// 星星类
class Star {
    constructor(background) {
        this.background = background;
        this.reset();
        this.twinkle = Math.random() * 0.5 + 0.5; // 闪烁速度
        this.twinkleDirection = 1; // 闪烁方向（1 表示变亮，-1 表示变暗）
    }
    // 更新闪烁效果
    twinkleEffect() {
        if (this.opacity >= this.opacityTresh) {
            this.twinkleDirection = -1; // 开始变暗
        } else if (this.opacity <= 0.2) {
            this.twinkleDirection = 1; // 开始变亮
        }
        this.opacity += this.twinkleDirection * this.twinkle * 0.04;
    }

    // 重置星星属性
    reset() {
        this.giant = this.getProbability(3); // 是否为巨型星星
        this.comet = this.giant ? false : this.getProbability(5); // 是否为彗星
        this.x = this.getRandInterval(0, this.background.width - 10); // 星星的初始 x 坐标
        this.y = this.getRandInterval(0, this.background.height); // 星星的初始 y 坐标
        this.r = this.getRandInterval(1.1, 2.6); // 星星的半径

        // 根据窗口大小调整速度
        const baseSpeed =
            this.background.speedCoeff * (this.background.width / 1000);
        this.dx =
            this.getRandInterval(baseSpeed, 6 * baseSpeed) +
            (this.comet + 1 - 1) * baseSpeed * this.getRandInterval(50, 120) +
            baseSpeed * 2; // x 方向速度
        this.dy =
            -this.getRandInterval(baseSpeed, 6 * baseSpeed) -
            (this.comet + 1 - 1) * baseSpeed * this.getRandInterval(50, 120); // y 方向速度

        if (this.comet) {
            this.dx = this.dx / 3;
            this.dy = this.dy / 3;
        }

        this.fadingOut = null; // 是否正在淡出
        this.fadingIn = true; // 是否正在淡入
        this.opacity = 0; // 初始透明度
        this.opacityTresh = this.getRandInterval(
            0.2,
            1 - (this.comet + 1 - 1) * 0.4
        ); // 透明度阈值
        this.do =
            this.getRandInterval(0.0005, 0.002) + (this.comet + 1 - 1) * 0.001; // 透明度变化速度
    }

    // 淡入效果
    fadeIn() {
        if (this.fadingIn) {
            this.fadingIn = !(this.opacity > this.opacityTresh); // 判断是否完成淡入
            this.opacity += this.do; // 增加透明度
        }
    }

    // 淡出效果
    fadeOut() {
        if (this.fadingOut) {
            this.fadingOut = !(this.opacity < 0); // 判断是否完成淡出
            this.opacity -= this.do / 2; // 减少透明度
            if (this.x > this.background.width || this.y < 0) {
                this.fadingOut = false;
                this.reset(); // 重置星星属性
            }
        }
    }

    // 绘制星星
    draw() {
        const { universe, giantColor, cometColor, starColor } = this.background;
        universe.beginPath();
        if (this.giant) {
            universe.fillStyle = `rgba(${giantColor},${this.opacity})`;
            // universe.arc(this.x, this.y, 2, 0, 2 * Math.PI, false); // 绘制巨型方框星星
            // universe.arc(this.x, this.y, 2, 0, 2 * Math.PI, false); // 绘制巨型圆形星星
            this.drawStar(this.x, this.y, 4, this.opacity); // 绘制巨型五角星星
        } else if (this.comet) {
            universe.fillStyle = `rgba(${cometColor},${this.opacity})`;
            universe.arc(this.x, this.y, 1.5, 0, 2 * Math.PI, false); // 绘制彗星头部
            // 绘制彗星尾巴
            for (let i = 1; i <= 30; i++) {
                universe.fillStyle = `rgba(${cometColor},${
                    this.opacity - (this.opacity / 20) * i
                })`;
                universe.arc(
                    this.x - this.dx * i,
                    this.y - this.dy * i,
                    1 - i / 30,
                    2 * Math.PI,
                    false
                );
                universe.fill();
            }
        } else {
            universe.fillStyle = `rgba(${starColor},${this.opacity})`;
            // universe.rect(this.x, this.y, this.r, this.r); // 绘制方框星星
            // universe.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false); // 绘制圆形星星
            // this.twinkleEffect();
            this.drawStar(this.x, this.y, this.r, this.opacity); // 绘制五角星星
        }
        universe.closePath();
        universe.fill();
    }

    // 移动星星
    move() {
        this.x += this.dx; // 更新 x 坐标
        this.y += this.dy; // 更新 y 坐标
        if (this.fadingOut === false) {
            this.reset(); // 重置星星属性
        }
        if (
            this.x > this.background.width - this.background.width / 4 ||
            this.y < 0
        ) {
            this.fadingOut = true; // 触发淡出效果
        }
    }

    // 概率判断
    getProbability(percents) {
        return Math.floor(Math.random() * 1000) + 1 < percents * 10; // 返回概率事件是否发生
    }

    // 随机数生成
    getRandInterval(min, max) {
        return Math.random() * (max - min) + min; // 返回指定范围内的随机数
    }

    drawStar(x, y, radius, opacity) {
        const { universe, starColor } = this.background;
        const spikes = 5; // 五角星
        const outerRadius = radius; // 外半径
        const innerRadius = radius * 0.4; // 内半径
        let rotation = (Math.PI / 2) * 3; // 起始角度
        let step = Math.PI / spikes; // 每个顶点的角度间隔

        universe.beginPath();
        universe.moveTo(x, y - outerRadius); // 从顶部开始

        for (let i = 0; i < spikes; i++) {
            // 外顶点
            universe.lineTo(
                x + Math.cos(rotation) * outerRadius,
                y + Math.sin(rotation) * outerRadius
            );
            rotation += step;

            // 内顶点
            universe.lineTo(
                x + Math.cos(rotation) * innerRadius,
                y + Math.sin(rotation) * innerRadius
            );
            rotation += step;
        }

        universe.lineTo(x, y - outerRadius); // 回到起点
        universe.closePath();
        universe.fillStyle = `rgba(${starColor},${opacity})`;
        universe.fill();
    }
}

// 导出 Background 类
export default Background;
