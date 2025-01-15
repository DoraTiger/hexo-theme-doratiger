"use strict";
const log = require("../../utils/log");
module.exports = (hexo) => {
    const showHello =
        (hexo.theme.config.global.hello || true) &&
        hexo.theme.config.global.hello_once;
    if (!showHello) return;
    log(
        hexo,
        `
    --------------------------------------------------------------
    |                                                             |
    |    DDDDD      OOO      RRRRR      A      TTTTT     III      |
    |    D    D    O   O     R    R    A A       T        I       |
    |    D    D    O   O     R    R   A   A      T        I       |
    |    D    D    O   O     RRRRR    AAAAA      T        I       |
    |    D    D    O   O     R  R     A   A      T        I       |
    |    DDDDD      OOO      R   R    A   A      T       III      |
    |                                                             |
    |                  欢迎使用 DoraTiger 主题                    |
    |                                                             |
    --------------------------------------------------------------
    `,
        `
    --------------------------------------------------------------
    |                                                             |
    |    DDDDD      OOO      RRRRR      A      TTTTT     III      |
    |    D    D    O   O     R    R    A A       T        I       |
    |    D    D    O   O     R    R   A   A      T        I       |
    |    D    D    O   O     RRRRR    AAAAA      T        I       |
    |    D    D    O   O     R  R     A   A      T        I       |
    |    DDDDD      OOO      R   R    A   A      T       III      |
    |                                                             |
    |             Welcome to use DoraTiger Theme                  |
    |                                                             |
    --------------------------------------------------------------
    `
    );
    hexo.theme.config.global.hello_once = false;
};
