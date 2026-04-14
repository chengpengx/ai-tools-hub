/**
 * AI工具集 - Mock数据
 * 包含6个精选AI工具的完整信息
 */

const TOOLS_DATA = [
    {
        id: "chatgpt",
        name: "ChatGPT",
        icon: "message-circle",
        description: "OpenAI 出品的对话式 AI 助手，支持多轮对话、代码生成、创意写作等场景。",
        summary: "OpenAI 对话式 AI 助手",
        tags: ["免费", "付费", "API"],
        url: "https://chat.openai.com",
        category: "chat",
        featured: true
    },
    {
        id: "claude",
        name: "Claude",
        icon: "brain",
        description: "Anthropic 推出的安全对齐 AI，擅长长文档分析、逻辑推理、创意写作，上下文窗口达 200K token。",
        summary: "Anthropic 安全 AI 助手",
        tags: ["免费", "付费", "API"],
        url: "https://claude.ai",
        category: "chat",
        featured: true
    },
    {
        id: "midjourney",
        name: "Midjourney",
        icon: "image",
        description: "通过自然语言描述生成高质量艺术图像，Midjourney v6 在细节和风格上再创新高。",
        summary: "AI 艺术图像生成工具",
        tags: ["付费"],
        url: "https://www.midjourney.com",
        category: "image",
        featured: true
    },
    {
        id: "github-copilot",
        name: "GitHub Copilot",
        icon: "code-2",
        description: "AI 代码补全插件，深度集成 VS Code，支持 Python、JS、Go 等主流语言实时补全。",
        summary: "AI 代码补全助手",
        tags: ["付费", "API"],
        url: "https://github.com/features/copilot",
        category: "code",
        featured: true
    },
    {
        id: "kimi",
        name: "Kimi",
        icon: "file-text",
        description: "月之暗面推出的长文本 AI 助手，支持超长上下文理解，适合文档分析、论文阅读等场景。",
        summary: "国产长文本 AI 助手",
        tags: ["免费", "国产"],
        url: "https://kimi.moonshot.cn",
        category: "chat",
        featured: false
    },
    {
        id: "stable-diffusion",
        name: "Stable Diffusion",
        icon: "sparkles",
        description: "开源本地部署图像生成工具，支持 LoRA 模型定制、ControlNet 控制，可完全离线运行。",
        summary: "开源 AI 图像生成",
        tags: ["免费", "开源"],
        url: "https://github.com/AUTOMATIC1111/stable-diffusion-webui",
        category: "image",
        featured: false
    }
];

// 分类配置
const CATEGORIES = {
    chat: { name: "聊天AI", color: "chat", icon: "message-circle" },
    image: { name: "绘图生成", color: "image", icon: "image" },
    code: { name: "代码辅助", color: "code", icon: "code-2" },
    writing: { name: "写作助手", color: "writing", icon: "pen-tool" },
    office: { name: "办公效率", color: "office", icon: "briefcase" }
};

// 导出数据（支持 ES Module 和全局变量两种方式）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TOOLS_DATA, CATEGORIES };
}