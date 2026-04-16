/**
 * AI工具集 - 主应用逻辑
 * 功能：工具卡片渲染、分类Tab切换、标签筛选、搜索实时过滤、跳转链接
 * 数据源：FastAPI 后端 API
 */

const API_BASE = 'http://localhost:8000/api/v1';
const FAVORITES_KEY = 'ai-tools-favorites';

// 收藏数据管理
const favoritesManager = {
    getAll() {
        try {
            return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        } catch {
            return [];
        }
    },
    has(toolId) {
        return this.getAll().includes(toolId);
    },
    toggle(toolId) {
        const favs = this.getAll();
        if (favs.includes(toolId)) {
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs.filter(id => id !== toolId)));
            return false;
        } else {
            favs.push(toolId);
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
            return true;
        }
    },
    getTools() {
        const ids = this.getAll();
        return state.allTools.filter(tool => ids.includes(tool.id));
    }
};

// 状态管理
const state = {
    currentCategory: 'all',
    currentTag: 'all',
    searchQuery: '',
    filteredTools: [],
    allTools: [],
    categories: [],
    tags: [],
    loading: true,
};

// DOM 元素引用
const elements = {
    toolsGrid: document.getElementById('toolsGrid'),
    emptyState: document.getElementById('emptyState'),
    searchInput: document.getElementById('searchInput'),
    searchInputMobile: document.getElementById('searchInputMobile'),
    categoryTabs: document.getElementById('categoryTabs'),
    tagFilters: document.getElementById('tagFilters'),
    themeToggle: document.getElementById('themeToggle'),
    loadingState: document.getElementById('loadingState'),
};

/**
 * 初始化应用（仅在首页执行）
 */
async function init() {
    // 详情页不执行首页初始化逻辑
    if (!document.getElementById('toolsGrid')) return;

    // 初始化图标
    lucide.createIcons();

    // 加载主题
    loadThemePreference();

    // 绑定事件
    bindEvents();

    // 加载API数据
    await loadData();
}

/**
 * 从API加载数据
 */
async function loadData() {
    try {
        showLoading(true);

        // 并行加载分类、标签、工具列表
        const [catsRes, tagsRes, toolsRes] = await Promise.all([
            fetch(`${API_BASE}/categories`),
            fetch(`${API_BASE}/tags`),
            fetch(`${API_BASE}/tools?page_size=50`),
        ]);

        const catsData = await catsRes.json();
        const tagsData = await tagsRes.json();
        const toolsData = await toolsRes.json();

        // 解析数据
        state.categories = catsData.data || [];
        state.tags = tagsData.data || [];
        state.allTools = toolsData.data?.items || [];

        // 渲染分类Tab
        renderCategoryTabs();

        // 渲染标签筛选
        renderTagFilters();

        // 渲染编辑精选
        renderFeaturedTools();

        // 初始渲染
        filterAndRender();

    } catch (err) {
        console.error('API加载失败，使用本地Mock数据:', err);
        // API失败时降级到本地数据
        await loadMockData();
    } finally {
        showLoading(false);
    }
}

/**
 * 降级方案：加载本地Mock数据
 */
async function loadMockData() {
    state.categories = [
        { slug: 'chat', name: 'AI 对话', icon: '🤖' },
        { slug: 'image', name: 'AI 绘图', icon: '🎨' },
        { slug: 'code', name: '代码辅助', icon: '💻' },
        { slug: 'writing', name: '写作助手', icon: '✍️' },
        { slug: 'video', name: '办公效率', icon: '🎬' },
    ];
    state.tags = [
        { name: '免费' }, { name: '付费' }, { name: '开源' },
        { name: '国产' }, { name: '海外' },
    ];
    state.allTools = TOOLS_DATA || [];
    renderCategoryTabs();
    renderTagFilters();
    renderFeaturedTools();
    filterAndRender();
}

/**
 * 渲染分类Tab
 */
function renderCategoryTabs() {
    const { categoryTabs } = elements;
    if (!categoryTabs) return;

    // "全部" tab
    let html = `<button class="category-tab active px-4 py-1.5 rounded-full text-sm font-medium bg-[#6366F1] text-white transition-all">全部</button>`;

    state.categories.forEach(cat => {
        html += `
            <button class="category-tab px-4 py-1.5 rounded-full text-sm font-medium bg-[#111827] dark:text-[#94A3B8] hover:bg-[#1a2236] transition-all"
                data-category="${cat.slug}">
                ${cat.icon || ''} ${cat.name}
            </button>
        `;
    });

    categoryTabs.innerHTML = html;
}

/**
 * 渲染标签筛选
 */
function renderTagFilters() {
    const { tagFilters } = elements;
    if (!tagFilters) return;

    let html = `<button class="tag-filter active px-3 py-1 rounded-full text-xs font-medium bg-[#6366F1]/10 text-[#6366F1] transition-all">全部</button>`;

    state.tags.forEach(tag => {
        html += `
            <button class="tag-filter px-3 py-1 rounded-full text-xs font-medium bg-[#111827] dark:text-[#94A3B8] hover:bg-[#1a2236] transition-all"
                data-tag="${tag.name}">
                ${tag.name}
            </button>
        `;
    });

    tagFilters.innerHTML = html;
}

/**
 * 绑定事件监听
 */
function bindEvents() {
    // 搜索输入（防抖处理）
    const handleSearch = debounce((e) => {
        state.searchQuery = e.target.value.trim().toLowerCase();
        filterAndRender();
    }, 300);

    elements.searchInput?.addEventListener('input', handleSearch);
    elements.searchInputMobile?.addEventListener('input', handleSearch);

    // 分类Tab点击（事件委托）
    elements.categoryTabs?.addEventListener('click', (e) => {
        const tab = e.target.closest('.category-tab');
        if (!tab) return;

        document.querySelectorAll('.category-tab').forEach(t => {
            t.classList.remove('active', 'bg-[#6366F1]', 'text-white');
            t.classList.add('bg-[#111827]', 'dark:text-[#94A3B8]');
        });
        tab.classList.add('active', 'bg-[#6366F1]', 'text-white');
        tab.classList.remove('bg-[#111827]', 'dark:text-[#94A3B8]');

        state.currentCategory = tab.dataset.category || 'all';
        filterAndRender();
    });

    // 标签筛选点击（事件委托）
    elements.tagFilters?.addEventListener('click', (e) => {
        const tag = e.target.closest('.tag-filter');
        if (!tag) return;

        document.querySelectorAll('.tag-filter').forEach(t => {
            t.classList.remove('active', 'bg-[#6366F1]/10', 'text-[#6366F1]');
            t.classList.add('bg-[#111827]', 'dark:text-[#94A3B8]');
        });
        tag.classList.add('active', 'bg-[#6366F1]/10', 'text-[#6366F1]');
        tag.classList.remove('bg-[#111827]', 'dark:text-[#94A3B8]');

        state.currentTag = tag.dataset.tag || 'all';
        filterAndRender();
    });

    // 暗色模式切换
    elements.themeToggle?.addEventListener('click', toggleTheme);
}

/**
 * 过滤工具数据（前端过滤）
 */
function filterTools() {
    let tools = state.allTools;

    // 收藏分类特殊处理
    if (state.currentCategory === 'favorites') {
        const favIds = favoritesManager.getAll();
        tools = tools.filter(tool => favIds.includes(tool.id));
    } else {
        tools = tools.filter(tool => {
            // 分类过滤
            if (state.currentCategory !== 'all' && tool.category !== state.currentCategory) {
                return false;
            }
            return true;
        });
    }

    // 标签过滤（收藏模式下也支持）
    if (state.currentTag !== 'all') {
        tools = tools.filter(tool => (tool.tags || []).includes(state.currentTag));
    }

    // 搜索过滤
    if (state.searchQuery) {
        tools = tools.filter(tool => {
            const searchFields = [
                tool.name,
                tool.description || '',
                tool.summary || '',
                ...(tool.tags || []),
            ].join(' ').toLowerCase();
            return searchFields.includes(state.searchQuery);
        });
    }

    return tools;
}

/**
 * 过滤并渲染
 */
function filterAndRender() {
    state.filteredTools = filterTools();
    renderTools(state.filteredTools);
}

/**
 * 渲染工具卡片
 */
function renderTools(tools) {
    const { toolsGrid, emptyState } = elements;

    // 空状态处理
    if (tools.length === 0) {
        toolsGrid.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        if (emptyState) {
            // 根据当前tab定制空状态文案
            if (state.currentCategory === 'favorites') {
                emptyState.querySelector('h3').textContent = '暂无收藏';
                emptyState.querySelector('p').textContent = '暂无收藏，快去探索吧 🚀';
            } else {
                emptyState.querySelector('h3').textContent = '没有找到匹配的工具';
                emptyState.querySelector('p').textContent = '试试其他关键词或筛选条件';
            }
        }
        return;
    }

    if (emptyState) {
        emptyState.classList.add('hidden');
        // 恢复默认空状态文案
        const h3 = emptyState.querySelector('h3');
        const p = emptyState.querySelector('p');
        if (h3) h3.textContent = '没有找到匹配的工具';
        if (p) p.textContent = '试试其他关键词或筛选条件';
    }

    // 生成卡片HTML
    toolsGrid.innerHTML = tools.map((tool, index) => createToolCard(tool, index)).join('');

    // 重新初始化图标
    lucide.createIcons();

    // 绑定卡片点击事件 → 跳转详情页
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', (e) => {
            // 忽略收藏按钮和访问按钮的点击
            if (e.target.closest('.fav-btn') || e.target.closest('.visit-btn')) return;
            const toolId = card.dataset.toolId;
            if (toolId) {
                window.location.href = `detail.html?id=${toolId}`;
            }
        });
    });

    // 绑定访问按钮事件
    document.querySelectorAll('.visit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
        });
    });
}

/**
 * 切换收藏状态（全局函数，供 onclick 调用）
 */
function handleFavoriteToggle(toolId) {
    const isFav = favoritesManager.toggle(toolId);

    // 更新当前页面的收藏按钮样式
    const btn = document.querySelector(`.fav-btn[data-tool-id="${toolId}"]`);
    if (btn) {
        const icon = btn.querySelector('i');
        if (isFav) {
            btn.classList.add('text-red-400');
            btn.classList.remove('text-[#8892a4]');
            icon.setAttribute('data-lucide', 'heart');
            icon.classList.add('fill-red-400');
            // 心跳动画
            btn.classList.add('heart-beat');
            setTimeout(() => btn.classList.remove('heart-beat'), 600);
        } else {
            btn.classList.remove('text-red-400');
            btn.classList.add('text-[#8892a4]');
            icon.setAttribute('data-lucide', 'heart');
            icon.classList.remove('fill-red-400');
        }
        lucide.createIcons();
    }

    // 如果当前在收藏tab，实时刷新列表
    if (state.currentCategory === 'favorites') {
        filterAndRender();
    }
}

/**
 * 渲染编辑精选工具（横向滚动）
 */
function renderFeaturedTools() {
    const container = document.getElementById('featuredTools');
    const section = document.getElementById('featuredSection');
    if (!container || !section) return;

    // 获取 featured=true 的工具，最多10个
    const featuredTools = state.allTools
        .filter(tool => tool.featured === true)
        .slice(0, 10);

    // 如果没有精选工具，隐藏整个区域
    if (featuredTools.length === 0) {
        section.classList.add('hidden');
        return;
    }

    section.classList.remove('hidden');
    container.innerHTML = featuredTools.map(tool => createFeaturedCard(tool)).join('');

    lucide.createIcons();

    // 绑定精选卡片点击事件
    document.querySelectorAll('.featured-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('.fav-btn') || e.target.closest('.visit-btn')) return;
            const toolId = card.dataset.toolId;
            if (toolId) {
                window.location.href = `detail.html?id=${toolId}`;
            }
        });
    });

    // 绑定访问按钮事件
    document.querySelectorAll('.featured-visit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            if (url) window.open(url, '_blank', 'noopener,noreferrer');
        });
    });
}

/**
 * 创建精选工具卡片HTML（紧凑横向滚动卡片）
 */
function createFeaturedCard(tool) {
    const tags = tool.tags || [];
    const isFav = favoritesManager.has(tool.id);
    const categoryIconMap = {
        'chat': '🤖', 'image': '🎨', 'code': '💻',
        'writing': '✍️', 'video': '🎬', 'other': '🔧',
    };
    const icon = categoryIconMap[tool.category] || '🔧';

    const tagColorMap = {
        '免费': 'bg-emerald-50 text-emerald-600',
        '付费': 'bg-amber-50 text-amber-600',
        '付费订阅': 'bg-amber-50 text-amber-600',
        '开源': 'bg-blue-50 text-blue-600',
        '国产': 'bg-purple-50 text-purple-600',
        '大厂': 'bg-indigo-50 text-indigo-600',
        '免费+付费': 'bg-orange-50 text-orange-600',
        '国际': 'bg-sky-50 text-sky-600',
        'API': 'bg-gray-50 text-gray-600',
    };

    // 判断是否新增（id < 10 或有 created_at 字段且在7天内）
    const isNew = tool.id < 10;

    return `
        <article class="featured-card featured-card"
            data-tool-id="${tool.id}">
            <div class="flex items-start justify-between mb-3">
                <div class="w-9 h-9 featured-icon-wrap">
                    ${icon}
                </div>
                ${isNew ? '<span class="absolute top-3 right-14 text-xs px-1.5 py-0.5 bg-green-100 text-green-600 rounded font-medium">🆕 新增</span>' : ''}
                <button class="fav-btn w-7 h-7 rounded-full flex items-center justify-center transition-all duration-150 hover:rgba(239,68,68,0.1) ${isFav ? 'text-red-400' : 'text-[#8892a4]'}"
                    data-tool-id="${tool.id}"
                    title="${isFav ? '取消收藏' : '收藏'}"
                    onclick="event.stopPropagation(); handleFavoriteToggle(${tool.id})">
                    <i data-lucide="heart" class="w-4 h-4 ${isFav ? 'fill-red-400' : ''}"></i>
                </button>
            </div>

            <h3 class="font-semibold featured-name mb-2 truncate">
                ${tool.name}
            </h3>

            <p class="featured-desc leading-relaxed">
                ${tool.description || tool.summary || ''}
            </p>

            <div class="flex flex-wrap gap-1 mb-3">
                ${tags.slice(0, 2).map(tag => {
                    const colorClass = tagColorMap[tag] || 'bg-gray-50 text-gray-500';
                    return `<span class="text-xs px-1.5 py-0.5 rounded-full font-medium ${colorClass}">${tag}</span>`;
                }).join('')}
            </div>

            <button class="featured-visit-btn w-full py-1.5 px-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-1.5"
                data-url="${tool.url || ''}">
                <span>访问</span>
                <i data-lucide="external-link" class="w-3 h-3"></i>
            </button>
        </article>
    `;
}

/**
 * 创建工具卡片HTML
 */
function createToolCard(tool, index) {
    const tags = tool.tags || [];
    const isFav = favoritesManager.has(tool.id);
    const categoryIconMap = {
        'chat': '🤖', 'image': '🎨', 'code': '💻',
        'writing': '✍️', 'video': '🎬', 'other': '🔧',
    };
    const icon = categoryIconMap[tool.category] || '🔧';

    const tagColorMap = {
        '免费': 'bg-emerald-50 text-emerald-600',
        '付费': 'bg-amber-50 text-amber-600',
        '付费订阅': 'bg-amber-50 text-amber-600',
        '开源': 'bg-blue-50 text-blue-600',
        '国产': 'bg-purple-50 text-purple-600',
        '大厂': 'bg-indigo-50 text-indigo-600',
        '免费+付费': 'bg-orange-50 text-orange-600',
        '国际': 'bg-sky-50 text-sky-600',
        'API': 'bg-gray-50 text-gray-600',
    };

    // 判断是否新增（id < 10）
    const isNew = tool.id < 10;

    return `
        <article class="tool-card tool-card"
            data-url="${tool.url || ''}"
            data-tool-id="${tool.id}"
            style="animation-delay: ${index * 50}ms">
            <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 var(--bg-card) rounded-xl flex items-center justify-center text-2xl">
                    ${icon}
                </div>
                <div class="flex items-center gap-1.5">
                    ${isNew ? '<span class="tag bg-green-50 text-green-600 text-xs px-2 py-0.5 rounded-full font-medium">🆕 新增</span>' : ''}
                    ${tool.featured ? '<span class="tag bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full font-medium">推荐</span>' : ''}
                    <!-- 收藏按钮 -->
                    <button class="fav-btn w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 hover:rgba(239,68,68,0.1) ${isFav ? 'text-red-400' : 'text-[#8892a4]'}"
                        data-tool-id="${tool.id}"
                        title="${isFav ? '取消收藏' : '收藏'}"
                        onclick="event.stopPropagation(); handleFavoriteToggle(${tool.id})">
                        <i data-lucide="${isFav ? 'heart' : 'heart'}" class="w-4 h-4 ${isFav ? 'fill-red-400' : ''}"></i>
                    </button>
                </div>
            </div>

            <h3 class="text-base font-semibold var(--text-primary) mb-2 truncate">
                ${tool.name}
            </h3>

            <p class="text-sm var(--text-secondary) mb-4 line-clamp-2 leading-relaxed">
                ${tool.description || tool.summary || ''}
            </p>

            <div class="flex flex-wrap gap-1.5 mb-4">
                ${tags.slice(0, 3).map(tag => {
                    const colorClass = tagColorMap[tag] || 'bg-gray-50 text-gray-500';
                    return `<span class="text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}">${tag}</span>`;
                }).join('')}
            </div>

            <button class="visit-btn w-full py-2 px-4 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-medium rounded-lg transition-colors duration-150 flex items-center justify-center gap-2"
                data-url="${tool.url || ''}">
                <span>访问工具</span>
                <i data-lucide="external-link" class="w-4 h-4"></i>
            </button>
        </article>
    `;
}

/**
 * 显示/隐藏加载状态
 */
function showLoading(show) {
    state.loading = show;
    const { loadingState, toolsGrid } = elements;
    if (!loadingState) return;

    if (show) {
        loadingState.classList.remove('hidden');
        loadingState.innerHTML = `
            <div class="flex flex-col items-center justify-center py-16 gap-3">
                <div class="w-10 h-10 border-4 border-[#6366F1]/20 border-t-[#6366F1] rounded-full animate-spin"></div>
                <p class="text-sm var(--text-secondary)">加载中...</p>
            </div>
        `;
        toolsGrid.innerHTML = '';
    } else {
        loadingState.classList.add('hidden');
    }
}

/**
 * 切换暗色/亮色主题
 */
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    const icon = elements.themeToggle?.querySelector('i');
    if (icon) {
        icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
    }
}

/**
 * 加载保存的主题偏好
 */
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.classList.add('dark');
        const icon = elements.themeToggle?.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', 'sun');
            lucide.createIcons();
        }
    }
}

/**
 * 防抖函数
 */
function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
