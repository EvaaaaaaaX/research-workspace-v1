# Research Workspace V1 Master Plan

## 1. 产品目标

Research Workspace V1 是一个面向学生、研究者和知识工作者的本地优先研究资料工作台。

V1 的核心目标不是自动化研究，也不是 AI 助手，而是建立一个稳定、可持续扩展的研究资料管理基础设施，让用户可以持续收集、整理、检索和重新利用研究资料。

V1 必须解决的问题是：用户收集的资料越来越多，但缺少一个统一、低摩擦、可长期维护的工作空间，导致资料散落、重复、难以回看、难以服务具体研究项目。

V1 的成功标准：

- 用户可以添加三类 Resource：File、URL、Note。
- 用户可以围绕自己的研究工作主动创建 Collection，并将同一 Resource 放入多个 Collection。
- 系统可以基于规则自动生成 Tag，用户可以手动修改。
- 用户可以通过搜索、筛选、排序快速找回资料。
- 所有核心数据以本地存储为中心，未来云同步只作为增强能力。
- V1 不依赖 LLM、Embedding、向量数据库、RAG 或云端复杂服务。

设计决策原因：

- 先做统一资料工作台，是因为资料管理是后续 AI 整理、主题发现和对话式工作区的前置基础。
- Local First 可以降低成本、保护隐私、提升长期可控性。
- 不在 V1 引入 AI 能力，是为了避免产品核心价值被误解为聊天或问答工具，也避免早期架构被高成本模型调用绑架。

---

## 2. 用户画像

### 2.1 学生

典型用户包括本科生、研究生、博士生。

主要需求：

- 收集课程论文、参考文献、网页资料和自己的阅读笔记。
- 按课程、论文、开题、毕业设计等项目组织资料。
- 在写作时快速找回曾经读过或保存过的材料。

主要痛点：

- PDF、网页链接、笔记分别散落在不同工具中。
- 收藏资料时很积极，真正写作时很难找回。
- 文件夹层级过深后，资料归属变得模糊。

### 2.2 研究者

典型用户包括高校教师、独立研究者、实验室成员。

主要需求：

- 持续积累文献、报告、网页资料和研究备忘。
- 按课题、论文、基金、课程、合作项目组织资料。
- 快速查看某一方向下已有资料和近期更新内容。

主要痛点：

- 同一份资料可能同时属于多个项目，传统文件夹无法表达多重归属。
- 资料 metadata 不完整，后续检索困难。
- 研究周期长，早期收藏的资料容易失去上下文。

### 2.3 知识工作者

典型用户包括产品经理、咨询顾问、内容创作者、行业分析师。

主要需求：

- 保存网页、报告、文章、访谈记录和个人观察。
- 按项目、客户、主题、产出任务管理资料。
- 在输出报告、文章或方案时快速复用已有材料。

主要痛点：

- 浏览器收藏夹、网盘、笔记软件之间缺乏统一入口。
- 资料很多，但缺少可操作的工作区结构。
- 标签经常手动维护失败，最终变成无效噪音。

---

## 3. 用户痛点分析

### 3.1 资料入口分散

用户的研究资料通常来自文件、网页、个人笔记。它们天然分布在不同系统中：本地文件夹、浏览器收藏、笔记软件、聊天记录、云盘。

V1 的处理方式：

- 使用 Resource 抽象统一 File、URL、Note。
- 所有 Resource 进入同一个 Workspace。
- 不强迫用户改变资料来源，只提供统一登记、组织和检索入口。

### 3.2 组织方式不可持续

传统文件夹只能表达单一归属，但研究资料经常有多重上下文。例如一篇关于 AI 教育的论文，可能同时属于 Dissertation、Literature Review、AI Education Project。

V1 的处理方式：

- Collection 由用户主动创建，表达用户自己的工作组织方式。
- Resource 可以属于多个 Collection。
- Collection 不等于系统分类，也不等于未来 Topic。

### 3.3 标签维护成本高

完全手动标签系统很容易失败。用户前期热情高，后期难以保持一致性。

V1 的处理方式：

- Tag 默认由系统自动生成。
- 自动生成基于规则、关键词和 metadata，不使用 LLM。
- 用户可以手动添加、删除、编辑 Tag，以修正系统结果。

### 3.4 搜索上下文不足

用户不只想搜文件名，也想按标题、作者、描述、笔记正文、URL metadata、标签、Collection 找资料。

V1 的处理方式：

- 建立统一搜索入口。
- 支持标题、作者、来源、URL、描述、内容预览、Tag、Collection 等字段检索。
- V1 使用关系型数据库全文搜索或轻量搜索索引，不引入向量检索。

---

## 4. 核心使用场景

### 4.1 保存一篇 PDF 文献

用户上传 PDF 文件，系统创建 File 类型 Resource。

系统应当：

- 保存原始文件。
- 创建 Resource 记录。
- 尝试提取标题、作者、摘要、关键词等 metadata。
- 基于 metadata 自动生成 Tag。
- 允许用户补充标题、作者、来源、Collection 和备注。

设计原因：

- PDF 是研究资料的核心类型。
- V1 不要求完美解析文献 metadata，但必须允许用户手动修正。

### 4.2 保存一个网页链接

用户手动粘贴 URL，系统创建 URL 类型 Resource。

系统应当：

- 保存原始 URL。
- 尝试抓取网页 Title、Description、Open Graph metadata、站点名称。
- 生成内容预览。
- 自动生成 Tag。
- 允许用户放入一个或多个 Collection。

设计原因：

- V1 不做浏览器插件，降低开发复杂度。
- 手动粘贴 URL 足以支撑早期使用闭环。

### 4.3 创建一条研究笔记

用户创建 Note 类型 Resource，用于记录阅读笔记、研究想法、待查问题或项目记录。

系统应当：

- 提供标题和正文编辑。
- 支持 Markdown 文本。
- 自动从标题和正文中生成 Tag。
- 允许关联 Collection。

设计原因：

- Note 让 Workspace 不只是资料库，也能承载研究过程。
- 使用 Markdown 是为了保持低成本、可迁移和本地友好。

### 4.4 按项目整理资料

用户创建 Collection，例如 Dissertation、Research Proposal、AI Education Project。

用户可以：

- 将已有 Resource 加入 Collection。
- 在 Resource 新增时选择 Collection。
- 在 Collection 页面查看该 Collection 下的全部 Resource。
- 一个 Resource 同时属于多个 Collection。

设计原因：

- Collection 表达用户的工作意图。
- 多 Collection 归属比文件夹更符合研究资料的真实使用方式。

### 4.5 写作前找回资料

用户通过搜索、筛选或 Collection 页面找回资料。

系统应当支持：

- 按关键词搜索。
- 按 Resource 类型筛选。
- 按 Tag 筛选。
- 按 Collection 筛选。
- 按创建时间、修改时间排序。
- 快速进入详情页查看 metadata 和内容预览。

设计原因：

- 找回资料是 Research Workspace 的核心价值验证点。
- V1 的搜索不追求语义理解，先保证稳定、可解释、可控。

---

## 5. 用户流程

### 5.1 新增 File Resource 流程

1. 用户点击新增 Resource。
2. 用户选择 File。
3. 用户上传 PDF、DOCX、TXT 或 Markdown。
4. 系统保存文件并创建 Resource。
5. 系统尝试提取 metadata 和文本预览。
6. 系统生成自动 Tag。
7. 用户确认或编辑标题、作者、来源、Tag、Collection。
8. 用户保存。
9. 系统进入 Resource 详情页。

关键约束：

- 文件上传失败时，不创建 Resource。
- metadata 提取失败时，仍允许创建 Resource。
- 文件名可作为默认标题。
- 用户手动编辑的 metadata 优先于系统提取结果。

### 5.2 新增 URL Resource 流程

1. 用户点击新增 Resource。
2. 用户选择 URL。
3. 用户输入 URL。
4. 系统校验 URL 格式。
5. 系统抓取网页 metadata。
6. 系统生成标题、描述、来源和 Tag。
7. 用户确认或编辑信息。
8. 用户保存。
9. 系统进入 Resource 详情页。

关键约束：

- URL metadata 抓取失败时，仍允许用户手动保存。
- 系统必须保存原始 URL。
- 不自动下载 PDF。
- 不绕过付费墙或登录限制。

### 5.3 新增 Note Resource 流程

1. 用户点击新增 Resource。
2. 用户选择 Note。
3. 用户输入标题和正文。
4. 系统根据文本生成 Tag。
5. 用户选择 Collection。
6. 用户保存。
7. 系统进入 Resource 详情页。

关键约束：

- Note 正文可以为空，但标题不能为空。
- Note 支持后续编辑。
- Note 是 Resource，不是 Resource 的附属评论。

### 5.4 Collection 管理流程

1. 用户进入 Collection 页面。
2. 用户创建 Collection。
3. 用户输入名称和可选描述。
4. 系统创建 Collection。
5. 用户可以编辑、删除、拖拽排序或将 Resource 加入 Collection。

关键约束：

- 删除 Collection 不删除其中的 Resource。
- Collection 名称在同一 Workspace 内应唯一。
- Collection 排序由用户手动控制。

### 5.5 Tag 管理流程

1. 系统在 Resource 创建或 metadata 更新后自动生成 Tag。
2. 用户可以在 Resource 详情页添加或删除 Tag。
3. 用户可以在 Tag 管理页查看全部 Tag。
4. 用户可以通过 Tag 筛选 Resource。
5. 用户可以重命名或合并 Tag。

关键约束：

- Tag 是资料描述，不是用户项目组织方式。
- 自动 Tag 必须可解释，能追溯到关键词规则或 metadata 来源。
- 用户手动修改后，系统不应在无提示情况下覆盖用户修改。

---

## 6. 信息架构

Research Workspace V1 的核心对象：

- Workspace
- Resource
- Collection
- Tag
- File Asset
- Metadata
- Search Index

对象关系：

- 一个 Workspace 包含多个 Resource。
- 一个 Workspace 包含多个 Collection。
- 一个 Workspace 包含多个 Tag。
- 一个 Resource 可以属于多个 Collection。
- 一个 Resource 可以拥有多个 Tag。
- File 类型 Resource 关联一个本地 File Asset。
- URL 类型 Resource 保存 URL 和抓取 metadata。
- Note 类型 Resource 保存用户输入文本。

核心导航分区：

- Home
- Resources
- Collections
- Tags
- Search
- Settings

设计原因：

- 信息架构围绕用户最常见任务组织：总览、找资料、按项目看资料、按标签看资料、配置本地工作区。
- Search 可作为全局能力，也可以在 Resources 页面内实现，但信息架构上必须明确存在。

---

## 7. 页面结构设计

### 7.1 Workspace 首页

首页展示当前 Workspace 的状态和最近活动。

必须包含：

- 资源总数。
- File、URL、Note 数量。
- 最近新增 Resource。
- 最近修改 Resource。
- Collection 概览。
- Tag 概览。
- 快速新增入口。

设计原因：

- 首页不是营销页，而是工作台。
- 用户打开应用后应立即看到自己最近在处理的资料和项目。

### 7.2 Resource 列表页

Resource 列表页是资料检索和批量管理入口。

必须包含：

- Resource 列表。
- 搜索框。
- 类型筛选：File、URL、Note。
- Collection 筛选。
- Tag 筛选。
- 排序：创建时间、修改时间、标题。
- 新增 Resource 按钮。
- 每条 Resource 展示标题、类型、来源、Tag、Collection、更新时间。

设计原因：

- Resource 列表页承担资料库主视图。
- 筛选和排序必须是 V1 核心能力，而不是后续增强。

### 7.3 Resource 详情页

详情页展示单个 Resource 的完整信息。

必须包含：

- 标题。
- Resource 类型。
- 作者。
- 来源。
- URL。
- Tag。
- 所属 Collection。
- 创建时间。
- 修改时间。
- 内容预览。
- 文件信息或网页 metadata。
- 编辑入口。
- 删除入口。

不同类型补充信息：

- File：文件名、文件类型、文件大小、本地路径引用、文本预览。
- URL：原始 URL、解析标题、描述、站点名称、抓取时间。
- Note：Markdown 正文预览和编辑入口。

设计原因：

- 详情页必须既能承载 metadata，也能给用户足够上下文判断资料是否有用。
- 内容预览是 V1 中“利用资料”的最低可行能力。

### 7.4 Resource 新增/编辑页

新增和编辑使用统一表单结构。

必须包含：

- 类型选择。
- 标题。
- 作者。
- 来源。
- URL。
- 描述。
- Tag 编辑。
- Collection 选择。
- 文件上传区或 Note 编辑区。

设计原因：

- 统一编辑体验可以降低用户认知负担。
- 不同 Resource 类型只改变必要字段，不改变整体管理模型。

### 7.5 Collection 列表页

必须包含：

- Collection 列表。
- 每个 Collection 的名称、描述、Resource 数量、最近更新时间。
- 创建、编辑、删除入口。
- 拖拽排序能力。

设计原因：

- Collection 是用户主动组织研究工作的核心结构。
- 拖拽排序体现用户自己的优先级，不依赖系统判断。

### 7.6 Collection 详情页

必须包含：

- Collection 名称和描述。
- 当前 Collection 下的 Resource 列表。
- 搜索和筛选。
- 添加已有 Resource 入口。
- 从 Collection 中移除 Resource 的入口。
- 编辑 Collection 入口。

设计原因：

- Collection 详情页是用户围绕某个研究项目工作的主场景。
- 从 Collection 移除 Resource 不等于删除 Resource，必须在交互上明确。

### 7.7 Tag 管理页

必须包含：

- Tag 列表。
- 每个 Tag 的 Resource 数量。
- Tag 搜索。
- Tag 重命名。
- Tag 合并。
- Tag 删除。
- 点击 Tag 查看关联 Resource。

设计原因：

- 自动生成 Tag 后必须提供治理能力，否则标签会逐渐失控。
- Tag 管理页帮助用户清理近义词、大小写和格式不一致问题。

### 7.8 Settings 页面

必须包含：

- Workspace 本地数据位置。
- 文件存储位置。
- 支持的文件类型说明。
- 数据导出入口。
- 数据备份说明。
- Tag 规则配置入口。

设计原因：

- Local First 产品必须让用户知道数据在哪里。
- V1 即使不做云同步，也要为备份和迁移提供明确路径。

---

## 8. 导航设计

V1 推荐使用左侧固定导航。

导航项：

- Home
- Resources
- Collections
- Tags
- Settings

顶部区域：

- 全局搜索框。
- 新增 Resource 按钮。

设计原因：

- 左侧导航适合长期工作台产品，稳定、可扩展。
- 全局新增和全局搜索是最高频操作，应在所有页面可达。
- V1 不需要复杂的多工作区切换，但架构上应保留 Workspace 概念。

---

## 9. Resource 模型设计

Resource 是 V1 的统一资料抽象。

### 9.1 Resource 通用字段

必须包含：

- id：唯一标识。
- type：File、URL、Note。
- title：标题。
- authors：作者列表。
- source：来源，例如期刊、网站、机构、课程。
- url：原始 URL，可为空。
- description：描述或摘要。
- contentPreview：内容预览文本。
- createdAt：创建时间。
- updatedAt：修改时间。
- lastAccessedAt：最近访问时间，可选。
- metadata：类型特定 metadata。
- userEditedFields：记录用户手动编辑过的字段。
- deletedAt：软删除时间，可选。

设计原因：

- 统一字段让列表、搜索、筛选和详情页可以复用。
- metadata 保留扩展空间，避免每种 Resource 类型都扩展主表。
- userEditedFields 用于避免系统重新解析时覆盖用户修改。

### 9.2 File Resource

补充字段：

- fileAssetId。
- originalFileName。
- fileExtension。
- mimeType。
- fileSize。
- checksum。
- extractedTextStatus。
- metadataExtractionStatus。

支持类型：

- PDF。
- DOCX。
- TXT。
- Markdown。

设计原因：

- checksum 用于未来重复文件检测。
- extraction status 可以区分未处理、成功、失败，便于调试和后续重试。
- V1 不要求完美解析 PDF，但必须记录解析状态。

### 9.3 URL Resource

补充字段：

- normalizedUrl。
- siteName。
- fetchedTitle。
- fetchedDescription。
- ogTitle。
- ogDescription。
- canonicalUrl。
- fetchedAt。
- fetchStatus。
- fetchErrorType。

设计原因：

- URL 抓取经常失败，必须把失败作为正常状态设计。
- normalizedUrl 和 canonicalUrl 为未来去重做准备。
- fetchErrorType 便于用户理解失败原因，也便于后续修复。

### 9.4 Note Resource

补充字段：

- body。
- bodyFormat：Markdown。
- wordCount。
- linkedResourceIds，可选，V1 可暂不暴露复杂 UI。

设计原因：

- Note 必须是一等 Resource，才能被搜索、加 Tag、放入 Collection。
- Markdown 保证可读、可导出、低成本。

---

## 10. Collection 模型设计

Collection 是用户主动创建的工作组织单元。

字段：

- id。
- name。
- description。
- sortOrder。
- createdAt。
- updatedAt。
- deletedAt。

关系表：

- collectionResourceId。
- collectionId。
- resourceId。
- addedAt。
- sortOrder，可选。

规则：

- Collection 名称在同一 Workspace 内唯一。
- 删除 Collection 不删除 Resource。
- Resource 可以属于多个 Collection。
- Collection 不由系统自动创建，除非用户明确操作。

设计原因：

- Collection 表达“我正在做什么项目或工作”，而不是“系统认为这是什么主题”。
- 多对多关系是必须能力，不应使用单一 collectionId 字段。
- sortOrder 支持用户按自己的优先级排列 Collection。

---

## 11. Tag 模型设计

Tag 是系统根据规则自动生成，并允许用户修正的资料描述。

字段：

- id。
- name。
- normalizedName。
- color，可选。
- createdAt。
- updatedAt。
- sourceType：auto、manual、mixed。
- deletedAt。

关系表：

- resourceTagId。
- resourceId。
- tagId。
- confidence，可选。
- source：title、author、abstract、keyword、metadata、manual。
- createdAt。

规则：

- Tag 名称展示时使用 `#Name` 样式，但数据库中不存储 `#` 前缀。
- normalizedName 用于去重，例如大小写统一。
- 用户手动删除某 Resource 上的自动 Tag 后，系统不应立即再次添加相同 Tag。
- 用户手动创建的 Tag 不需要 confidence。

设计原因：

- Tag 是“资料有什么特征”，不是“用户把它放在哪个项目”。
- 记录 source 可以解释 Tag 来自哪里。
- manual 和 auto 必须区分，避免用户修改被系统覆盖。

---

## 12. Tag、Collection、未来 Topic 的职责区分

### 12.1 Tag

Tag 描述 Resource 的内容特征。

来源：

- 系统规则自动生成。
- 用户手动修正。

例子：

- LLM。
- Education。
- KnowledgeManagement。
- HCI。

职责：

- 帮助筛选和检索。
- 表示资料内容中出现的主题、方法、领域或关键词。
- 可被系统建议，但必须允许用户治理。

不负责：

- 表达用户正在做的项目。
- 表达系统发现的聚类主题。
- 替代 Collection。

### 12.2 Collection

Collection 表达用户主动组织的研究工作区。

来源：

- 用户创建。
- 用户编辑。
- 用户决定 Resource 是否加入。

例子：

- Dissertation。
- Research Proposal。
- AI Education Project。
- Literature Review。

职责：

- 表示用户自己的项目、任务、产出或工作上下文。
- 支持一个 Resource 属于多个 Collection。
- 帮助用户围绕具体工作目标管理资料。

不负责：

- 自动分类。
- 主题发现。
- 替代 Tag。

### 12.3 未来 Topic

Topic 是 V3 之后可能通过 Embedding 聚类、主题发现或 AI 分析生成的系统洞察对象。

来源：

- 未来算法生成。
- 可能由用户确认、命名或合并。

例子：

- “AI-supported writing pedagogy”。
- “LLM use in qualitative coding”。
- “Personal knowledge management workflows”。

职责：

- 发现用户资料库中自然形成的主题簇。
- 帮助用户理解资料之间的潜在关系。
- 支持未来 AI 整理、总结和对话能力。

V1 处理方式：

- V1 不创建 Topic。
- V1 数据模型预留 Topic 扩展空间。
- V1 UI 不出现 Topic 概念，避免和 Tag、Collection 混淆。

设计原因：

- Tag、Collection、Topic 如果职责不清，产品会很快混乱。
- V1 必须只实现 Tag 和 Collection。
- Topic 属于未来智能层，不属于 V1 基础资料管理层。

---

## 13. 数据库设计

V1 推荐使用 SQLite 作为本地数据库。

原因：

- 本地优先。
- 零运维。
- 适合单用户桌面或本地 Web 应用。
- 支持事务。
- 支持全文搜索扩展。
- 未来可迁移到云端关系型数据库。

核心表：

- resources。
- file_assets。
- url_metadata。
- notes。
- collections。
- collection_resources。
- tags。
- resource_tags。
- tag_generation_rules。
- search_index。
- app_settings。

### 13.1 resources

保存所有 Resource 的通用字段。

关键字段：

- id。
- type。
- title。
- authorsJson。
- source。
- url。
- description。
- contentPreview。
- metadataJson。
- userEditedFieldsJson。
- createdAt。
- updatedAt。
- deletedAt。

### 13.2 file_assets

保存 File Resource 的文件引用信息。

关键字段：

- id。
- resourceId。
- originalFileName。
- storedFileName。
- relativePath。
- mimeType。
- extension。
- fileSize。
- checksum。
- extractedTextPath。
- extractionStatus。
- extractionError。

### 13.3 url_metadata

保存 URL 解析结果。

关键字段：

- id。
- resourceId。
- originalUrl。
- normalizedUrl。
- canonicalUrl。
- siteName。
- fetchedTitle。
- fetchedDescription。
- ogTitle。
- ogDescription。
- fetchedAt。
- fetchStatus。
- fetchErrorType。

### 13.4 notes

保存 Note 内容。

关键字段：

- id。
- resourceId。
- body。
- bodyFormat。
- wordCount。

### 13.5 collections

保存 Collection。

关键字段：

- id。
- name。
- description。
- sortOrder。
- createdAt。
- updatedAt。
- deletedAt。

### 13.6 collection_resources

保存 Resource 与 Collection 的多对多关系。

关键字段：

- id。
- collectionId。
- resourceId。
- addedAt。
- sortOrder。

### 13.7 tags

保存 Tag。

关键字段：

- id。
- name。
- normalizedName。
- color。
- sourceType。
- createdAt。
- updatedAt。
- deletedAt。

### 13.8 resource_tags

保存 Resource 与 Tag 的多对多关系。

关键字段：

- id。
- resourceId。
- tagId。
- source。
- confidence。
- createdAt。
- removedByUserAt。

### 13.9 tag_generation_rules

保存自动 Tag 规则。

关键字段：

- id。
- tagName。
- normalizedTagName。
- matchType。
- matchFields。
- keywordsJson。
- enabled。
- createdAt。
- updatedAt。

### 13.10 app_settings

保存本地配置。

关键字段：

- key。
- valueJson。
- updatedAt。

设计原因：

- Resource 通用字段和类型特定表分离，避免单表过度膨胀。
- 多对多关系显式建表，保证 Collection 和 Tag 的扩展能力。
- settings 表便于未来增加配置，不需要频繁迁移结构。

---

## 14. 文件存储设计

V1 使用本地文件存储。

推荐结构：

- `workspace-data/database.sqlite`
- `workspace-data/files/originals/`
- `workspace-data/files/extracted-text/`
- `workspace-data/exports/`
- `workspace-data/backups/`

规则：

- 上传文件复制到 `files/originals/`。
- 文件名使用 Resource id 或 File Asset id 生成，避免重名冲突。
- 原始文件名保存在数据库中。
- 提取出的纯文本保存到 `files/extracted-text/`，数据库保存相对路径。
- 数据库只保存文件引用，不直接存大文件二进制内容。
- 删除 Resource 时默认软删除，不立即删除本地文件。
- 真正清理文件应由未来维护工具或用户确认操作完成。

设计原因：

- 数据库不存大文件，避免数据库膨胀。
- 相对路径方便整个 workspace-data 文件夹迁移。
- 软删除降低误删风险。
- 原始文件名保留用户可读性，存储文件名保证系统稳定性。

---

## 15. URL 解析方案

V1 URL 解析采用轻量 metadata 抓取。

抓取内容：

- HTML title。
- meta description。
- Open Graph title。
- Open Graph description。
- Open Graph site_name。
- canonical URL。
- 响应状态码。
- 最终跳转 URL。

不做：

- 不自动下载 PDF。
- 不绕过登录。
- 不处理复杂动态渲染页面。
- 不抓取全文正文。
- 不保存网页快照。

失败处理：

- DNS、超时、403、404、SSL 错误、解析失败都应记录 fetchErrorType。
- 抓取失败时用户仍可手动保存 URL。
- 用户手动填写标题后，系统不得用失败结果覆盖。

设计原因：

- URL metadata 足以支持 V1 的资料登记和检索。
- 全文抓取和网页快照会显著增加复杂度，应留到未来。
- 失败可保存比强依赖抓取成功更符合真实使用场景。

---

## 16. 自动 Tag 生成方案

V1 自动 Tag 采用规则和关键词匹配，不使用 LLM 或 Embedding。

输入字段：

- title。
- authors。
- description。
- abstract。
- keywords。
- source。
- URL metadata。
- Note 正文前若干字符。
- File 提取文本前若干字符。

生成流程：

1. 收集可用文本字段。
2. 对文本进行大小写归一、分词、去标点。
3. 根据 tag_generation_rules 匹配关键词。
4. 对匹配到的 Tag 建立 resource_tags 关系。
5. 记录 Tag source 和 confidence。
6. 跳过用户曾手动移除的 Tag。

默认规则示例：

- LLM：large language model、LLM、GPT、ChatGPT。
- Education：education、learning、teaching、pedagogy。
- KnowledgeManagement：knowledge management、PKM、note-taking。
- HCI：human-computer interaction、HCI、UX。
- QualitativeResearch：interview、coding、thematic analysis。

用户操作：

- 可以添加 Tag。
- 可以删除 Resource 上的 Tag。
- 可以重命名 Tag。
- 可以合并 Tag。
- 可以禁用某条自动规则。

设计原因：

- 规则系统透明、低成本、可解释。
- V1 不追求自动分类准确率，而追求减少用户初始整理负担。
- 允许用户治理是自动 Tag 长期可用的关键。

---

## 17. 搜索方案

V1 推荐使用 SQLite FTS 或等价本地全文搜索能力。

搜索范围：

- Resource title。
- authors。
- source。
- URL。
- description。
- contentPreview。
- Note body。
- extracted text。
- Tag name。
- Collection name。

搜索能力：

- 关键词搜索。
- 类型筛选。
- Collection 筛选。
- Tag 筛选。
- 创建时间筛选。
- 修改时间筛选。
- 排序：相关性、创建时间、修改时间、标题。

搜索结果展示：

- 标题。
- Resource 类型。
- 命中的摘要片段。
- Tag。
- Collection。
- 更新时间。

设计原因：

- 关键词检索足以支撑 V1。
- 语义搜索属于 V3 之后能力。
- 本地全文搜索符合 Local First 和低成本原则。

---

## 18. 系统架构

V1 推荐实现为本地运行的 Web 应用。

架构形态：

- 前端：浏览器内运行的 Web UI。
- 后端：本地服务进程。
- 数据库：SQLite。
- 文件存储：本地 workspace-data 文件夹。
- 网络访问：仅用于用户提交 URL 时抓取 metadata。

设计原因：

- Web UI 开发效率高，交互体验好。
- 本地后端可以处理文件系统、SQLite、URL 抓取和文档解析。
- 该架构未来可以自然扩展为桌面应用或云同步架构。

---

## 19. 前端架构

推荐前端技术：

- React。
- TypeScript。
- Vite。
- Tailwind CSS 或等价组件化样式方案。
- React Router。
- TanStack Query。
- Zustand 或轻量状态管理库。

前端模块：

- Resource pages。
- Collection pages。
- Tag pages。
- Search components。
- Settings pages。
- Shared UI components。
- API client。
- Form validation。
- Local UI state。

设计原则：

- 服务端数据通过 API 获取，不在前端重复实现业务规则。
- 表单状态和筛选状态保持清晰隔离。
- 页面组件负责组合，业务逻辑下沉到 hooks 或 service 层。
- 不在 V1 引入复杂富文本编辑器，Note 使用 Markdown 文本编辑。

设计原因：

- React 生态成熟，适合快速构建本地 Web 应用。
- TypeScript 降低模型复杂度带来的错误。
- TanStack Query 适合管理 API 数据缓存和刷新。
- Zustand 适合保存轻量 UI 状态，例如侧栏、筛选条件、当前视图偏好。

---

## 20. 后端架构

推荐后端技术：

- Node.js。
- TypeScript。
- Fastify 或 Express。
- SQLite ORM 或 query builder。
- 本地文件系统 API。
- 文档解析库。
- URL metadata 抓取库。

后端模块：

- Resource service。
- File service。
- URL metadata service。
- Note service。
- Collection service。
- Tag service。
- Search service。
- Settings service。
- Database migration。
- Import/export service。

设计原则：

- API 层只处理请求响应和参数校验。
- Service 层实现业务规则。
- Repository 或 data access 层隔离数据库操作。
- 文件存储操作必须和数据库记录保持事务一致性。
- 解析失败不应中断 Resource 创建，除非核心文件保存失败。

设计原因：

- 本地后端使文件处理、SQLite、URL 抓取更可靠。
- TypeScript 前后端统一类型，减少模型不一致。
- 分层架构为未来桌面封装、云同步和 AI 能力接入预留空间。

---

## 21. API 设计

API 使用 JSON over HTTP。

### 21.1 Resource API

必须支持：

- 创建 File Resource。
- 创建 URL Resource。
- 创建 Note Resource。
- 获取 Resource 列表。
- 获取 Resource 详情。
- 更新 Resource。
- 删除 Resource。
- 搜索 Resource。
- 更新 Resource 的 Tag。
- 更新 Resource 的 Collection 归属。

关键行为：

- 创建 File 使用 multipart upload。
- 创建 URL 使用 JSON body。
- 创建 Note 使用 JSON body。
- 删除默认软删除。
- 更新 metadata 时必须保留用户手动字段优先级。

### 21.2 Collection API

必须支持：

- 创建 Collection。
- 获取 Collection 列表。
- 获取 Collection 详情。
- 更新 Collection。
- 删除 Collection。
- 调整 Collection 排序。
- 添加 Resource 到 Collection。
- 从 Collection 移除 Resource。

关键行为：

- 删除 Collection 不删除 Resource。
- 添加重复 Resource 应返回幂等成功。
- Collection 名称冲突应返回明确错误。

### 21.3 Tag API

必须支持：

- 获取 Tag 列表。
- 创建手动 Tag。
- 更新 Tag。
- 删除 Tag。
- 合并 Tag。
- 获取某 Tag 下的 Resource。
- 更新自动 Tag 规则。

关键行为：

- 删除 Tag 不删除 Resource。
- 合并 Tag 需要把旧 Tag 的 resource_tags 迁移到新 Tag。
- 用户手动删除某 Resource 上的 Tag 时，应记录 removedByUserAt。

### 21.4 Search API

必须支持：

- q：关键词。
- type：Resource 类型。
- collectionId。
- tagId。
- date range。
- sort。
- pagination。

关键行为：

- 空关键词加筛选条件时，应返回筛选结果。
- 搜索结果必须包含命中摘要。
- 搜索应默认排除软删除 Resource。

### 21.5 Settings API

必须支持：

- 获取本地 workspace 配置。
- 更新文件存储位置。
- 获取数据导出状态。
- 触发数据导出。
- 获取 Tag 规则配置。

设计原因：

- API 按领域对象划分，便于未来 Agent 拆任务开发。
- 幂等和软删除规则明确，可以减少开发歧义。
- 搜索 API 独立存在，便于未来替换为更强搜索引擎。

---

## 22. 本地优先架构设计

V1 的本地优先原则：

- 数据库默认存储在本机。
- 文件默认存储在本机。
- 核心功能不依赖云服务。
- 用户不登录也能使用。
- URL 抓取失败不影响已有资料管理。
- 应提供数据导出能力。

本地数据边界：

- SQLite 保存结构化数据。
- 文件系统保存原始文件和提取文本。
- Settings 保存 workspace-data 路径。
- 未来云同步不得替代本地主数据，只能同步本地状态。

未来同步预留：

- 所有核心表使用稳定 id。
- 所有核心对象包含 createdAt、updatedAt、deletedAt。
- 删除使用软删除。
- 文件使用 checksum。
- metadata 和用户编辑字段分离。

设计原因：

- Local First 不只是部署方式，而是数据所有权设计。
- 软删除、稳定 id、时间戳和 checksum 是未来同步的基础。
- V1 不做云同步，但不能把未来同步堵死。

---

## 23. 状态管理设计

前端状态分三类：

### 23.1 服务端状态

包括：

- Resource 列表。
- Resource 详情。
- Collection 列表。
- Tag 列表。
- 搜索结果。
- Settings。

处理方式：

- 使用 TanStack Query 或等价方案。
- 请求成功后更新缓存。
- 变更后失效相关查询。

### 23.2 表单状态

包括：

- 新增 Resource 表单。
- 编辑 Resource 表单。
- Collection 表单。
- Tag 编辑表单。
- Settings 表单。

处理方式：

- 使用本地组件状态或表单库。
- 提交前进行字段校验。
- 表单草稿不默认写入数据库。

### 23.3 UI 状态

包括：

- 当前筛选条件。
- 当前排序。
- 侧栏展开状态。
- 当前视图模式。
- modal 打开状态。

处理方式：

- 使用 Zustand 或 URL query params。
- 搜索和筛选条件应尽量进入 URL，方便刷新和分享本地链接。

设计原因：

- 区分状态类型可以避免前端复杂度失控。
- 服务端状态不应复制到全局 store。
- 搜索筛选进入 URL 有利于可恢复工作流。

---

## 24. MVP 范围

V1 MVP 必须包含：

- 本地 Web 应用。
- SQLite 数据库。
- 本地文件存储。
- Resource 三类型：File、URL、Note。
- File 上传：PDF、DOCX、TXT、Markdown。
- URL 手动粘贴和 metadata 抓取。
- Note 创建和编辑。
- Resource 列表、详情、新增、编辑、删除。
- Collection 创建、编辑、删除、排序。
- Resource 加入多个 Collection。
- 自动 Tag 生成。
- Tag 手动编辑、搜索、筛选。
- Workspace 首页。
- 全局搜索。
- 基础设置页。
- 数据导出基础能力。

设计原因：

- MVP 必须完整覆盖“收集、组织、检索、回看”的闭环。
- 只做资料工作台，不做智能研究助手。

---

## 25. 非 MVP 范围

V1 明确不做：

- LLM 分类。
- AI 总结。
- AI 问答。
- RAG。
- Embedding。
- 向量数据库。
- 自动主题发现。
- 自动知识图谱。
- 浏览器插件。
- 自动下载 PDF。
- 云同步。
- 团队协作。
- 多用户权限。
- 实时协作编辑。
- 引文格式管理。
- Zotero 双向同步。
- 网页全文归档。
- 移动端原生应用。

设计原因：

- 这些能力会显著增加架构复杂度和成本。
- 很多能力依赖 V1 的基础数据模型稳定后才能做。
- 过早引入 AI 会模糊产品定位。

---

## 26. 风险分析

### 26.1 Metadata 提取不稳定

风险：

- PDF、DOCX、网页 metadata 质量不稳定。

处理：

- 允许用户手动编辑。
- 保存解析状态。
- 不让解析失败阻断 Resource 创建。

### 26.2 Tag 自动生成质量有限

风险：

- 规则匹配可能误判或漏判。

处理：

- Tag 可手动修改。
- 规则可配置和禁用。
- 记录 Tag 来源。
- 不把 Tag 用作唯一组织方式。

### 26.3 本地文件丢失

风险：

- 用户移动或删除 workspace-data 目录导致文件不可用。

处理：

- Settings 显示数据位置。
- 提供导出和备份说明。
- File Asset 保存 checksum 和相对路径。
- 文件缺失时 Resource 仍保留 metadata。

### 26.4 搜索体验不足

风险：

- 关键词搜索无法满足复杂语义需求。

处理：

- V1 明确只做关键词搜索。
- 通过 Tag、Collection、类型筛选补强。
- 为 V3 语义搜索预留 search service 抽象。

### 26.5 范围膨胀

风险：

- 产品容易被拉向 AI 助手、文献推荐或知识图谱。

处理：

- 文档明确非 MVP 范围。
- 开发验收以资料工作台闭环为准。
- AI 能力全部延后到 V4 和 V5。

---

## 27. 推荐技术栈

前端：

- React。
- TypeScript。
- Vite。
- React Router。
- TanStack Query。
- Zustand。
- Tailwind CSS。
- Markdown editor 或 textarea-based Markdown input。

后端：

- Node.js。
- TypeScript。
- Fastify。
- SQLite。
- Drizzle ORM 或 Prisma。
- Zod。
- Multer 或等价 multipart 处理。
- pdf-parse 或等价 PDF 文本提取。
- mammoth 或等价 DOCX 文本提取。
- cheerio 或 linkedom 用于 HTML metadata 解析。

开发工具：

- pnpm。
- ESLint。
- Prettier。
- Vitest。
- Playwright。
- SQLite migration tool。

设计原因：

- 前后端 TypeScript 降低模型同步成本。
- SQLite 满足 Local First。
- Fastify 轻量、性能好、适合本地 API。
- Drizzle 或 Prisma 能提供结构化 migration 和类型安全。
- Playwright 用于验证核心用户流程。

---

## 28. 推荐目录结构

推荐单仓库结构：

- `apps/web`：前端 Web 应用。
- `apps/server`：本地 API 服务。
- `packages/shared`：共享类型、常量、校验 schema。
- `packages/database`：数据库 schema、migration、repository。
- `packages/extractors`：文件解析和 URL metadata 解析。
- `packages/tagging`：自动 Tag 规则和生成逻辑。
- `docs`：产品和技术文档。
- `workspace-data`：本地运行数据目录，开发环境可忽略提交。

设计原因：

- monorepo 适合前后端共享类型。
- extractor 和 tagging 单独分包，便于未来替换实现。
- docs 保留规划、架构决策和接口说明。
- workspace-data 不应进入版本控制。

---

## 29. V2 兼容性设计：浏览器插件

V2 计划增加浏览器插件，用于从浏览器一键保存网页到 Workspace。

V1 需要预留：

- URL Resource API 可以被外部客户端调用。
- URL 创建接口接受 title、description、selectedText 等可选字段。
- Resource source metadata 支持 browserExtension 来源。
- 后端支持本地服务被插件连接。
- URL 去重逻辑基于 normalizedUrl 和 canonicalUrl。

V1 不做：

- 插件 UI。
- 浏览器登录态复用。
- 网页全文保存。
- 自动 PDF 下载。

设计原因：

- V2 插件本质是新增输入入口，不应改变 Resource 模型。
- V1 手动粘贴 URL 与 V2 插件保存 URL 应共用同一套创建逻辑。

---

## 30. V3 兼容性设计：自动主题发现

V3 计划增加 Embedding 聚类和自动主题发现。

V1 需要预留：

- Resource 有稳定 id。
- Resource 有可用于 embedding 的文本字段。
- contentPreview 和 extracted text 分离保存。
- Search service 与具体搜索实现解耦。
- Tag、Collection 不承担 Topic 职责。
- 数据模型未来可新增 topics、topic_resources 表。

V1 不做：

- Embedding。
- 向量数据库。
- 聚类。
- Topic UI。
- 主题命名。

设计原因：

- Topic 是未来智能层，不应污染 V1 的基础组织模型。
- 清晰分离 Tag、Collection、Topic，可以避免未来迁移困难。

---

## 31. 开发任务拆解

### 31.1 基础工程

- 初始化 monorepo。
- 配置 TypeScript。
- 配置前端应用。
- 配置后端服务。
- 配置共享类型包。
- 配置 lint、format、test。
- 配置开发启动脚本。

验收标准：

- 前端和后端可本地启动。
- shared package 可被前后端引用。
- 基础测试命令可运行。

### 31.2 数据层

- 建立 SQLite schema。
- 建立 migration 机制。
- 实现 Resource、Collection、Tag repository。
- 实现软删除规则。
- 实现全文搜索索引。

验收标准：

- 数据库可初始化。
- 核心表结构符合本文档。
- CRUD repository 有测试覆盖。

### 31.3 Resource 后端

- 实现 File Resource 创建。
- 实现 URL Resource 创建。
- 实现 Note Resource 创建。
- 实现 Resource 列表、详情、更新、删除。
- 实现 Collection 归属更新。
- 实现 Tag 更新。

验收标准：

- 三类 Resource 都能创建和读取。
- 删除为软删除。
- Resource 可以属于多个 Collection。
- Resource 可以拥有多个 Tag。

### 31.4 文件与解析

- 实现文件上传。
- 实现本地文件存储。
- 实现 PDF 文本提取。
- 实现 DOCX 文本提取。
- 实现 TXT 和 Markdown 读取。
- 保存解析状态和错误。

验收标准：

- 支持四类文件上传。
- 解析失败不阻断创建。
- 原始文件可定位。
- contentPreview 可生成。

### 31.5 URL metadata

- 实现 URL 格式校验。
- 实现 metadata 抓取。
- 实现 HTML title、description、Open Graph、canonical 解析。
- 实现 fetch 状态和错误记录。

验收标准：

- 普通网页可抓取 title 和 description。
- 抓取失败仍可保存。
- URL metadata 可在详情页展示。

### 31.6 Tag 系统

- 实现默认 Tag 规则。
- 实现自动 Tag 生成。
- 实现 Tag 增删改查。
- 实现 Tag 合并。
- 实现用户手动删除记录。
- 实现 Tag 筛选。

验收标准：

- Resource 创建后可自动生成 Tag。
- 用户可手动修改 Tag。
- 系统不重复添加用户删除过的 Tag。
- Tag 可用于筛选 Resource。

### 31.7 Collection 系统

- 实现 Collection CRUD。
- 实现 Collection 排序。
- 实现 Resource 加入和移出 Collection。
- 实现 Collection 详情页数据接口。

验收标准：

- Collection 删除不删除 Resource。
- Resource 可属于多个 Collection。
- Collection 排序可保存。

### 31.8 搜索系统

- 建立搜索索引。
- 实现关键词搜索。
- 实现类型、Tag、Collection 筛选。
- 实现排序。
- 实现搜索结果摘要。

验收标准：

- 可以搜索标题、描述、Note 正文、提取文本。
- 可以组合筛选。
- 搜索默认排除软删除数据。

### 31.9 前端页面

- 实现首页。
- 实现 Resource 列表页。
- 实现 Resource 详情页。
- 实现 Resource 新增/编辑页。
- 实现 Collection 列表和详情页。
- 实现 Tag 管理页。
- 实现 Settings 页面。

验收标准：

- 用户可以完成新增、整理、搜索、查看资料的完整闭环。
- 页面状态刷新后不丢失关键筛选条件。
- 表单错误有明确提示。

### 31.10 验证与打磨

- 添加单元测试。
- 添加 API 测试。
- 添加核心 Playwright 流程测试。
- 测试文件上传、URL 保存、Note 创建、Tag 修改、Collection 归类、搜索。
- 检查空状态、错误状态、加载状态。

验收标准：

- 核心流程自动化测试通过。
- 主要错误场景有 UI 提示。
- 无明显死链或不可恢复状态。

---

## 32. 开发优先级

P0：

- 工程初始化。
- 数据库 schema。
- Resource 三类型 CRUD。
- 本地文件存储。
- Collection 多对多关系。
- Tag 基础生成和编辑。
- Resource 列表和详情。
- 基础搜索。

P1：

- URL metadata 抓取。
- 文件文本提取。
- Collection 排序。
- Tag 合并。
- 首页统计。
- Settings 页面。
- 搜索摘要。

P2：

- 数据导出。
- 更完整 Tag 规则配置。
- 更好的错误恢复。
- 最近访问记录。
- 批量操作。

设计原因：

- P0 建立产品闭环。
- P1 提升资料质量和可用性。
- P2 增强长期维护能力，但不阻塞 V1 可用。

---

## 33. 开发里程碑

### Milestone 1：工程与数据基础

目标：

- 本地应用可以启动。
- SQLite schema 完成。
- 基础 API 可调用。

交付物：

- 前后端工程。
- 数据库 migration。
- Resource、Collection、Tag 基础 repository。

### Milestone 2：Resource 创建闭环

目标：

- 三类 Resource 都可以创建和查看。

交付物：

- File 上传。
- URL 保存。
- Note 创建。
- Resource 列表和详情页。

### Milestone 3：组织系统闭环

目标：

- 用户可以用 Collection 和 Tag 组织资料。

交付物：

- Collection CRUD。
- Resource 多 Collection 归属。
- 自动 Tag 生成。
- Tag 手动编辑和筛选。

### Milestone 4：检索与工作台

目标：

- 用户可以找回资料，并从首页看到工作状态。

交付物：

- 搜索。
- 筛选。
- 排序。
- 首页统计。
- 最近新增和最近修改。

### Milestone 5：稳定化与验收

目标：

- V1 达到可本地使用状态。

交付物：

- Settings。
- 数据导出基础能力。
- 测试覆盖。
- 错误状态处理。
- 文档补充。

---

## 34. Agent 开发执行顺序

### Agent 1：产品与交互执行

负责：

- 根据本文档细化页面验收标准。
- 输出关键页面 wireframe 说明。
- 定义空状态、错误状态、加载状态。
- 检查 Tag、Collection、Topic 的概念边界是否在 UI 中清晰。

交付：

- 页面级验收清单。
- 用户流程验收清单。

### Agent 2：数据与后端执行

负责：

- 实现数据库 schema。
- 实现 migration。
- 实现 Resource、Collection、Tag、Search API。
- 实现本地文件存储和解析服务。

交付：

- 后端 API。
- 数据库 migration。
- 后端测试。

### Agent 3：前端执行

负责：

- 实现 Web UI。
- 实现页面路由。
- 实现表单、列表、详情、筛选和搜索。
- 对接后端 API。

交付：

- 可用前端应用。
- 核心页面。
- 前端测试。

### Agent 4：质量与验证执行

负责：

- 编写端到端测试。
- 验证核心用户流程。
- 检查错误状态和边界场景。
- 检查非 MVP 功能是否误入 V1。

交付：

- 测试报告。
- 缺陷清单。
- V1 验收报告。

执行顺序：

1. Agent 1 和 Agent 2 并行启动。
2. Agent 2 完成 API contract 后，Agent 3 开始前端集成。
3. Agent 4 在 Milestone 2 后介入，持续验证。
4. 每个 Milestone 结束后进行一次 scope review，确认没有引入 V1 明确不做的能力。

---

## 35. 验收标准

V1 只有在满足以下条件时才可认为完成：

- 用户可以本地启动 Research Workspace。
- 用户可以创建 File、URL、Note 三类 Resource。
- 用户可以查看、编辑、删除 Resource。
- 用户可以创建、编辑、删除 Collection。
- 用户可以将一个 Resource 放入多个 Collection。
- 系统可以自动生成 Tag。
- 用户可以手动编辑 Tag。
- 用户可以搜索、筛选、排序 Resource。
- 首页可以展示最近新增、最近修改、Collection 概览、Tag 概览和数量统计。
- Resource 详情页展示标题、作者、来源、URL、标签、所属 Collection、创建时间、修改时间和内容预览。
- 所有核心数据保存在本地。
- V1 没有引入 LLM、Embedding、RAG、浏览器插件、云同步或团队协作。
- 测试覆盖核心新增、组织、搜索、详情查看流程。

---

## 36. 明确假设

- V1 是单用户产品。
- V1 优先本地运行，不要求公网部署。
- V1 使用 Web 应用形态，但可以由本地后端提供 API。
- V1 不要求移动端适配到原生体验，但基础响应式布局应可用。
- V1 的自动 Tag 是辅助能力，不保证完全准确。
- V1 的 URL metadata 抓取只处理公开可访问页面。
- V1 的文件解析以提取可搜索文本和预览为目标，不做完整文献管理。
- V1 不实现引文格式、BibTeX 管理或文献推荐。
- V1 的规划文档是后续 AI Agent 开发任务的唯一需求来源，执行时不得擅自加入非 MVP 功能。
