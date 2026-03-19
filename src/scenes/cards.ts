// Scene card type definitions and all 6 MVP scene configurations

import type { PromptTemplate } from '../services/prompt-engine'

export type FieldType = 'textarea' | 'select' | 'text' | 'image-upload'

export interface SceneField {
  key: string
  label: string
  type: FieldType
  placeholder?: string
  options?: Array<{ label: string; value: string }>
  required?: boolean
  rows?: number
  accept?: string       // for image-upload: accepted file types
  multiple?: boolean    // for image-upload: allow multiple files
}

export interface SceneCard {
  id: string
  name: string
  icon: string
  description: string
  category: string
  fields: SceneField[]
  promptTemplate: PromptTemplate
  customForm?: boolean  // if true, uses a dedicated form component instead of generic SceneForm
}

// ========== Scene Cards ==========

export const SCENE_CARDS: SceneCard[] = [
  // ========== Legal Consultation ==========
  {
    id: 'legal-consult',
    name: '法律咨询',
    icon: '⚖️',
    description: '根据具体情况提供法律分析和建议',
    category: '法律',
    fields: [
      { key: 'legalArea', label: '法律领域', type: 'select', options: [
        { label: '劳动纠纷', value: '劳动法与劳动纠纷' },
        { label: '合同纠纷', value: '合同法与合同纠纷' },
        { label: '婚姻家庭', value: '婚姻家庭法' },
        { label: '房产纠纷', value: '房地产与物权法' },
        { label: '知识产权', value: '知识产权法' },
        { label: '交通事故', value: '交通事故与侵权责任' },
        { label: '消费维权', value: '消费者权益保护' },
        { label: '其他', value: '其他法律领域' },
      ], required: true },
      { key: 'description', label: '问题描述', type: 'textarea', placeholder: '详细描述您遇到的法律问题，包括事情经过、涉及的人员关系、时间节点等关键信息...', required: true, rows: 6 },
      { key: 'background', label: '相关背景', type: 'textarea', placeholder: '（选填）补充相关背景信息，如已签署的合同、已有的证据、对方的态度等...', rows: 4 },
      { key: 'region', label: '所在地区', type: 'text', placeholder: '（选填）如：北京市、上海市、广东省深圳市...' },
      { key: 'desiredOutcome', label: '期望结果', type: 'text', placeholder: '（选填）您希望达到的目标或结果...' },
    ],
    promptTemplate: {
      system: `你是一位经验丰富的中国法律顾问，精通中国现行法律法规。请根据用户描述的法律问题提供专业分析和建议。

分析要求：
1. 首先明确问题涉及的法律领域：{{legalArea}}
2. 分析适用的法律法规条文（引用具体法律名称和条款编号）
3. 根据描述的事实情况，分析各方的法律关系和权利义务
4. 提供具体可行的解决建议和维权路径
5. 如果用户提供了所在地区，结合当地司法实践给出建议
6. 提示可能存在的法律风险和注意事项

重要提示：请在回答末尾声明"以上分析仅供参考，具体法律问题建议咨询当地执业律师获取专业意见"。

请使用清晰的结构化格式输出，包含以下部分：
一、法律问题分析
二、适用法律法规
三、解决建议与维权路径
四、风险提示
五、免责声明`,
      user: `法律问题描述：
{{description}}

相关背景信息：{{background}}

所在地区：{{region}}

期望结果：{{desiredOutcome}}`,
    },
  },
  // ========== Traffic Accident ==========
  {
    id: 'traffic-accident',
    name: '事故责任分析',
    icon: '🚗',
    description: '上传事故照片，AI 分析责任比例',
    category: '法律',
    customForm: true,
    fields: [
      { key: 'photos', label: '事故现场照片', type: 'image-upload', required: true, accept: 'image/*', multiple: true, placeholder: '点击或拖拽上传事故现场照片' },
      { key: 'city', label: '事故城市', type: 'text', placeholder: '自动识别或手动输入城市名...' },
      { key: 'accidentDesc', label: '事故描述', type: 'textarea', placeholder: '描述事故经过：时间、地点、车辆行驶方向、碰撞位置等...', required: true, rows: 4 },
      { key: 'partyCount', label: '涉事方数量', type: 'select', options: [
        { label: '双方事故', value: '2' },
        { label: '三方事故', value: '3' },
        { label: '多方事故（4方以上）', value: '4+' },
      ], required: true },
      { key: 'extra', label: '补充信息', type: 'textarea', placeholder: '（选填）其他相关信息，如天气状况、路面情况、是否有交通信号灯等...', rows: 3 },
    ],
    promptTemplate: {
      system: `你是一位专业的交通事故责任分析师，精通中国各地交通法规。请根据用户上传的事故现场照片和描述信息，分析事故责任。

分析要求：
1. 仔细观察照片中的事故现场细节（车辆位置、碰撞痕迹、道路标线、交通信号等）
2. 结合事故发生城市（{{city}}）的当地交通法规进行分析
3. 参考《中华人民共和国道路交通安全法》及《道路交通事故处理程序规定》
4. 明确分析各方的交通违法行为
5. 给出详细的责任比例分配，格式如"甲方（XX%）：XX责任，乙方（XX%）：XX责任"

请使用以下结构化格式输出：

## 事故基本信息
- 事故地点：[城市及具体位置]
- 适用法规：[当地适用的交通法规]

## 现场分析
[基于照片和描述的详细现场分析]

## 各方违法行为认定
[列出每一方的交通违法行为及对应法律条款]

## 责任比例分配
[明确的百分比分配，如：]
- 甲方（车辆A）：XX% —— 承担XX责任
- 乙方（车辆B）：XX% —— 承担XX责任

## 赔偿建议
[基于责任比例的赔偿方向建议]

## 处理建议
[后续处理步骤和注意事项]

## 免责声明
以上分析由AI助手提供，仅供参考，最终事故责任认定以交警部门出具的《道路交通事故认定书》为准。`,
      user: `事故描述：{{accidentDesc}}

事故城市：{{city}}

涉事方数量：{{partyCount}}

补充信息：{{extra}}

请根据以上信息和照片进行事故责任分析。`,
    },
  },
  // ========== Writing ==========
  {
    id: 'email-reply',
    name: '邮件回复',
    icon: '📧',
    description: '根据原始邮件和你的意图，生成得体的回复',
    category: '写作',
    fields: [
      { key: 'originalEmail', label: '原始邮件', type: 'textarea', placeholder: '粘贴需要回复的邮件内容...', required: true, rows: 5 },
      { key: 'tone', label: '回复语气', type: 'select', options: [
        { label: '正式', value: '正式、专业' },
        { label: '友好', value: '友好、热情' },
        { label: '委婉拒绝', value: '委婉但坚定地拒绝' },
        { label: '简洁', value: '简洁明了' },
      ], required: true },
      { key: 'language', label: '回复语言', type: 'select', options: [
        { label: '中文', value: '中文' },
        { label: '英文', value: '英文' },
        { label: '与原文相同', value: '与原始邮件语言一致' },
      ], required: true },
      { key: 'intent', label: '核心意图', type: 'textarea', placeholder: '你想表达的核心意思，例如"同意合作但希望延期两周"', required: true, rows: 2 },
    ],
    promptTemplate: {
      system: '你是一个专业的商务邮件助手。根据用户提供的原始邮件和回复意图，生成一封得体的回复邮件。语气要求：{{tone}}。使用{{language}}撰写。只输出邮件正文，不要加任何额外说明。',
      user: '原始邮件内容：\n{{originalEmail}}\n\n我想表达的核心意图：{{intent}}',
    },
  },
  {
    id: 'weekly-report',
    name: '周报生成',
    icon: '📋',
    description: '根据本周事项清单，自动生成结构化周报',
    category: '写作',
    fields: [
      { key: 'items', label: '本周事项', type: 'textarea', placeholder: '列出本周完成的工作，每行一项...', required: true, rows: 6 },
      { key: 'style', label: '周报风格', type: 'select', options: [
        { label: '简洁扼要', value: '简洁扼要，突出重点' },
        { label: '详细充实', value: '详细充实，体现工作量' },
        { label: '数据驱动', value: '数据驱动，强调成果' },
      ], required: true },
      { key: 'nextWeek', label: '下周计划', type: 'textarea', placeholder: '（选填）下周重点工作...', rows: 3 },
    ],
    promptTemplate: {
      system: '你是一个职场周报撰写助手。根据用户提供的事项清单，生成一份结构化的周报。风格要求：{{style}}。周报结构包括：一、本周工作总结（按优先级排列）；二、关键成果；三、下周计划。格式清晰，使用 Markdown。',
      user: '本周完成的事项：\n{{items}}\n\n下周计划：{{nextWeek}}',
    },
  },
  {
    id: 'summarize',
    name: '长文摘要',
    icon: '📝',
    description: '将长文提炼为简明摘要',
    category: '效率',
    fields: [
      { key: 'content', label: '原始内容', type: 'textarea', placeholder: '粘贴需要摘要的长文内容...', required: true, rows: 8 },
      { key: 'length', label: '摘要长度', type: 'select', options: [
        { label: '一句话', value: '用一句话概括核心内容' },
        { label: '短摘要（100字）', value: '100字以内的简短摘要' },
        { label: '中摘要（300字）', value: '300字左右的摘要，包含主要观点' },
        { label: '详细摘要（500字）', value: '500字左右的详细摘要，包含所有关键信息' },
      ], required: true },
      { key: 'focus', label: '关注重点', type: 'text', placeholder: '（选填）希望重点关注的方面...' },
    ],
    promptTemplate: {
      system: '你是一个专业的文本摘要助手。请对用户提供的内容进行摘要。摘要要求：{{length}}。如果用户指定了关注重点，请侧重该方面。输出摘要正文即可，不要加额外说明。',
      user: '请摘要以下内容：\n\n{{content}}\n\n关注重点：{{focus}}',
    },
  },
  {
    id: 'translate',
    name: '商务翻译',
    icon: '🌐',
    description: '符合商务语境的高质量翻译',
    category: '翻译',
    fields: [
      { key: 'source', label: '原文', type: 'textarea', placeholder: '粘贴需要翻译的内容...', required: true, rows: 6 },
      { key: 'targetLang', label: '目标语言', type: 'select', options: [
        { label: '中文', value: '中文' },
        { label: '英文', value: '英文' },
        { label: '日文', value: '日文' },
        { label: '韩文', value: '韩文' },
      ], required: true },
      { key: 'domain', label: '专业领域', type: 'select', options: [
        { label: '通用商务', value: '通用商务' },
        { label: '科技/IT', value: '科技和互联网' },
        { label: '金融/财务', value: '金融和财务' },
        { label: '法律/合规', value: '法律和合规' },
      ] },
    ],
    promptTemplate: {
      system: '你是一个专业的商务翻译。请将用户提供的内容翻译成{{targetLang}}。翻译要求：1) 符合{{domain}}领域的专业用语；2) 语句通顺自然，不要有翻译腔；3) 保持原文的语气和格式。只输出译文，不要加任何说明。',
      user: '请翻译以下内容：\n\n{{source}}',
    },
  },
  {
    id: 'polish',
    name: '润色改写',
    icon: '✨',
    description: '优化文案的表达，调整风格和语气',
    category: '写作',
    fields: [
      { key: 'original', label: '原始文案', type: 'textarea', placeholder: '粘贴需要润色的文案...', required: true, rows: 6 },
      { key: 'targetStyle', label: '目标风格', type: 'select', options: [
        { label: '更专业正式', value: '更加专业和正式' },
        { label: '更轻松口语', value: '更加轻松和口语化' },
        { label: '更简洁精炼', value: '更加简洁精炼，删除冗余' },
        { label: '更有感染力', value: '更有感染力和说服力' },
      ], required: true },
      { key: 'extra', label: '额外要求', type: 'text', placeholder: '（选填）其他具体要求...' },
    ],
    promptTemplate: {
      system: '你是一个专业的文案润色专家。请对用户提供的文案进行润色改写。目标风格：{{targetStyle}}。要求：1) 保持原文核心意思不变；2) 优化表达和结构；3) 修正语法和用词问题。只输出润色后的文案。',
      user: '请润色以下文案：\n\n{{original}}\n\n额外要求：{{extra}}',
    },
  },
  {
    id: 'explain',
    name: '概念解释',
    icon: '💡',
    description: '用通俗语言解释专业概念或术语',
    category: '学习',
    fields: [
      { key: 'concept', label: '概念/术语', type: 'text', placeholder: '输入需要解释的概念或术语...', required: true },
      { key: 'level', label: '解释深度', type: 'select', options: [
        { label: '小白入门', value: '面向完全不了解的人，用最通俗的语言和类比解释' },
        { label: '进阶理解', value: '面向有一定基础的人，可以使用适量专业术语' },
        { label: '深入分析', value: '面向专业人士，深入分析原理和细节' },
      ], required: true },
      { key: 'context', label: '使用场景', type: 'text', placeholder: '（选填）在什么场景下遇到这个概念...' },
    ],
    promptTemplate: {
      system: '你是一个知识讲解专家。请根据要求的深度解释用户提供的概念。解释深度：{{level}}。要求：1) 先给出一句话定义；2) 展开详细解释；3) 给出实际例子帮助理解。如果用户提供了使用场景，请结合场景解释。',
      user: '请解释：{{concept}}\n\n使用场景：{{context}}',
    },
  },
]

export function getSceneById(id: string): SceneCard | undefined {
  return SCENE_CARDS.find(s => s.id === id)
}

export function getScenesByCategory(): Record<string, SceneCard[]> {
  const result: Record<string, SceneCard[]> = {}
  for (const scene of SCENE_CARDS) {
    if (!result[scene.category]) result[scene.category] = []
    result[scene.category].push(scene)
  }
  return result
}
