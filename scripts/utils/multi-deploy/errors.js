'use strict';

const messages = {
    ALGOLIA_ENV: ['ALGOLIA_INDEX_NAME conflicts with the target theme index; unset it or align it before retrying.', 'ALGOLIA_INDEX_NAME 与目标主题索引冲突，请取消该环境变量或调整为一致后重试。', 'ALGOLIA_INDEX_NAME 與目標主題索引衝突，請取消該環境變數或調整為一致後重試。'],
    ALGOLIA: ['Target Algolia command failed; check SDK installation, credentials and index permissions. Remote writes may be partial; verify before retrying.', '目标 Algolia 命令失败，请检查 SDK、凭据及索引权限；远端可能已部分更新，重试前请核对。', '目標 Algolia 命令失敗，請檢查 SDK、憑據及索引權限；遠端可能已部分更新，重試前請核對。'],
    PAGES_CONFIG: ['Invalid publish.pages configuration: use a boolean enable and an optional bare domain cname (no scheme, path or IP address).', 'publish.pages 配置无效：enable 为布尔值，cname 可选且只能填写域名，不能包含协议、路径或 IP 地址。', 'publish.pages 配置無效：enable 為布林值，cname 可選且只能填寫網域，不能包含協定、路徑或 IP 位址。'],
    PAGES_CONFLICT: ['Pages files conflict: check source/generated CNAME against publish.pages.cname and ensure .nojekyll is a file.', 'Pages 文件冲突：请核对源文件或生成的 CNAME 与 publish.pages.cname 是否一致，并确保 .nojekyll 是文件。', 'Pages 檔案衝突：請核對來源或產生的 CNAME 與 publish.pages.cname 是否一致，並確保 .nojekyll 是檔案。'],
    SERVER_ARGS: ['Select one target; use --static, --port (1-65535), and --ip (IPv4 address) only.', '请选择一个目标；可使用 --static、--port（1-65535）和 --ip（IPv4 地址）。', '請選擇一個目標；可使用 --static、--port（1-65535）和 --ip（IPv4 位址）。'],
    SERVER: ['Hexo preview failed. Check the target configuration and installed server plugin.', 'Hexo 预览失败，请检查目标配置及已安装的 server 插件。', 'Hexo 預覽失敗，請檢查目標配置及已安裝的 server 插件。'],
    PORT: ['Cannot listen on this IP/port; check availability and permissions.', '无法监听此 IP/端口，请检查端口占用和权限。', '無法監聽此 IP/連接埠，請檢查占用和權限。'],
    SERVING: ['Watching; refresh the browser after updates:', '正在预览；更新后请刷新浏览器：', '正在預覽；更新後請重新整理瀏覽器：'],
    SERVING_STATIC: ['Serving verified artifact:', '正在预览已校验产物：', '正在預覽已校驗產物：'],
    RESTARTING: ['Inputs changed; restarting isolated Hexo.', '输入已变化，正在重启隔离 Hexo。', '輸入已變化，正在重新啟動隔離 Hexo。'],
    WAITING_INPUT: ['Inputs are still being saved; retrying when stable.', '输入仍在保存，等待稳定后重试。', '輸入仍在儲存，等待穩定後重試。'],
    CONFIRM: ['Deletion requires --apply --yes, without --dry-run.', '删除需要同时指定 --apply --yes，不能同时使用 --dry-run。', '刪除需要同時指定 --apply --yes，不能同時使用 --dry-run。'],
    EMPTY_HISTORY: ['No local publication records.', '暂无本地发布记录。', '暫無本機發布記錄。'],
    KEEP: ['Keep', '保留', '保留'], REMOVE: ['Remove', '删除', '刪除'],
    PREVIEW: ['Preview only: items and bytes to remove', '仅预览：待删除项数和字节数', '僅預覽：待刪除項數與位元組數'],
    CLEANED: ['Deleted items and bytes', '已删除项数和字节数', '已刪除項數與位元組數'],
    published: ['Published', '已发布', '已發布'], unchanged: ['Unchanged', '无变化', '無變更'],
    failed: ['Failed', '失败', '失敗'], skipped: ['Skipped', '未执行', '未執行'],
    unconfirmed: ['Unconfirmed', '结果未确认', '結果未確認'],
    latest: ['Latest artifact', '最新产物', '最新產物'], retention: ['Retention policy', '保留策略', '保留策略'],
    'other-target': ['Other target', '其他目标', '其他目標'], 'shared-input': ['Referenced or unassigned input', '仍引用或未分配的输入', '仍引用或未分配的輸入'],
    'old-run': ['Unreferenced run', '不再引用的运行副本', '不再引用的執行副本'],
    'old-build': ['Old build', '旧构建', '舊構建'], 'incomplete-build': ['Incomplete build', '未完成构建', '未完成構建'],
    'git-attempts': ['Finished Git attempts', '已结束的 Git 临时目录', '已結束的 Git 暫存目錄'],
    'old-record': ['Old publication record', '旧发布记录', '舊發布記錄'],
    'atomic-temp': ['Interrupted atomic write', '中断的原子写入临时文件', '中斷的原子寫入暫存檔'],
    FORCE: ['Force push may overwrite remote commits and take over this branch.', '强制推送可能覆盖远端提交并接管此分支。', '強制推送可能覆蓋遠端提交並接管此分支。'],
    AUTH: ['Missing or invalid Git token environment variable.', 'Git 令牌环境变量缺失或无效。', 'Git 權杖環境變數缺失或無效。'],
    DISABLED: ['Multi-target publishing is disabled.', '多目标发布尚未启用。', '多目標發布尚未啟用。'],
    TARGET: ['Select a valid target or --all.', '请选择有效目标或 --all。', '請選擇有效目標或 --all。'],
    CONFIG: ['Invalid multi-target configuration.', '多目标配置无效。', '多目標配置無效。'],
    PATH: ['Unsafe or unsupported path.', '路径不安全或不受支持。', '路徑不安全或不受支援。'],
    LOCK: ['Workspace is occupied; verify its lock owner before recovery.', '工作目录被占用，请核对锁的拥有者后处理。', '工作目錄被佔用，請核對鎖的擁有者後處理。'],
    CONTEXT: ['Invalid managed build context.', '隔离构建上下文无效。', '隔離構建上下文無效。'],
    STALE: ['Build inputs changed; generate this target again.', '构建输入已变化，请重新生成该目标。', '構建輸入已變化，請重新產生該目標。'],
    ARTIFACT: ['Missing or modified build artifact.', '构建产物缺失或已被修改。', '構建產物缺失或已被修改。'],
    BUILD: ['Hexo build failed; nothing was published.', 'Hexo 构建失败，未发布该产物。', 'Hexo 構建失敗，未發布該產物。'],
    GIT: ['Git operation failed; check credentials, identity and destination.', 'Git 操作失败，请检查凭据、作者身份和目标。', 'Git 操作失敗，請檢查憑據、作者身分和目標。'],
    GIT_MISSING: ['Git is not installed or is not on PATH. Install Git, then verify with git --version and retry.', '未安装 Git 或 Git 不在 PATH 中。请安装 Git，执行 git --version 确认可用后重试。', '未安裝 Git 或 Git 不在 PATH 中。請安裝 Git，執行 git --version 確認可用後重試。'],
    OWNERSHIP: ['Refusing an unmanaged or differently owned branch.', '拒绝接管未受管理或归属不同的分支。', '拒絕接管未受管理或歸屬不同的分支。'],
    CDN: ['Synchronize a matching CDN manifest explicitly before building.', '请先显式同步与目标匹配的 CDN manifest。', '請先明確同步與目標匹配的 CDN manifest。'],
};
function fail(code) { const error = new Error(`MULTI_${code}`); error.multiCode = code; throw error; }
function describe(error, language) {
    const code = error.multiCode || 'CONFIG';
    return `[MULTI_${code}] ${translate(code, language)}`;
}
function translate(code, language) {
    const lang = String(Array.isArray(language) ? language[0] : language || 'en');
    const index = /zh-(Hant|TW|HK)/i.test(lang) ? 2 : /^zh/i.test(lang) ? 1 : 0;
    return messages[code][index];
}
module.exports = { fail, describe, translate };
