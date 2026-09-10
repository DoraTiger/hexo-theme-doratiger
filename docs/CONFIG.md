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

### 规范网址（canonical）

在 Hexo 根目录的主题主配置 `_config.hexo-theme-doratiger.yml` 中设置：

```yaml
canonical:
  enable: true
  base_url: ""  # 留空跟随 Hexo url/root，例如 https://primary.example.com/blog
```

- 默认自引用；`base_url` 可指定首选站点及子目录，仅接受 HTTP/HTTPS，不允许凭据、查询参数或片段。`enable: false` 关闭标签与规范地址筛选，sitemap 恢复当前站点地址。
- 映射替换整个部署前缀，保留页面相对路径，例如镜像 `/overseas/post/` 对应主站 `/blog/post/`，不叠加前缀。两端需保持相同路由，路径不同的文章需显式覆盖。
- 首页、文章、普通页面、分类、标签、归档和分页各自指向对应页面，不把第二页指向第一页。去掉结尾 `index.html`；普通 `.html` 遵循 `pretty_urls.trailing_html`；中文路径编码，自动地址去掉路由查询参数和片段。
- 404、外链中转页和未发布文章不输出标签。静态文件及 `layout: false` 页面不经过主题 head，不自动注入。
- Front Matter 支持 `canonical: "https://original.example.com/article/"` 覆盖完整地址，或 `canonical: false` 单独关闭。显式地址保留查询参数、去掉片段；非法地址报 `CANONICAL_CONFIG`，不回显配置值。
- 文章 JSON-LD 的 `mainEntityOfPage` 跟随 canonical，关闭时使用当前页面地址；`og:url`、导航、搜索、评论、二维码和版权链接保留当前部署域名。
- 普通构建与 multi 共用逻辑。公共主题配置的首选站点由子配置继承；目标若需自引用，可设置 `theme.canonical.base_url: ""`，不需要修改 multi。

canonical 是首选收录信号，不保证搜索引擎最终选择。不要同时启用其他 canonical/sitemap 插件；不要用 `Disallow: /` 或 `noindex` 阻挡镜像抓取。修改后执行 `hexo clean && hexo generate`，部署时移除旧产物，避免旧 sitemap 残留。

参考：[Google canonical 指南](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)、[Hexo URL helpers](https://hexo.io/docs/helpers#full-url-for)。

---

### Robots（robots）

```yaml
robots:
  enable: true
  disallow:
    - /admin/
    - /api/
    - /tmp/
```

- `enable`：启用 robots.txt 生成。
- `disallow`：保留用户配置，不因跨域 canonical 自动禁止镜像抓取。
- `Sitemap` 仅声明本主题计划生成的文件，与 `sitemap.format` 一致；关闭 sitemap 或没有有效条目时不声明，地址跟随当前部署的 `url/root`。

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

    - Front Matter 使用 `sitemap: false` 可排除文章或页面，但不关闭其 canonical。
    - canonical 开启时只列出自引用的规范 URL；同站别名、跨域镜像和 `canonical: false` 页面不列入。没有有效条目时不生成空文件；镜像若有显式自引用的独有页面，仍可生成只含这些页面的 sitemap。
    - XML/TXT 共用条目列表，遵循 Hexo 子目录和 pretty URL 设置，`priority: 0` 不会被默认值替换。

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

## 多目标构建、预览与发布（multi_deploy）

默认关闭，需要已安装 Hexo 依赖；本地预览还需宿主安装 `hexo-server`，Git 发布需系统 Git。普通 `hexo generate/server/deploy` 不改变；`multi-*` 命令始终注册，但执行时会检查公共主题配置中的开关。配置应放在 Hexo 根目录的 `_config.hexo-theme-doratiger.yml`：

```yaml
multi_deploy:
  enable: true
  work_dir: plugins/multi_deploy
  fingerprint_env: []
  cleanup:
    keep_builds: 3
    keep_records: 20
  targets:
    cn:
      config: doratiger_config.cn.yml
      publish:
        type: git
        repo: /absolute/path/to/cn.git
        branch: pages
    global:
      config: doratiger_config.global.yml
      publish:
        type: git
        repo: /absolute/path/to/global.git
        branch: pages
```

主题主配置负责管理整个 multi 功能：`enable`、运行目录、清理策略、环境变量摘要，以及 `targets` 下的目标名称、子配置路径和全部 `publish` 参数（仓库、分支、Pages、提交身份与认证）。这些都写在 Hexo 根目录的 `_config.hexo-theme-doratiger.yml` 中；主题仓库的 `_config.yml` 只是默认配置模板。

每个目标通过 `config` 关联一个子配置文件，子配置只负责个性化覆盖，顶层仅允许 `site` 和 `theme`。不要把 `multi_deploy` 或 `publish` 放进子配置，也不能在子配置的 `theme` 中重新定义 `multi_deploy`。例如 Hexo 根目录的 `doratiger_config.cn.yml`：

```yaml
site:
  url: https://cn.example.com
  root: /
theme:
  footer:
    beian:
      miit:
        enable: true
      mps:
        enable: true
  comment:
    enable: false
```

海外目标按需改域名、关闭备案展示、开启已经配置好的评论组件。未填写的字段继承公共配置，无需复制整份配置；例如只需开启评论时，子配置仅填写 `theme.comment.enable: true` 即可。名称不代表自动地域判断或合规规则。

- `config`：一个 YAML 文件路径，相对 Hexo 根目录；只允许 `site`、`theme` 顶层对象。禁止放在 source、主题 source 或多目标运行目录中，避免私有配置被当作静态资源公开。普通构建不扫描目标文件。
- `site`：覆盖公共 `_config.yml` 的站点字段；不能嵌套 `theme_config`，不能改变主题、部署器、输入/输出目录。主题差异只写在 `theme`。
- `theme`：通过现有提前合并路径覆盖公共主题配置，优先级最高；对象递归合并，数组替换，`false` 生效。不能修改 `multi_deploy` 自身。
- 公共 `theme_config` 仍兼容，并高于公共主题 YAML；目标的 `theme` 再覆盖它。目标文件只由当前主题命令加载，不回写原配置、不污染其他主题。
- 目标名称：使用小写字母开头，可含小写字母、数字、`_`、`-`，最长 48 个字符；`input` 是内部快照保留名称，不可作为目标。
- `work_dir`：默认 `<Hexo 根目录>/plugins/multi_deploy`，保存输入副本、产物、记录和发布缓存。用户应自行在宿主 Git 忽略该目录；主题不会修改 `.gitignore`。不可与 source、主题、public、scripts、scaffolds、node_modules 或 `.git` 目录重叠，避免运行数据被再次收进构建输入。
- `fingerprint_env`：影响渲染的环境变量名称列表；仅计入摘要，不保存变量明文。未声明的环境或实时远程数据不保证可复现。
- `publish`：开发预览目标可省略；构建/发布目标需配置，仅 `type: git`，`repo` 与 `branch` 必填；支持本地绝对路径、SSH、HTTPS，不允许 URL 内嵌凭据。不修改全局 Git 配置。
- `publish.message`：可选非空单行提交说明，默认 `Publish <目标名>`；内部 `Doratiger-Target` 与 `Doratiger-Artifact` trailer 始终追加，不支持模板表达式。
- `publish.name` / `publish.email`：可分别配置，覆盖该目标的作者与提交者姓名/邮箱；未提供的字段继承博客仓库 Git 配置或 `GIT_AUTHOR_*`、`GIT_COMMITTER_*` 环境变量。提交身份与认证账号无关。
- `publish.token`：可选，仅限 HTTPS，必须写成环境变量引用（例如 `"$BLOG_GIT_TOKEN"`），不接受令牌明文。变量须由 shell/CI 注入，命令不自动加载 `.env`。生成和 dry-run 不要求变量存在；实际发布前检查变量非空。令牌轮换无需重建（除非将该变量加入 `fingerprint_env`）。需要支持 `--config-env` 的系统 Git（2.31+）。
- `publish.username`：配合 token 的 HTTP Basic 认证用户名，默认 `git`，按托管平台要求填写；例如平台可能要求账户名、`oauth2` 或 `x-access-token`。令牌作为密码。未配置 token 时沿用系统 SSH agent/凭据助手。
- 令牌仅用于 Git 网络子进程的环境变量，不写入 URL、命令参数、Git 配置、构建记录或产物；令牌模式禁止 HTTP 重定向，避免发送到非预期位置，需填写最终仓库 URL。Git trace 被禁用以防旁路日志落盘。同一用户/root 仍可能读取进程环境，已有第三方构建插件仍属于受信任代码。

```bash
hexo multi-generate cn --dry-run
hexo multi-generate --all
hexo multi-push cn
hexo multi-push cn --force
hexo multi-deploy --all
```

必须给一个目标或 `--all`，不能同时指定。`generate` 只构建；`push` 只发布最新合格产物，缺失或过期不会偷偷重建；`deploy` 串联二者，全目标时先构建完全部目标再发布。`--dry-run` 不创建工作目录、不构建、不连接目标。禁止草稿发布；草稿预览继续使用普通 Hexo 命令。

发布前校验输入摘要及每个产物文件。文章、主题、目标配置或产物变更后，需要重新生成。重复 push 相同产物不新增提交；重复构建是否产生相同内容取决于插件是否使用时间、随机数或外部服务。

### GitHub Pages 产物适配

命令保留 `multi-*` 命名。GitHub 仓库不会自动启用 Pages 适配，需要在主题主配置的 `multi_deploy.targets.<目标名>.publish` 中显式配置。下面是该目标下的配置片段，不是子配置文件内容：

```yaml
publish:
  type: git
  repo: git@github.com:example/blog-pages.git
  branch: pages
  pages:
    enable: true
    cname: www.example.com
```

`pages.enable` 默认 `false`。开启后构建产物包含 `.nojekyll`，无需给自动生成的标记配置 Hexo `include`。`cname` 可省略；填写时只能是域名（国际化域名使用 Punycode），不能包含协议、端口、路径、通配符或 IP 地址，不根据站点 `url` 推导。省略时不自动生成 CNAME，也不删除源文件正常输出的 CNAME。关闭适配同样不会删除用户自己提供的文件。

已有源文件或其他生成器输出的 `CNAME` 与配置一致则复用（忽略首尾空白和大小写），不一致以 `MULTI_PAGES_CONFLICT` 拒绝构建，不覆盖本地源文件。非法配置以 `MULTI_PAGES_CONFIG` 提示，支持简中、繁中及英文。

此适配只在 `multi-generate` / `multi-deploy` 构建产物时执行，文件进入摘要及篡改校验，`multi-push` 不临时添加文件。`multi-server --static` 使用同一产物；开发预览不额外注入部署标记。公共 `source` 与其他目标不变。GitHub 仓库的 Pages 发布来源、自定义域名设置、DNS 和证书仍需自行配置。

### 独立页面与静态文件

`multi-*` 的输入包含整个 `source` 内容目录，不限于文章；`source/tools/public/`、`source/tools/db.json` 等合法路径不会被误判为构建缓存。宿主输出目录与根目录数据库不纳入输入；主题根目录的 `public/`、`db.json` 也不复制。`.env`、`.env.*`、`.git`、`.worktrees`、`.deploy_git`、`node_modules` 和私有 `.multi-context.json` 仍受保护，不因 `include` 而公开。

独立 HTML 小工具或静态站点可使用 Hexo 原生 `skip_render`，将文件原样输出，不套用主题布局：

```yaml
# 公共 _config.yml；路径相对 source
skip_render:
  - "tools/**"
include:
  - ".nojekyll"
exclude:
  - "tools/private/**"
```

例如 `source/tools/demo/index.html` 对应站点下的 `/tools/demo/`，子路径部署时加上目标的 `root`。也可将这些参数写到目标文件的 `site` 下；数组整体替换公共规则，需列出所有希望保留的项。普通隐藏文件由 Hexo 的 `include` 控制，资源排除由 `exclude` / `ignore` 控制；无需另外开启主题静态文件开关。不要把含密钥的配置当作公开 JSON 数据。

`include` 决定文件是否进入构建产物，不覆盖 HTTP 服务器的访问规则。例如 `.nojekyll` 会进入产物，但原生 `hexo server --static` 默认不提供点文件的 HTTP 访问；它作为部署标记仍可正常使用。

### 本地目标预览

```bash
hexo multi-server cn --port 4003
hexo multi-server global --port 4004
hexo multi-generate global
hexo multi-server global --static --port 4005
```

`multi-server` 每次只选一个目标，不支持 `--all`。它与构建命令使用同一个目标文件和主题合并路径；不执行 Git，不要求发布凭据，不更新发布记录或 `latest`。多个终端可分别预览不同目标；同一目标也可在不同端口启动独立会话。

- 默认开发模式：在系统临时目录创建 `doratiger-multi-preview-*` 私有会话（目录权限 0700），复用构建输入白名单和配置准备模块，运行真正的 `hexo server`。约每秒检查源文件、主题、目标及公共配置的变化；变化后复制新快照并重启隔离 Hexo，新增、修改、删除文件均生效。不把大图片每秒重新读入计算摘要。连续保存导致快照变化或文件被编辑器替换时，丢弃本次未完成副本并等待重试，已有预览暂时继续服务旧内容；新快照准备成功后才停止旧进程。重启期间会短暂停止服务，更新完成后**手工刷新浏览器**；不是浏览器自动刷新服务。
- `--static`：校验该目标最新产物及输入摘要，在发布锁保护下复制产物到本次预览目录后立即释放锁，再运行 `hexo server --static`。缺失、过期或被篡改时直接拒绝，不自动执行 `multi-generate`。之后生成/清理不会改变当前静态预览；要查看新产物需重启预览命令。Hexo 的静态模式仍调用 `load()` 加载插件和运行生成器，可能执行第三方构建逻辑；HTTP 页面来自已校验的静态副本，不使用这些内存渲染结果。
- `--port` / `-p`：默认 4000，范围 1–65535。端口被占用时失败，不结束其他服务，也不自动换端口。
- `--ip` / `-i`：默认 `127.0.0.1`，当前只接受 IPv4 地址（上游 `hexo-server` 的 IPv6 URL 格式化不兼容）。手机联调可显式使用 `--ip 0.0.0.0`，这会向可访问本机网络的人暴露预览，请自行控制防火墙。
- 禁止 `--draft`、`--config`、`--output`、`--force` 等改变本命令边界的参数；开发模式也不渲染草稿。环境变量由启动进程提供，修改 shell 环境或依赖安装后应重启命令。
- 配置错误、主题切换或工作目录变更会停止预览并输出脱敏错误，修正后重新运行；不会继续展示旧配置而宣称更新成功。主题资源和普通配置变化可自动重启，切换到另一主题不在该命令范围。
- Ctrl+C / SIGTERM 会结束本次 Hexo 子进程并删除本次临时会话，不删除源文件、发布缓存或其他预览。SIGKILL、断电等不可捕获退出可能留下临时目录；其中包含配置副本，应先核对 `owner.json` 的宿主与 PID，再人工清理。不要发布整个会话目录。

预览仍会按目标设置加载浏览器端第三方服务，评论提交、访问统计等可能访问真实服务。命令不自动拦截这些请求，也不自动模拟评论后端；检查 UI 与验证服务端发布结果是两个独立步骤。

### 发布安全及恢复

使用专用静态产物分支。目标分支不存在时创建；普通 push 要求已存在分支带有匹配的 `Doratiger-Target` 提交 trailer，否则以 `MULTI_OWNERSHIP` 拒绝接管。归属标识防止误操作，不替代 Git 权限控制。

发布保留获取到的远端历史，移除已不在产物中的旧页面，默认普通推送，不修改宿主源码仓库。普通 `.deploy_git` 不被复用。远端拒绝或非快进返回 `MULTI_GIT`；检查凭据和远端变更后重新执行对应目标。若远端已收到产物，重试会比较实际 tree，不重复创建提交。

`--force` **仅用于 `multi-push`**（支持单目标或 `--all`），使用真正的 `git push --force`，不是 `--force-with-lease`。它允许接管未知归属分支，并可能覆盖 fetch 之后其他人提交的内容；服务端保护分支仍可能拒绝。它不清空已经 fetch 的历史，也不绕过输入、产物、路径和锁校验；相同且归属匹配的 tree 仍跳过推送。接管时即使 tree 相同也补一个带归属标识的提交。启用时会输出风险警告；`--dry-run` 不连接或修改远端。不要对源码分支使用此选项。

多目标串行，失败即停，已经推送的目标不自动回滚。输出中会列出各目标所处阶段。整个运行目录有排他锁；遇到 `MULTI_LOCK`，先检查 `plugins/multi_deploy/lock` 中记录的进程与主机，确认进程结束后再手工移除该锁，不直接清理活跃构建。

构建副本和历史运行目录会保留用于检查，可能占用较多空间；使用下面的清理命令处理。不要把整个运行目录作为静态网站发布。

### 本地发布记录与清理

Git 依赖在执行命令时检查，而不是加载主题时检查。`multi-generate`（包含发布分支校验）、`multi-push` 和 `multi-deploy` 找不到 Git 时，以非零状态退出并显示 `MULTI_GIT_MISSING`，提示安装 Git、检查 PATH 和运行 `git --version`；不自动安装。普通 Hexo 构建不因此失败，`multi-server`、`multi-history` 和 `multi-clean` 不要求安装 Git。

发布诊断可使用 `hexo multi-push github --debug`（同样适用于 `multi-generate` / `multi-deploy`）。Git 子命令失败时额外输出 `[multi-debug]`：操作名、退出码、耗时毫秒和错误分类，例如 `github-rule-rejection`、`authentication`、`network`、`timeout`。不会输出原始 Git stderr、完整参数、配置、令牌或保护规则的放行链接；未知错误保持 `git-failed`。这些诊断不写入发布记录，也不会自动重试、强推或绕过安全规则。

```bash
hexo multi-history cn
hexo multi-history --all --limit 10
hexo multi-history --all --json --silent

hexo multi-clean cn                  # 默认仅预览
hexo multi-clean --all --dry-run     # 显式预览
hexo multi-clean cn --apply --yes    # 实际删除
hexo multi-clean --all --apply --yes
```

`multi-history` 只读取 `<work_dir>/history/<目标>/`，不连接远端、不重新检查产物，也不读取目标配置文件。按时间倒序显示，`--limit` 默认 20，表示所选目标合计的显示上限；`--json` 输出结构化记录，机器读取时加 `--silent` 关闭 Hexo 启动日志。没有运行目录时返回空结果，不创建目录。

发布记录由 `multi-push` / `multi-deploy` 在取得工作目录锁后自动创建，记录目标、操作、时间、分支、force、产物标识、提交 SHA（取得时）、阶段及脱敏错误码。配置/身份/认证预检或锁获取失败发生在运行建立前，不新增记录；`generate` 和 `--dry-run` 不新增发布记录。

结果包括 `published`（已发布）、`unchanged`（无变化）、`failed`（失败）、`skipped`（因前序失败未执行）和 `unconfirmed`（结果未确认）。调用 Git push 前先落盘提交 SHA 和阶段；push 或后续远端验证出错时，保守记录为未确认，不能据此断言远端没收到。进程异常中断留下的未完成记录同样显示未确认。记录只代表当次操作，不代表网站或后续工作流状态；不保存令牌、提交消息或原始 Git 输出。

`cleanup.keep_builds` 和 `cleanup.keep_records` 都必须为正整数，默认分别为 3 和 20，按目标独立计算，**仅执行清理时生效，不自动删除**。最新指针引用的产物始终保留，即使它不在最近 N 次构建中；因此实际保留数可能略多。发布记录与产物独立保留，历史记录存在不保证对应产物仍在本地。

`multi-clean` 显示保留原因、待删除路径和预计释放字节数。实际删除必须同时使用 `--apply --yes`，不能与 `--dry-run` 同用，不支持 `--force`。清理对象为旧构建、未完成的构建副本、已结束的 Git 临时目录和超额记录；共享输入只有全部目标都不再引用时才删除。单目标清理保留其他目标数据；`--all` 指当前配置的全部目标，已从配置移除的目标数据不会被当作当前目标删除。

预览和删除都拒绝已有运行锁；删除复用构建/发布的同一把锁。发现路径越界、异常符号链接、无法识别的运行结构或归属不明时拒绝清理，不修改源码、远端仓库或最新产物指针。删除的旧副本及记录不进入回收站；完整构建可重新生成，但已删除记录无法由此恢复。

能识别的历史记录/最新指针原子写入临时文件会在清理时移除，不阻塞记录查询；不识别的文件仍拒绝自动处理。非空 Git 临时目录必须具有 `.git/config` 等预期结构；若 Git 初始化中途失败而缺失这些结构，需人工确认后处理，不自动猜测归属。

临时 CI 环境如需跨运行保存历史，应由工作流保存 `history/` 为构建附件或持久化运行目录；主题不自动修改工作流。

### CDN、搜索与第三方插件

多目标命令不隐式执行 CDN 上传、Algolia 索引更新或任意 shell 钩子。开启 CDN 时先显式运行既有 `hexo cdn sync`，目标 manifest 的桶、域名和 key 前缀必须匹配；构建只把记录复制进隔离目录，默认 CDN manifest 位置不变。第一版不调度多桶同步。

本地搜索索引及 Sitemap 随各目标构建。Algolia 远端索引需显式更新：

```bash
hexo algolia --target github --dry-run
hexo algolia --target github
hexo algolia --target github --clean false
```

`--target` 选择一个已启用的 multi 目标（不要求配置 publish），复用目标的 `site` / `theme` 合并与隔离快照，先通过真实 Hexo generate 处理文章，再读取该副本的数据库生成索引。不读取公共旧数据库，不修改公共 public/db.json，不产生发布记录，结束清理临时副本。日志显示目标、有效站点 URL 和索引名；dry-run 输出待写入的公开文章，不写远端。实际更新仍默认清空索引，可用 `--clean false` 禁用清空；失败可能已部分写入，重试前核对远端。

不传 `--target` 保持原有公共配置命令；多目标构建、预览和 Git 发布不会自动更新 Algolia。若环境变量 `ALGOLIA_INDEX_NAME` 与目标 `theme.search.algolia.index_name` 显式配置不一致，所有隔离目标运行均报 `MULTI_ALGOLIA_ENV`，请取消或对齐该环境变量，不能让前端查询与索引写入指向不同索引。其他凭据仍按现有环境变量优先规则读取，不打印密钥。不同域名应使用不同索引。

主题不替用户改工作流或配置跨域 canonical。

Algolia `objectID` 使用文章相对源路径的 SHA-256，不再使用临时数据库 ID。重建、修改正文/标题、切换域名或 permalink 不改变记录身份；`fields` 不能覆盖 objectID。升级此规则后需默认清空并重建一次索引，移除旧 ID。之后 `--clean false` 可覆盖同一路径的已有文章，但不删除旧记录；移动/重命名源文件或删除文章后仍需完整重建。

source、主题、宿主 scripts 和配置复制到独立目录，复用已安装 npm 依赖；不复制整个宿主仓库或 `.env`。额外依赖宿主任意文件的插件需单独评估。隔离目录不是安全沙箱：已有第三方插件仍为受信任代码，其主动联网不在此功能的拦截范围内。

测试用本地 `git init --bare` 仓库，不使用正式推送目标。命令、构建、远端 ref/tree 与浏览器最终页面均需验证；主题测试命令见设计文档。

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
