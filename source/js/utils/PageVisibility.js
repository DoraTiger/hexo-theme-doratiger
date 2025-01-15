/**
 * @description 初始化页面可见性监听，动态修改页面标题
 */
const initPageVisibility = () => {
    const doc = document;
    const originalTitle = doc.title;
    // 获取浏览器支持的 Page Visibility API 属性和事件
    const visibility = (() => {
        const prefixes = ["", "moz", "ms", "webkit"];
        for (const prefix of prefixes) {
            const stateKey = `${prefix}visibilityState`;
            const hiddenKey = `${prefix}hidden`;
            const changeKey = `${prefix}visibilitychange`;
            if (stateKey in doc && hiddenKey in doc) {
                return { stateKey, hiddenKey, changeKey };
            }
        }
        return null; // 如果不支持 Page Visibility API
    })();

    let timeoutId;

    doc.addEventListener(
        visibility.changeKey,
        () => {
            if (doc[visibility.stateKey] === "visible") {
                // 页面可见时，显示欢迎消息
                doc.title = "欢迎回来！d(`･∀･)b 👏";
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    doc.title = originalTitle; // 1 秒后恢复原始标题
                }, 1000);
            } else {
                // 页面不可见时，显示隐藏消息
                doc.title = "藏起来了 d(`x_x)b";
            }
        },
        false
    );
}

export {initPageVisibility}
