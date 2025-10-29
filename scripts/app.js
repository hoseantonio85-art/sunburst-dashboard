class App {
    constructor() {
        this.data = null;
        this.chart = null;
        
        // DOM элементы
        this.elements = {
            sunburstChart: document.getElementById('sunburstChart'),
            detailsPanel: document.getElementById('detailsPanel'),
            backButton: document.getElementById('backButton')
        };

        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.initChart();
            this.setupEventHandlers();
            this.updateBackButton();
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showError('Не удалось загрузить данные. Используются демо-данные.');
            this.data = this.getFallbackData();
            this.initChart();
        }
    }

    async loadData() {
        try {
            const response = await fetch('data/dataset.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            this.data = await response.json();
        } catch (error) {
            console.warn('Ошибка загрузки данных:', error);
            throw error;
        }
    }

    initChart() {
        this.chart = new SunburstChart(
            this.elements.sunburstChart,
            this.data,
            (node) => this.updateDetails(node)
        );
        
        // Показываем корневой узел
        this.updateDetails(this.chart.root);
    }

    setupEventHandlers() {
        // Кнопка "Назад"
        this.elements.backButton.addEventListener('click', () => {
            const success = this.chart.goBack();
            if (success) {
                this.updateBackButton();
            }
        });

        // Клик по фону для сброса
        this.elements.sunburstChart.addEventListener('click', (event) => {
            if (event.target === this.elements.sunburstChart && this.chart.history.length > 1) {
                // Сбрасываем к корню
                this.chart.history = [this.chart.root];
                this.chart.currentNode = this.chart.root;
                this.chart.animateToNode(this.chart.root);
                this.updateDetails(this.chart.root);
                this.updateBackButton();
            }
        });
    }

    updateDetails(node) {
        if (!node) return;
        
        const nodeInfo = this.chart.getNodeInfo(node);
        let detailsHTML = '';

        if (node.depth === 0) {
            detailsHTML = this.createRootDetails(nodeInfo);
        } else if (node.depth === 1) {
            detailsHTML = this.createCategoryDetails(nodeInfo, node);
        } else {
            detailsHTML = this.createRiskDetails(nodeInfo, node);
        }

        this.elements.detailsPanel.innerHTML = detailsHTML;
        this.updateBackButton();
    }

    createRootDetails(nodeInfo) {
        const metrics = this.calculateRootMetrics(this.data);
        
        return `
            <div class="details-header">
                <h2>${nodeInfo.name}</h2>
                <div class="overview-stats">
                    <div class="stat-item">
                        <div class="stat-value">${metrics.categories}</div>
                        <div class="stat-label">Категорий рисков</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${metrics.subRisks}</div>
                        <div class="stat-label">Типов рисков</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.formatCurrency(metrics.totalValue)}</div>
                        <div class="stat-label">Суммарные потери</div>
                    </div>
                </div>
            </div>
            <div class="risk-distribution">
                <h3>Распределение рисков</h3>
                ${this.createRiskDistribution(this.data)}
            </div>
        `;
    }

    createCategoryDetails(nodeInfo, node) {
        const subRisks = node.children || [];
        const metrics = this.calculateCategoryMetrics(node);
        
        return `
            <div class="details-header">
                <h2>${nodeInfo.name}</h2>
                <div class="risk-level-badge ${nodeInfo.riskLevel}">
                    ${this.getRiskLevelText(nodeInfo.riskLevel)}
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-item">
                    <div class="metric-value">${this.formatCurrency(metrics.totalValue)}</div>
                    <div class="metric-label">Потенциальные потери</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${subRisks.length}</div>
                    <div class="metric-label">Подриски</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${metrics.highRisks}</div>
                    <div class="metric-label">Высоких рисков</div>
                </div>
            </div>

            <div class="sub-risks-section">
                <h3>Входящие риски</h3>
                ${subRisks.map(risk => this.createRiskCard(risk)).join('')}
            </div>
        `;
    }

    createRiskDetails(nodeInfo, node) {
        const riskData = node.data.details || this.generateRiskDetails(nodeInfo);
        
        return `
            <div class="details-header">
                <h2>${nodeInfo.name}</h2>
                <div class="risk-level-badge ${nodeInfo.riskLevel}">
                    ${this.getRiskLevelText(nodeInfo.riskLevel)}
                </div>
            </div>

            <div class="section">
                <h3>Основные метрики</h3>
                <div class="metrics-grid">
                    <div class="metric-item">
                        <div class="metric-value">${this.formatCurrency(riskData.directLosses)}</div>
                        <div class="metric-label">Прямые потери</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${this.formatCurrency(riskData.indirectLosses)}</div>
                        <div class="metric-label">Косвенные потери</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${this.formatCurrency(riskData.riskLimit)}</div>
                        <div class="metric-label">Лимит риска</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value">${this.formatCurrency(riskData.forecast)}</div>
                        <div class="metric-label">Прогноз</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h3>Драйверы риска</h3>
                <div class="hash-tags">
                    ${riskData.drivers.map(driver => 
                        `<span class="hash-tag">#${driver}</span>`
                    ).join('')}
                </div>
            </div>

            <div class="section">
                <h3>Инциденты</h3>
                <div class="incident-stats">
                    <div class="stat-item">
                        <div class="stat-value">${riskData.incidents.total}</div>
                        <div class="stat-label">Всего инцидентов</div>
                    </div>
                </div>
                <ul class="incident-list">
                    ${riskData.incidents.top.map(incident => 
                        `<li class="incident-item">
                            <strong>${incident.name}</strong><br>
                            Частота: ${incident.frequency}
                        </li>`
                    ).join('')}
                </ul>
            </div>

            <div class="section">
                <h3>Покрытие мерами</h3>
                <div class="coverage-info">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${riskData.coverage.percentage}%"></div>
                    </div>
                    <div class="coverage-stats">
                        ${riskData.coverage.covered}/${riskData.coverage.total} мер принято
                    </div>
                </div>
            </div>

            ${riskData.aiAnalysis ? `
            <div class="ai-analysis">
                <h4>🤖 AI Анализ ситуации</h4>
                <p>${riskData.aiAnalysis.assessment}</p>
                <p><strong>Рекомендации:</strong> ${riskData.aiAnalysis.recommendations}</p>
            </div>
            ` : ''}
        `;
    }

    createRiskCard(node) {
        const info = this.chart.getNodeInfo(node);
        return `
            <div class="risk-card ${info.riskLevel}" 
                 onclick="app.chart.handleClick(d3.event, ${this.getNodeReference(node)})"
                 style="cursor: pointer;">
                <div class="risk-card-header">
                    <div class="risk-name">${info.name}</div>
                    <div class="risk-level-badge ${info.riskLevel}">
                        ${this.getRiskLevelText(info.riskLevel)}
                    </div>
                </div>
                <div class="risk-value">${this.formatCurrency(info.value || 0)}</div>
            </div>
        `;
    }

    getNodeReference(node) {
        // Простая реализация для демонстрации
        return `app.chart.root${this.getNodePath(node)}`;
    }

    getNodePath(node) {
        let path = '';
        let current = node;
        const pathArray = [];
        
        while (current && current.parent) {
            const index = current.parent.children.indexOf(current);
            pathArray.unshift(`.children[${index}]`);
            current = current.parent;
        }
        
        return pathArray.join('');
    }

    updateBackButton() {
        const canGoBack = this.chart && this.chart.history.length > 1;
        this.elements.backButton.disabled = !canGoBack;
        
        if (canGoBack) {
            const previousNode = this.chart.history[this.chart.history.length - 2];
            this.elements.backButton.title = `Вернуться к ${previousNode.data.name}`;
        } else {
            this.elements.backButton.title = '';
        }
    }

    // Вспомогательные методы
    calculateRootMetrics(data) {
        const hierarchy = d3.hierarchy(data);
        let categories = 0;
        let subRisks = 0;
        let totalValue = 0;

        hierarchy.each(node => {
            if (node.depth === 1) categories++;
            if (node.depth === 2) subRisks++;
            if (node.data.value) totalValue += node.data.value;
        });

        return { categories, subRisks, totalValue };
    }

    calculateCategoryMetrics(node) {
        let totalValue = 0;
        let highRisks = 0;

        const traverse = (n) => {
            if (n.data.value) totalValue += n.data.value;
            if (n.data.riskLevel === 'high' || n.data.riskLevel === 'very-high') highRisks++;
            if (n.children) n.children.forEach(traverse);
        };

        traverse(node);
        return { totalValue, highRisks };
    }

    createRiskDistribution(data) {
        const distribution = this.calculateRiskDistribution(data);
        return `
            <div class="distribution-chart">
                ${Object.entries(distribution).map(([level, count]) => `
                    <div class="distribution-item">
                        <span class="distribution-level ${level}">${this.getRiskLevelText(level)}</span>
                        <span class="distribution-count">${count} рисков</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    calculateRiskDistribution(data) {
        const distribution = { 'very-high': 0, 'high': 0, 'medium': 0, 'low': 0 };
        const hierarchy = d3.hierarchy(data);
        
        hierarchy.each(node => {
            if (node.data.riskLevel && distribution.hasOwnProperty(node.data.riskLevel)) {
                distribution[node.data.riskLevel]++;
            }
        });

        return distribution;
    }

    formatCurrency(value) {
        if (!value) return '0 ₽';
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    }

    getRiskLevelText(level) {
        const levels = {
            'very-high': 'Очень высокий',
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        };
        return levels[level] || 'Не определен';
    }

    generateRiskDetails(nodeInfo) {
        const multipliers = {
            'very-high': 3,
            'high': 2,
            'medium': 1,
            'low': 0.5
        };

        const multiplier = multipliers[nodeInfo.riskLevel] || 1;

        return {
            directLosses: nodeInfo.value * 0.6,
            indirectLosses: nodeInfo.value * 0.4,
            riskLimit: nodeInfo.value * 2,
            forecast: nodeInfo.value * 0.8,
            drivers: ['регуляторика', 'технологии', 'персонал'].slice(0, 1 + multiplier),
            incidents: {
                total: Math.floor(10 * multiplier),
                top: [
                    { name: 'Типовой инцидент 1', frequency: `${Math.floor(5 * multiplier)} раз` },
                    { name: 'Типовой инцидент 2', frequency: `${Math.floor(3 * multiplier)} раз` }
                ]
            },
            coverage: {
                percentage: Math.max(30, 80 - (multiplier * 10)),
                covered: Math.floor(8 * multiplier),
                total: Math.floor(10 * multiplier)
            },
            aiAnalysis: {
                assessment: `Уровень риска требует ${nodeInfo.riskLevel === 'high' || nodeInfo.riskLevel === 'very-high' ? 'повышенного' : 'стандартного'} внимания.`,
                recommendations: 'Рекомендуется регулярный мониторинг и обновление процедур контроля.'
            }
        };
    }

    showError(message) {
        this.elements.detailsPanel.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Внимание</h3>
                <p>${message}</p>
            </div>
        `;
    }

    getFallbackData() {
        return {
            "name": "Операционные риски",
            "riskLevel": "medium",
            "value": 10000000,
            "children": [
                {
                    "name": "Законы",
                    "riskLevel": "high",
                    "value": 3000000,
                    "children": [
                        {"name": "Правовые риски", "riskLevel": "high", "value": 2000000},
                        {"name": "Регуляторные риски", "riskLevel": "medium", "value": 1000000}
                    ]
                },
                {
                    "name": "ИТ", 
                    "riskLevel": "medium",
                    "value": 2000000,
                    "children": [
                        {"name": "Технологические риски", "riskLevel": "medium", "value": 2000000}
                    ]
                }
            ]
        };
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
