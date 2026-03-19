# 轻问 AI - LightAsk

> 不会提问？轻轻一点，AI 就懂你。零门槛场景化 AI 办公助手。

LightAsk 是一款 Chrome 浏览器扩展程序，通过预设的智能场景卡片，让用户无需编写 Prompt，只需填写表单即可获得专业的 AI 输出。支持 OpenAI、Claude、智谱 AI 等多家 AI 服务商，适用于日常办公、写作、翻译、法律咨询等多种场景。

## 功能介绍

### 智能场景卡片

LightAsk 内置 8 个场景卡片，覆盖办公写作、效率工具、翻译、法律咨询等多个领域。每个场景都配有专业的 Prompt 模板，用户只需填写关键信息，AI 即可生成结构化的专业内容。

#### 法律类

| 场景 | 说明 |
|------|------|
| **法律咨询** | 选择法律领域（劳动纠纷、合同纠纷、婚姻家庭、房产纠纷、知识产权、交通事故、消费维权等），描述问题即可获得法律分析，包含适用法规、解决建议、维权路径和风险提示 |
| **事故责任分析** | 上传事故现场照片（支持多张），系统自动从照片 EXIF 数据中提取 GPS 坐标并识别事故城市，AI 分析各方责任比例、违法行为认定和赔偿建议。支持视觉模型直接分析照片，不支持时自动回退到纯文字分析 |

#### 写作类

| 场景 | 说明 |
|------|------|
| **邮件回复** | 粘贴原始邮件，选择回复语气（正式/友好/委婉拒绝/简洁）和语言（中文/英文/与原文一致），输入核心意图即可生成得体的回复 |
| **周报生成** | 列出本周工作事项，选择周报风格（简洁扼要/详细充实/数据驱动），自动生成包含工作总结、关键成果和下周计划的结构化周报 |
| **润色改写** | 粘贴原文，选择目标风格（更专业正式/更轻松口语/更简洁精炼/更有感染力），在保持原意的前提下优化表达 |

#### 效率类

| 场景 | 说明 |
|------|------|
| **长文摘要** | 粘贴长文内容，选择摘要长度（一句话/100字/300字/500字），可指定关注重点，快速提炼核心内容 |

#### 翻译类

| 场景 | 说明 |
|------|------|
| **商务翻译** | 支持中/英/日/韩四种语言互译，可选择专业领域（通用商务/科技IT/金融财务/法律合规），输出符合行业术语的专业译文 |

#### 学习类

| 场景 | 说明 |
|------|------|
| **概念解释** | 输入概念或术语，选择解释深度（小白入门/进阶理解/深入分析），可结合使用场景给出一句话定义、详细解释和实际例子 |

### 选中即用

在任意网页上选中文字后，自动弹出浮窗工具栏，提供翻译、摘要、解释、润色四个快捷操作。系统会根据选中内容自动判断类型（中文/英文/代码/邮件），智能调整操作按钮的优先级排序。AI 结果以流式方式实时展示，支持一键复制。

### 网页伴读

打开侧边栏后，自动提取当前网页的主体内容，AI 生成一句话摘要、关键要点和推荐问题。点击推荐问题可进一步追问，实现与网页内容的交互式问答。

### 历史记录

所有场景的生成结果自动保存到本地（IndexedDB），支持按关键词搜索历史记录，自动保留最近 50 条记录。

## 使用规则

### API 密钥配置

1. 点击扩展图标，在弹出窗口右上角点击齿轮图标进入设置页面
2. 选择 AI 服务商（OpenAI / Claude / 智谱 AI / 自定义）
3. 填入对应平台的 API Key
4. API 地址和模型名称会根据选择的服务商自动填充，也可手动修改
5. 点击「保存设置」

### 场景卡片使用

1. 点击扩展图标打开弹出窗口，或按 `Cmd+Shift+L`（Mac）/ `Ctrl+Shift+L`（Windows）打开侧边栏
2. 从场景卡片网格中选择需要的功能
3. 按照表单提示填写必填项（标有 * 的字段）和选填项
4. 点击「生成」按钮，AI 将以流式方式实时输出结果
5. 生成完成后可复制结果或重新生成

### 事故责任分析使用

1. 选择「事故责任分析」卡片
2. 点击或拖拽上传事故现场照片（支持多张）
3. 系统自动尝试从照片 EXIF 中提取 GPS 信息并识别城市，也可手动输入
4. 填写事故描述、选择涉事方数量
5. 点击「开始分析」，AI 将综合照片和文字信息给出责任比例分析
6. 若当前模型不支持图片，会显示提示并自动切换为纯文字分析模式

### 选中即用

- 在任意网页选中文字即可触发浮窗
- 按 `Esc` 键关闭浮窗
- 右键选中文字可通过「用轻问 AI 处理」菜单打开侧边栏

### 功能开关

在设置页面可独立控制以下功能的开启/关闭：
- **选中即用** - 控制网页文字选中后是否显示 AI 操作浮窗
- **网页伴读** - 控制侧边栏是否自动分析当前网页内容

## 安装说明

### 环境要求

- Node.js >= 18
- npm 或其他包管理器
- Chrome 浏览器（支持 Manifest V3）

### 从源码构建

```bash
# 克隆项目
git clone https://github.com/Laity/lightask.git
cd lightask

# 安装依赖
npm install

# 开发模式（支持热更新）
npm run dev

# 生产构建
npm run build

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

### 加载到 Chrome

1. 运行 `npm run build` 构建项目
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目根目录下的 `dist` 文件夹
6. 扩展安装完成后，点击工具栏上的扩展图标即可开始使用

开发模式下运行 `npm run dev`，CRXJS 插件支持 HMR 热更新，修改代码后扩展会自动刷新。

## 技术架构

### 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Chrome Extension Manifest V3 | v3 | 扩展规范 |
| React | 19.2 | UI 框架 |
| TypeScript | 5.7 | 类型安全 |
| Vite | 6.3 | 构建工具 |
| @crxjs/vite-plugin | 2.0 beta | Chrome 扩展 Vite 集成 |
| Tailwind CSS | 4.2 | 样式框架 |
| Dexie | 4.3 | IndexedDB 封装（历史记录） |
| Zustand | 5.0 | 状态管理 |

### 项目结构

```
lightask/
├── public/
│   └── manifest.json          # Chrome 扩展清单
├── src/
│   ├── background.ts          # Service Worker：消息中转、AI 流式转发、右键菜单
│   ├── index.css              # 全局样式入口
│   ├── scenes/
│   │   └── cards.ts           # 场景卡片配置（字段定义 + Prompt 模板）
│   ├── services/
│   │   ├── ai-router.ts       # AI API 统一路由（多模型、多模态、SSE 流式）
│   │   ├── storage.ts         # 存储服务（Chrome Storage + IndexedDB）
│   │   ├── prompt-engine.ts   # Prompt 模板引擎（变量替换）
│   │   ├── exif-parser.ts     # JPEG EXIF GPS 解析 + 反向地理编码
│   │   └── store.ts           # Zustand 状态管理
│   ├── components/
│   │   ├── SceneGrid.tsx      # 场景卡片网格展示
│   │   ├── SceneForm.tsx      # 通用场景表单（动态渲染字段）
│   │   └── AccidentForm.tsx   # 事故分析专用表单（照片上传 + GPS 识别）
│   ├── popup/                 # 弹出窗口入口
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── Popup.tsx
│   ├── side-panel/            # 侧边栏入口
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── SidePanel.tsx
│   │   ├── copilot/
│   │   │   └── PageCopilot.tsx    # 网页伴读组件
│   │   └── history/
│   │       └── HistoryPanel.tsx   # 历史记录组件
│   ├── options/               # 设置页入口
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── Options.tsx
│   └── content-scripts/
│       └── index.ts           # 选中即用浮窗（纯 DOM + Shadow DOM）
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 架构设计

- **场景卡片系统**：所有场景通过 `cards.ts` 统一配置，包括字段定义和 Prompt 模板。通用场景使用 `SceneForm` 动态渲染表单，特殊场景（如事故分析）通过 `customForm` 标记使用专用组件
- **AI 路由层**：`ai-router.ts` 封装了多服务商 API 的统一调用接口，支持 SSE 流式输出、多模态消息（文本 + 图片）、自动回退机制
- **Content Script**：选中即用功能使用纯 DOM 操作 + Shadow DOM 实现样式隔离，避免 React 在 Content Script 中的兼容性问题
- **数据持久化**：设置数据通过 Chrome Storage Sync API 同步存储，历史记录通过 IndexedDB（Dexie）本地存储

## 配置说明

### AI 服务商配置

| 服务商 | 默认 API 地址 | 默认模型 | 说明 |
|--------|---------------|----------|------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` | 支持 GPT 系列模型 |
| Claude | `https://api.anthropic.com` | `claude-sonnet-4-20250514` | 支持 Claude 系列模型 |
| 智谱 AI | `https://open.bigmodel.cn/api/paas/v4` | `glm-4-flash` | 支持 GLM 系列模型 |
| 自定义 | 用户填写 | 用户填写 | 任何兼容 OpenAI API 格式的服务 |

### 场景卡片扩展

新增场景卡片只需在 `src/scenes/cards.ts` 的 `SCENE_CARDS` 数组中添加配置：

```typescript
{
  id: 'my-scene',           // 唯一标识
  name: '场景名称',          // 显示名称
  icon: '🎯',               // 卡片图标
  description: '场景描述',   // 卡片副标题
  category: '分类名',        // 所属分类
  fields: [                  // 表单字段
    { key: 'input', label: '输入', type: 'textarea', required: true, rows: 4 },
    { key: 'style', label: '风格', type: 'select', options: [
      { label: '选项A', value: 'a' },
      { label: '选项B', value: 'b' },
    ]},
  ],
  promptTemplate: {
    system: '系统提示词，可使用 {{变量名}} 引用字段值',
    user: '用户消息模板：{{input}}',
  },
}
```

支持的字段类型：
- `textarea` - 多行文本输入，可通过 `rows` 指定行数
- `text` - 单行文本输入
- `select` - 下拉选择，需配合 `options` 定义选项
- `image-upload` - 图片上传（需配合 `customForm` 使用专用组件）

## 常见问题解答

**Q: 提示「请先在设置中配置 API Key」**

设置页面中尚未填写 API Key。点击扩展图标右上角齿轮图标进入设置，选择 AI 服务商并填入有效的 API Key。

**Q: 事故责任分析提示「当前模型不支持图片分析」**

当前配置的模型不支持视觉输入。系统会自动切换为纯文字分析模式。如需图片分析能力，请在设置中将模型切换为支持视觉的版本，例如 GPT-4o、Claude Sonnet 或 GLM-4V。

**Q: 选中网页文字后没有弹出浮窗**

检查设置页面中「选中即用」功能是否已开启。部分网页可能因安全策略限制 Content Script 注入，此时该功能不可用。

**Q: 侧边栏打不开**

确认使用快捷键 `Cmd+Shift+L`（Mac）/ `Ctrl+Shift+L`（Windows）。也可以在 `chrome://extensions/shortcuts` 中查看或自定义快捷键。如果快捷键冲突，可右键点击扩展图标选择相关操作。

**Q: API 请求返回 401 错误**

API Key 无效或已过期，请确认填入的 Key 正确，且对应平台账户有足够余额。

**Q: API 请求返回 429 错误**

请求频率超过 API 限制。稍等片刻后重试，或在 AI 服务商平台升级配额。

**Q: 如何使用自定义的 AI 服务？**

在设置页面选择「自定义 (OpenAI 兼容)」，填入服务的 API 地址和模型名称。要求服务兼容 OpenAI 的 `/chat/completions` 接口格式并支持 SSE 流式响应。

**Q: 照片上传后未自动识别城市**

GPS 信息识别依赖照片的 EXIF 数据。如果照片经过压缩、截图或社交平台下载，EXIF 信息可能已被移除。此时请手动输入事故发生城市。

**Q: 历史记录存储在哪里？**

历史记录存储在浏览器本地的 IndexedDB 中，不会上传到任何服务器。清除浏览器数据时可能会被清除。系统自动保留最近 50 条记录。
