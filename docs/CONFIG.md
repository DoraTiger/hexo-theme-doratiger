# Hexo Theme DoraTiger 配置文档

所有配置均在 `_config.hexo-theme-doratiger.yml` 中修改，不要直接改主题源码。

## 配置初始化（themeinit）

1. 原始配置项

    ```bash
    hexo themeinit
    hexo themeinit --legacy
    ```

2. 配置项说明

    - `hexo themeinit`：初始化主题配置到博客根目录 `_config.hexo-theme-doratiger.yml`。
    - `--legacy`：额外生成旧版兼容配置 `source/_data/doratiger_config.yml`。
    - `--force`：目标文件存在时强制覆盖。

3. 配置建议

    - 新站点直接使用根目录 `_config.hexo-theme-doratiger.yml`。
    - 仅在需要兼容历史项目时再启用 `--legacy`。

---

## 第一部分：主题基本功能

### 全局配置

1. 原始配置项

    ```yaml
    global:
      hello: true
      favicon: /images/favicon_default.png
      avatar: /images/avatar_default.png
    ```

2. 配置项说明

    - `hello`：控制台启动提示。
    - `favicon`：浏览器标签页图标路径。
    - `avatar`：默认头像路径。

3. 配置建议

    - `favicon`、`avatar` 建议放在 `source/images/` 下，填写逻辑站内路径（如 `/images/avatar.png`）。主题会通过 Hexo `url_for` 解析，站点部署到子路径时无需改写为 `/blog/images/...`。

---

### 侧边栏

1. 原始配置项

    ```yaml
    sidebar:
      info:
        enable: true
        user: ""
        avatar: ""
        description: ""
      social:
        enable: true
        item:
          - { text: "Github", url: "https://github.com/DoraTiger" }
      toc:
        enable: true
        number: false
        depth: 3
      friendlink:
        enable: true
        item:
          - { text: "站点名", url: "https://example.com" }
    ```

2. 配置项说明

    - `info`：站点信息区，留空时回退到 Hexo 全局信息。
    - `social.item`：社交链接列表。
    - `toc`：文章目录开关、编号、层级深度与前导符号。
    - `friendlink`：友链模块与链接列表。

3. 配置建议

    - `toc.depth` 建议 `2-3`，过深会影响移动端阅读。
    - 社交链接保持 `3-6` 个更利于视觉平衡。

---

### 导航栏

1. 原始配置项

    ```yaml
    header:
      menu:
        - { key: "home", url: "/" }
        - { key: "archives", url: "/archives" }
        - { key: "categories", url: "/categories" }
        - { key: "tags", url: "/tags" }
        - { key: "about", url: "/about" }
      time:
        enable: true
    ```

2. 配置项说明

    - `menu`：导航菜单配置。
    - `menu[].key`：对应 `languages/*.yml` 的翻译键。
    - `menu[].url`：导航目标链接。
    - `time.enable`：右上角时间显示开关。

3. 配置建议

    - 常用内置 key：`home`、`archives`、`categories`、`tags`、`about`、`terms`、`privacy`、`redirect`、`page404`。
    - 自定义 key 时同步补充语言包翻译。

---

### 页脚

1. 原始配置项

    ```yaml
    footer:
      since:
        enable: true
        year: 2018
      beian:
        miit:
          enable: false
          text: "豫 ICP 备 xxxxxx 号 -1"
          link: "https://beian.miit.gov.cn"
        mps:
          enable: false
          text: "豫公网安备 xxxxxxxxxx 号"
          link: "https://www.beian.gov.cn/..."
          icon: "/images/police_beian.png"
      community_records:
        enable: false
        items:
          - name: "萌ICP备"
            text: "萌ICP备2026xxxx号"
            url: "https://icp.gov.moe/?keyword=2026xxxx"
            icon: "/images/community-records/moe-icp.png"
    ```

2. 配置项说明

    - `since`：站点起始年份展示。
    - `beian.miit`：工信部备案信息。
    - `beian.mps`：公安备案信息与图标。
    - `community_records`：可选的社区或娱乐性质记录，不替代法定备案。`items` 按配置顺序输出；每项包含 `name`、`text`、`url`，并可选 `icon`。宽度不足时，社区记录按配置顺序优先折叠，法定备案最后保留。

3. 配置建议

    - 图标建议放入主题 `source/images/`（例如 `/images/community-records/moe-icp.png`），填写逻辑站内路径。主题会通过 Hexo `url_for` 解析，因此部署到子路径时无需改写为 `/blog/images/...`。
    - 也可填写完整的 HTTPS 图标 URL；主题会保留绝对地址，不会错误地拼接站点 `root`。本地缓存仍是默认建议，可避免第三方图标的可用性或防盗链影响页脚。
    - 所有备案图标共用统一组件，固定显示为 `16×16px`，并使用 `object-fit: contain` 保持图形比例。

---

### 首页

1. 原始配置项

    ```yaml
    home:
      auto_excerpt:
        enable: true
        length: 200
      post_meta:
        date: true
        update: true
        categories: true
        tags: true
        excerpt: true
    ```

2. 配置项说明

    - `auto_excerpt.enable`：启用自动摘要。
    - `auto_excerpt.length`：摘要最大字数。
    - `post_meta`：首页文章元信息显示项。

3. 配置建议

    - 推荐配合文章中的 `<!-- more -->` 精确控制摘要截断。

---

### 文章页

1. 原始配置项

    ```yaml
    post:
      post_meta:
        date: true
        update: true
        categories: true
        tags: true
        excerpt: true
      highlight:
        enable: true
        type: "highlight.js"
        line_number: true
        copy: true
      copyright:
        enable: true
        license: "CC BY-NC-SA 4.0"
        link: "https://creativecommons.org/licenses/by-nc-sa/4.0/"
        email: ""
    ```

2. 配置项说明

    - `post_meta`：文章页元信息显示项。
    - `highlight`：代码高亮与复制功能。
    - `copyright`：版权声明内容。

3. 配置建议

    - `copyright.email` 留空时，建议在 Hexo 全局配置里设置 `email`。

---

#### 代码复制（post.highlight.copy）

1. 原始配置项

    ```yaml
    post:
      highlight:
        copy: true
    ```

2. 配置项说明

    - `copy`：是否显示代码复制按钮。

3. 配置建议

    - 浏览器优先使用 `navigator.clipboard`，受限场景会回退到 `document.execCommand("copy")`。

---

#### AI 辅助声明（post_extend.ai_declaration）

主题默认配置：

```yaml
post_extend:
  ai_declaration:
    enable: true
```

仅在文章 Front Matter 提供有效工具名称时显示；无需修改已有文章。设为 `false` 可全站关闭。

```yaml
ai:
  tools:
    - name: ChatGPT
      provider: OpenAI
      model: 你实际使用的模型名称
  usage:
    - 资料整理
    - 文字润色
  note: 技术操作与测试结果由作者实际验证。
```

- `tools`：工具列表，每项仅 `name` 必填；`provider`、`model` 可省略，不由主题自动识别。
- `usage`：可选的参与环节列表；`note`：可选补充说明。示例中的核验承诺应按实际情况填写，不会自动补充。
- 顶部元数据提供声明锚点；单工具显示名称，多工具显示数量。文末在作者、原文链接与版权信息之后用一条普通信息行汇总工具与用途，可选补充说明使用次级文字，不增加独立标题或分隔线。
- 首页预览不显示；关闭版权许可说明不影响 AI 声明。缺失 `ai`、`ai: false`、空工具列表或无有效名称均不显示，也不代表“纯人工创作”。
- 界面标签支持简体中文、繁体中文、英文；工具、厂商、模型、用途和说明是作者原文，不做自动翻译，按纯文本转义输出。
- AI 声明属于公开元数据；即使正文加密也会显示，请勿在其中填写保密信息。

#### 阅读时间（post_extend.reading_time）

1. 原始配置项

    ```yaml
    post_extend:
      reading_time:
        enable: true
        wpm: 300
    ```

2. 配置项说明

    - `enable`：是否显示字数与预计阅读时长。
    - `wpm`：每分钟阅读字数。

3. 配置建议

    - 字数按正文纯文本计算，预计时长向上取整且最少 1 分钟。

---

#### 文章二维码（post_extend.qrcode）

1. 原始配置项

    ```yaml
    post_extend:
      qrcode:
        enable: true
        size: 120
        tip: "" # 留空使用当前语言的内置文案
    ```

2. 配置项说明

    - `enable`：开启文章二维码。
    - `size`：二维码尺寸（像素）。
    - `tip`：二维码下方提示文案；留空时使用当前语言的内置文案。

3. 配置建议

    - `position` 已废弃，不再生效。
    - 移动端建议 `size` 设为 `96-140`。

---

#### 赞赏功能（post_extend.sponsor）

1. 原始配置项

    ```yaml
    post_extend:
      sponsor:
        enable: true
        tip: "" # 留空使用当前语言的内置文案
        alipay: "/images/alipay.jpg"
        wechat: "/images/wechat.jpg"
    ```

2. 配置项说明

    - `enable`：是否显示赞赏按钮。
    - `tip`：赞赏面板提示文案；留空时使用当前语言的内置文案。
    - `alipay`：支付宝收款码路径。
    - `wechat`：微信收款码路径。

3. 配置建议

    - 路径填写逻辑站内路径（如 `/images/alipay.jpg`）；主题会通过 Hexo `url_for` 适配站点根路径或子路径部署。
    - 图片建议放在博客 `source/images/` 目录。
    - 任一字段留空时，对应二维码不渲染。
    - 默认二维码仅用于演示，请替换为自己的收款码。

---

### 归档页

1. 原始配置项

    ```yaml
    archive: {}
    ```

2. 配置项说明

    - 当前归档页无额外配置项，按主题默认渲染。

3. 配置建议

    - 归档展示优先通过文章发布时间与分类规划来优化信息结构。

---

### 分类页

1. 原始配置项

    ```yaml
    category:
      enable: true
    ```

2. 配置项说明

    - `enable`：是否启用分类页。

3. 配置建议

    - 不使用分类体系时可关闭，简化导航结构。

---

### 标签页

1. 原始配置项

    ```yaml
    tag:
      enable: true
    ```

2. 配置项说明

    - `enable`：是否启用标签页。

3. 配置建议

    - 标签过多时建议统一命名规范，避免同义标签碎片化。

---

### 关于页

1. 原始配置项

    ```yaml
    about:
      enable: true
    ```

2. 配置项说明

    - `enable`：是否启用关于页。

3. 配置建议

    - 首次使用请先执行 `hexo new page about` 创建页面。

---

### 服务条款页（terms）

1. 原始配置项

    ```yaml
    terms:
      enable: true
      title: "" # 留空使用当前语言的页面标题
      license: ""
      extra_content: ""
    ```

2. 配置项说明

    - `enable`：是否启用服务条款页。
    - `title`：页面标题；留空时使用当前语言的内置标题与正文。
    - `license`：知识产权声明；留空时当前条款页显示默认的 `CC BY-NC-SA 4.0`。
    - `extra_content`：额外条款内容，支持 HTML。

3. 配置建议

    - 面向公开访问站点建议开启，减少合规歧义。
    - 如需与文章版权声明保持一致，请显式填写 `terms.license`；不要依赖隐式继承。

---

### 隐私政策页（privacy）

1. 原始配置项

    ```yaml
    privacy:
      enable: true
      title: "" # 留空使用当前语言的页面标题
      extra_content: ""
    ```

2. 配置项说明

    - `enable`：是否启用隐私政策页。
    - `title`：页面标题；留空时使用当前语言的内置标题与正文。
    - `extra_content`：额外内容，支持 HTML。

3. 配置建议

    - 使用统计、评论、第三方资源时建议补充数据处理声明。

---

### 外链重定向页（redirect）

1. 原始配置项

    ```yaml
    redirect:
      enable: true
      source: "" # 留空使用 Hexo 的 config.title
      method: "exclude"   # include | exclude
      include:
      exclude:
    ```

2. 配置项说明

    - `enable`：是否启用外链跳转确认页。
    - `source`：提示页来源文案；留空时使用 Hexo 的 `config.title`。
    - `method`：重定向策略（`include` 或 `exclude`）。
    - `include`：仅在 `method=include` 时生效，命中列表才重定向。
    - `exclude`：仅在 `method=exclude` 时生效，命中列表不重定向。
    - 域名规则支持“精确匹配 + 子域名匹配”，例如配置 `example.com` 可匹配 `www.example.com`。

3. 配置建议

    - 若使用 `exclude`，建议将常用外部白名单域名放入 `exclude`（如代码托管、文档站）。
    - 若使用 `include`，请显式填写需要跳转确认的目标域名列表；留空时不会触发重定向。
    - 站内链接默认不重定向，无需额外加入名单。

---

### 404 页面（page404）

1. 原始配置项

    ```yaml
    page404:
      enable: true
      redirect_delay: 5000
    ```

2. 配置项说明

    - `enable`：是否生成 404 页面。
    - `redirect_delay`：自动跳转延迟（毫秒）。

3. 配置建议

    - 静态站点 404 生效依赖托管平台或 Web Server 规则。
    - Nginx 参考：

    ```nginx
    error_page 404 /404.html;
    location = /404.html {
        root /path/to/hexo/public;
        internal;
    }
    ```

---

### 样式

1. 原始配置项

    ```yaml
    style:
      appearance: "night"
      accent: "#E7A63A"
      accent_secondary: "#73C4F5"
      typography:
        font_size: "16px"
      layout:
        content_width: "46rem"
        sidebar_width: "18rem"
    ```

2. 配置项说明

    - `appearance`：初始外观策略。`night` 为默认星空，`day` 为日照配色，`system` 跟随浏览器的系统配色偏好；页头月/日按钮可在浏览器本地覆盖此初始选择，不会改写主题配置。
    - `accent`、`accent_secondary`：主强调色与次强调色，分别用于主操作/当前状态和链接/辅助定位。日间会基于配置色自动加深，避免浅色背景上的对比度不足；自定义配色仍需检查昼夜两种效果。
    - `typography.font_size`：基础字号。
    - `layout.content_width`：正文最大阅读宽度。
    - `layout.sidebar_width`：桌面侧栏宽度；低于 1280px 时不提供侧栏，顶部导航改用全屏菜单。

3. 配置建议

    - `font_size` 常用区间为 `14px-18px`。
    - 长文站点建议保持 `content_width` 在 `42rem-50rem`，优先保证可读性而非单行塞入更多文字。
    - 不再提供按按钮、卡片、代码块逐项拆分的颜色配置；这些组件使用主题内部语义令牌，以保持昼夜两套外观的一致性。

---

### 资源管理

1. 原始配置项

    ```yaml
    resource:
      enable_cdn: false
    ```

2. 配置项说明

    - `enable_cdn`：全局 CDN 开关。

3. 配置建议

    - 资源级开关优先级高于全局开关。
    - 支持资源：`highlight.js`、`busuanzi`、`twikoo`、`valine`、`algolia`、`font_awesome`、`mathjax`。

---

### 第三方资源

1. 原始配置项

    ```yaml
    thirdparty:
      font_awesome:
        enable_cdn:
        local: { css: ["/lib/font-awesome/@6.7.2/css/all.min.css"] }
        cdn: { css: ["https://cdnjs.cloudflare.com/..."] }
      mathjax:
        enable_cdn:
        local: { js: ["/lib/mathjax/@3.2.2/tex-mml-chtml.js"] }
        cdn: { js: ["https://www.unpkg.com/..."] }
    ```

2. 配置项说明

    - `thirdparty.<name>.enable_cdn`：资源级 CDN 开关。
    - `local`：本地资源列表。
    - `cdn`：CDN 资源列表。

3. 配置建议

    - 国内网络场景建议优先本地或可达性更好的 CDN。
    - 若只替换某一类资源，优先改该资源的 `enable_cdn`，避免影响全站。

---

### 多语言

1. 原始配置项

    ```yaml
    # Hexo 根配置 _config.yml
    language: zh-Hans
    ```

2. 配置项说明

    - 语言包目录：`languages/`。
    - 已内置：`zh-Hans`、`zh-Hant`、`en`。

3. 配置建议

    - 自定义文案优先在语言包中维护，避免写死在模板里。

---

## 第二部分：主题扩展功能（功能性）

### 文章置顶

1. 原始配置项

    ```markdown
    ---
    sticky: 100
    ---
    ```

2. 配置项说明

    - `sticky`：置顶权重，值越大排序越靠前。

3. 配置建议

    - 建议按 `10/50/100` 分档，便于长期维护。

---

### 文章加密（encrypt）

1. 原始配置项

    ```yaml
    encrypt:
      enable: true
      abstract: "" # 留空使用当前语言的内置文案
      message: ""
      wrong_pass_message: ""
      tags:
        # - name: "private"
        #   password: "shared-password"
    ```

2. 配置项说明

    - `enable`：启用加密能力。
    - `abstract` / `message`：加密提示文案；留空时使用当前语言的内置文案。
    - `wrong_pass_message`：密码错误提示文案；留空时使用当前语言的内置文案。
    - `tags`：按标签批量加密规则。

3. 配置建议

    - 单篇可在 front-matter 中用 `password` 覆盖。
    - 加密内容建议在 HTTPS 下使用。
    - 加密文章默认不参与本地搜索，除非 front-matter 显式 `search: true`。
    - 旧配置中的 `encrypt.theme` 与 `encrypt.wrong_hash_message` 会被保留以兼容历史配置，但当前自建加密流程不会读取它们。

---

### 搜索（search）

1. 原始配置项

    ```yaml
    search:
      enable: true
      type: "algolia"   # algolia | local
    ```

2. 配置项说明

    - `enable`：是否启用搜索功能。
    - `type`：搜索类型（Algolia 或本地搜索）。

3. 配置建议

    - 中小站点优先 `local`，低维护成本。
    - 大规模内容与多条件检索优先 `algolia`。

---

#### Algolia 搜索

1. 原始配置项

    ```yaml
    search:
      algolia:
        app_id: "YOUR_APP_ID"
        api_key: "YOUR_INDEX_API_KEY"
        search_key: ""
        index_name: ""
        fields:
          - title
          - slug
          - excerpt
          - permalink
          - date
          - updated
          - tags
          - categories
          - layout
        hit:
          per_page: 10
          empty: "" # 留空使用当前语言的内置文案
          placeholder: ""
    ```

2. 配置项说明

    - `app_id` / `api_key` / `search_key` / `index_name`：Algolia 基础凭据与索引名。
    - `fields`：索引字段白名单。
    - `hit`：前端搜索 UI 文案与分页；`empty`、`placeholder` 留空时使用当前语言的内置文案。

3. 配置建议

    - 先安装 SDK：`npm install algoliasearch`。
    - 常用命令：`hexo algolia`、`hexo algolia --clean`、`hexo algolia --dry-run`。

---

#### 本地搜索

1. 原始配置项

    ```yaml
    search:
      local:
        hits:
          per_page: 10
        path:
          - search.json
        field:
          - post
          - page
        field_merge_strategy: "merge"   # merge | replace
        content: false
        content_max_length: 5000
        hit:
          placeholder: "" # 留空使用当前语言的内置文案
          empty: ""
    ```

2. 配置项说明

    - `hits.per_page`：每页结果数。
    - `path`：索引文件路径（支持字符串或数组）。
    - `field`：索引范围（post/page）。
    - `field_merge_strategy`：数组策略（`merge` 或 `replace`）。
    - `content`：是否索引正文全文。
    - `content_max_length`：正文索引长度上限。
    - `hit`：前端搜索 UI 文案。

3. 配置建议

    - `field` 同时包含 `post` 和 `page` 不会默认重复，主题会按 URL 去重。
    - 想“严格按用户配置覆盖数组”时用 `replace`。
    - front-matter 可用：

    ```markdown
    ---
    search: false
    password: xxx
    search: true
    ---
    ```

---

#### Local 搜索合并差异

1. 原始配置项

    | 配置项 | 主题默认配置 | 用户配置行为 | 最终合并结果 | 备注 |
    |---|---|---|---|---|
    | `search.local.hits.per_page` | `10` | 标量覆盖 | 以用户值为准 | 常规覆盖 |
    | `search.local.path` | `['search.json']` | 数组合并 | 可能保留默认尾项 | 生成器兼容 string/array |
    | `search.local.field` + `merge` | `['post','page']` | 数组合并 | 可能保留默认 `page` | 默认策略 |
    | `search.local.field` + `replace` | `['post','page']` | 读取用户原始配置 | 以用户数组为准 | 严格覆盖 |
    | `search.local.content` | `false` | 标量覆盖 | 以用户值为准 | `true` 时生成 content |
    | `search.local.content_max_length` | `5000` | 标量覆盖 | 以用户值为准 | 仅 `content=true` 生效 |

2. 配置项说明

    - Hexo deepMerge 对数组按索引合并，不是整数组替换。

3. 配置建议

    - 追求可预测结果时，`field_merge_strategy` 优先用 `replace`。

---

### 统计（statistics）

1. 原始配置项

    ```yaml
    statistics:
      enable: true
      type: "counter"   # busuanzi | counter
    ```

2. 配置项说明

    - `enable`：统计开关。
    - `type`：统计来源类型。

3. 配置建议

    - 生产环境优先 `counter`，避免第三方统计不稳定。

---

#### busuanzi

1. 原始配置项

    ```yaml
    statistics:
      busuanzi:
        pv: true
        uv: true
    ```

2. 配置项说明

    - `pv`：页面访问量。
    - `uv`：独立访客数。

3. 配置建议

    - busuanzi 在部分网络环境下可用性不稳定。

---

#### counter（自建）

1. 原始配置项

    ```yaml
    statistics:
      counter:
        api: ""
        uv: true
    ```

2. 配置项说明

    - `api`：计数 API 地址；留空时使用 localStorage。
    - `uv`：是否统计 UV。

3. 配置建议

    - API 请求会携带页面路径与访客标识：`GET /count?page=<path>&uid=<visitor-id>`。推荐返回稳定的四个字段：`{ site_pv, site_uv, page_pv, page_uv }`；关闭 `counter.uv` 时页面显示 PV，开启时显示 UV。

---

### 评论（comment）

1. 原始配置项

    ```yaml
    comment:
      enable: true
      type: "twikoo"   # gitment | valine | twikoo
    ```

2. 配置项说明

    - `enable`：评论总开关。
    - `type`：评论平台类型。

3. 配置建议

    - 配置填写位置：博客根目录 `_config.hexo-theme-doratiger.yml`。
    - 平台资源加载受 `thirdparty.gitment / valine / twikoo` 与 `resource.enable_cdn` 共同影响。
    - 当前实现仅读取配置文件字段，不读取评论相关环境变量。

---

#### Gitment（GitHub Issues）

1. 原始配置项

    ```yaml
    comment:
      enable: true
      type: "gitment"
      gitment:
        owner: "你的 GitHub 用户名或组织"
        repo: "用于存放评论 Issue 的仓库名"
        client_id: "GitHub OAuth App Client ID"
        client_secret: "GitHub OAuth App Client Secret"
    ```

2. 配置项说明

    - `owner`：评论仓库所属账号。
    - `repo`：评论仓库名。
    - `client_id` / `client_secret`：GitHub OAuth 凭据。

3. 配置建议

    - Gitment 前端会使用 OAuth 参数，`client_secret` 存在暴露风险。
    - 对密钥暴露敏感时，优先 Twikoo 或服务端托管方案。

---

#### Valine（LeanCloud）

1. 原始配置项

    ```yaml
    comment:
      enable: true
      type: "valine"
      valine:
        appId: "LeanCloud AppID"
        appKey: "LeanCloud AppKey"
        placeholder: "欢迎留言"
    ```

2. 配置项说明

    - `appId`：LeanCloud 应用 ID。
    - `appKey`：LeanCloud 应用 Key。
    - `placeholder`：输入框占位提示。

3. 配置建议

    - 若评论不显示，先检查 LeanCloud 应用域名与安全策略设置。

---

#### Twikoo（自部署 / 云函数）

1. 原始配置项

    ```yaml
    comment:
      enable: true
      type: "twikoo"
      twikoo:
        envId: "你的 Twikoo 环境 ID 或服务地址"
    ```

2. 配置项说明

    - `envId`：Twikoo 初始化参数（环境 ID 或服务地址）。

3. 配置建议

    - 评论不显示时按顺序检查：`comment.enable` → `comment.type` → `thirdparty` 资源可达性。

---

### Sitemap（sitemap）

1. 原始配置项

    ```yaml
    sitemap:
      enable: true
      format: "both"     # xml | txt | both
      changefreq: "weekly"
      priority:
        home: 1.0
        post: 0.8
        page: 0.6
        category: 0.5
        tag: 0.5
        archive: 0.4
    ```

2. 配置项说明

    - `enable`：开启站点地图生成。
    - `format`：输出格式。
    - `changefreq`：默认更新频率。
    - `priority`：各类页面优先级。

3. 配置建议

    - front-matter 使用 `sitemap: false` 可排除单篇文章。

---

### Robots（robots）

1. 原始配置项

    ```yaml
    robots:
      enable: true
      disallow:
        - /admin/
        - /api/
        - /tmp/
    ```

2. 配置项说明

    - `enable`：启用 robots.txt 生成。
    - `disallow`：爬虫禁止路径列表。

3. 配置建议

    - `sitemap` 地址会自动关联站点 URL。

---

### 正文图片 CDN（cdn_image）

此功能默认关闭。它只处理已发布文章正文中引用的本地图片；不会修改 Markdown 源文件，也不会扫描 `public/`、页面 front-matter、主题资源或外部 URL。

1. 原始配置项

    ```yaml
    cdn_image:
      enable: true
      provider: qiniu
      public_base_url: https://cdn.example.com
      key_prefix: images
      manifest_path: plugins/cdn_image/.hexo-cdn-image-manifest.json
      fallback:
        enable: true
      qiniu:
        bucket: your-bucket
        region: z0
        access_key: ""
        secret_key: ""
    ```

2. 配置项说明

    - `key_prefix` 默认为 `images`；本地逻辑路径保持不变，例如文章中引用的 `source/images/a.png` 会上传为 `images/images/a.png`。
    - 凭据也可通过 `QINIU_AccessKey` 与 `QINIU_SecretKey` 环境变量提供，优先级高于配置文件。不要将含凭据的主站配置提交到公开仓库。
    - 设置 `cdn_image.fallback.enable: true` 后，主题会为已改写的图片保留本地候选路径，并按需注入一个浏览器端监听器。CDN 图片加载失败时，它只回退一次到随站点发布的本地图片；未启用时不添加此脚本或任何回退属性。

3. 使用命令

    在 Hexo 根目录执行：

    ```bash
    hexo cdn sync
    hexo cdn check
    hexo cdn prune
    ```

    `sync` 仅从已发布文章的原始内容及其 Hexo 资源模型发现图片、上传新增或变更项，并将 manifest 写入 `<Hexo 根目录>/plugins/cdn_image/.hexo-cdn-image-manifest.json`。它需要开启功能并提供完整的七牛 bucket、region 和凭据。之后正常 `hexo generate` 会按 manifest 动态将正文 HTML 改写为 CDN URL。`check` 离线检查 manifest 与正文资源是否一致，不需要访问对象存储。`prune` 默认仅列出 manifest 中已不再引用的对象；实际删除必须明确使用 `hexo cdn prune --apply --yes`，且只会删除当前 manifest 管理的对象。主题不会更改主站的 Git 忽略或提交策略。

---

## 附录

### 构建缓存说明

1. 原始配置项

    ```bash
    npx hexo clean && npx hexo generate
    ```

2. 配置项说明

    - 修改 `scripts/filters/*` 等构建期逻辑后，建议清理并重建。

3. 配置建议

    - 避免 Hexo db 缓存导致 `public/` 保留旧 HTML。

---

### Commit Message 规范

详见 [贡献指南](./CONTRIBUTING.md)（中文）| [Contributing](./CONTRIBUTING_en.md)（English）。
