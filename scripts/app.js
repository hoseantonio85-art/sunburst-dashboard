class App {
    constructor() {
        this.data = null;
        this.chart = null;
        this.currentNode = null;
        
        // Элементы DOM
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
            console.log('Приложение инициализировано успешно');
        } catch (error) {
            console.error('Ошибка инициализации приложения:', error);
            this.showError('Не удалось загрузить данные');
        }
    }

    async loadData() {
        try {
            const response = await fetch('data/dataset.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            console.log('Данные успешно загружены:', this.data);
        } catch (error) {
            console.warn('Ошибка загрузки данных, используем fallback данные:', error);
            this.data = this.getFallbackData();
        }
    }

    initChart() {
        this.chart = new SunburstChart(
            this.elements.sunburstChart,
            this.data,
            (node) => this.updateDetails(node)
        );
        
        // Показываем начальное состояние
        this.updateDetails(this.chart.root);
    }

    setupEventHandlers() {
        // Обработчик кнопки "Назад"
        this.elements.backButton.addEventListener('click', () => {
            this.handleBackClick();
        });

        // Обработчик клика по фону для возврата к корню
        this.elements.sunburstChart.addEventListener('click', (event) => {
            if (event.target === this.elements.sunburstChart) {
                this.chart.history = [this.chart.root];
                this.chart.currentRoot = this.chart.root;
                this.chart.updateChart();
                this.updateDetails(this.chart.root);
            }
        });

        // Обработчик клавиатуры
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.chart.getCurrentDepth() > 0) {
                this.handleBackClick();
            }
        });
    }

    handleBackClick() {
        const success = this.chart.goBack();
        if (success) {
            this.updateBackButton();
        }
    }

    updateDetails(node) {
        this.currentNode = node;
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
        
        // Добавляем анимацию появления
        setTimeout(() => {
            this.elements.detailsPanel.classList.add('fade-in');
        }, 50);
    }

    createRootDetails(nodeInfo) {
        const totalRisks = this.calculateTotalMetrics(this.data);
        
        return `
            <div class="details-header">
                <h2>${nodeInfo.name}</h2>
                <div class="overview-stats">
                    <div class="stat-item">
                        <div class="stat-value">${totalRisks.categories}</div>
                        <div class="stat-label">Категорий рисков</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${totalRisks.subRisks}</div>
                        <div class="stat-label">Типов рисков</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${this.formatCurrency(totalRisks.totalValue)}</div>
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
                    <div class="metric-value">${metrics.totalValue}</div>
                    <div class="metric-label">Потенциальные потери</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${subRisks.length}</div>
                    <div class="metric-label">Подриски</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${metrics.incidents}</div>
                    <div class="metric-label">Инциденты</div>
                </div>
                <div class="metric-item">
                    <div class="metric-value">${metrics.coverage}%</div>
                    <div class="metric-label">Покрытие</div>
                </div>
            </div>

            <div class="sub-risks-section">
                <h3>Входящие риски</h3>
                ${subRisks.map(risk => this.createRiskCard(risk)).join('')}
            </div>
        `;
    }

    createRiskDetails(nodeInfo, node) {
        const riskData = node.data.details || this.generateMockRiskDetails(nodeInfo);
        
        return `
            <div class="details-header">
                <h2>${nodeInfo.name}</h2>
                <div class="risk-level-badge ${nodeInfo.riskLevel}">
                    ${this.getRiskLevelText(nodeInfo.riskLevel)}
                </div>
            </div>

            <!-- Основные метрики -->
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

            <!-- Драйверы риска -->
            <div class="section">
                <h3>Драйверы риска</h3>
                <div class="hash-tags">
                    ${riskData.drivers.map(driver => 
                        `<span class="hash-tag">#${driver}</span>`
                    ).join('')}
                </div>
            </div>

            <!-- Инциденты -->
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

            <!-- Покрытие мерами -->
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

            <!-- Инфоповоды -->
            <div class="section">
                <h3>Инфоповоды</h3>
                <div class="info-events">
                    ${riskData.infoEvents.map(event => 
                        `<div class="info-event">
                            <strong>${event.date}</strong>: ${event.description}
                        </div>`
                    ).join('')}
                </div>
            </div>

            <!-- AI анализ -->
            <div class="ai-analysis">
                <h4>🤖 AI Анализ ситуации</h4>
                <p>${riskData.aiAnalysis.assessment}</p>
                <p><strong>Рекомендации:</strong> ${riskData.aiAnalysis.recommendations}</p>
            </div>
        `;
    }

    createRiskCard(node) {
        const info = this.chart.getNodeInfo(node);
        return `
            <div class="risk-card ${info.riskLevel}" onclick="app.chart.handleClick(event, ${this.getNodeReference(node)})">
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

    updateBackButton() {
        const depth = this.chart.getCurrentDepth();
        this.elements.backButton.disabled = depth === 0;
        
        if (depth > 0) {
            this.elements.backButton.title = `Вернуться к ${this.chart.history[this.chart.history.length - 2].data.name}`;
        }
    }

    // Вспомогательные методы
    calculateTotalMetrics(data) {
        let categories = 0;
        let subRisks = 0;
        let totalValue = 0;

        const traverse = (node) => {
            if (node.children) {
                if (node.depth === 0) {
                    categories = node.children.length;
                }
                node.children.forEach(child => {
                    if (child.value) totalValue += child.value;
                    if (child.depth === 2) subRisks++;
                    traverse(child);
                });
            }
        };

        traverse(d3.hierarchy(data));
        return { categories, subRisks, totalValue };
    }

    calculateCategoryMetrics(node) {
        let totalValue = 0;
        let incidents = 0;
        let coverage = 0;

        const traverse = (n) => {
            if (n.data.value) totalValue += n.data.value;
            if (n.data.details) {
                incidents += n.data.details.incidents?.total || 0;
                coverage = Math.max(coverage, n.data.details.coverage?.percentage || 0);
            }
            if (n.children) n.children.forEach(traverse);
        };

        traverse(node);
        return { totalValue: this.formatCurrency(totalValue), incidents, coverage };
    }

    calculateRiskDistribution(data) {
        const distribution = { 'very-high': 0, 'high': 0, 'medium': 0, 'low': 0 };
        
        const traverse = (node) => {
            if (node.riskLevel && distribution.hasOwnProperty(node.riskLevel)) {
                distribution[node.riskLevel]++;
            }
            if (node.children) {
                node.children.forEach(traverse);
            }
        };

        traverse(data);
        return distribution;
    }

    formatCurrency(value) {
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

    getNodeReference(node) {
        // В реальном приложении здесь была бы более сложная логика
        return `app.chart.root${this.getNodePath(node)}`;
    }

    getNodePath(node) {
        let path = '';
        let current = node;
        while (current.parent) {
            const index = current.parent.children.indexOf(current);
            path = `.children[${index}]${path}`;
            current = current.parent;
        }
        return path;
    }

    generateMockRiskDetails(nodeInfo) {
        // Генерация mock данных для демонстрации
        const riskMultipliers = {
            'very-high': 10,
            'high': 5,
            'medium': 2,
            'low': 1
        };

        const multiplier = riskMultipliers[nodeInfo.riskLevel] || 1;

        return {
            directLosses: 500000 * multiplier,
            indirectLosses: 250000 * multiplier,
            riskLimit: 2000000 * multiplier,
            forecast: 750000 * multiplier,
            drivers: ['регуляторика', 'технологии', 'персонал', 'внешняя_среда'].slice(0, 2 + multiplier),
            incidents: {
                total: 15 * multiplier,
                top: [
                    { name: 'Сбой системы', frequency: '12 раз' },
                    { name: 'Ошибка оператора', frequency: '8 раз' },
                    { name: 'Внешняя атака', frequency: '5 раз' }
                ]
            },
            coverage: {
                percentage: Math.min(80 + (multiplier * 5), 95),
                covered: 8 * multiplier,
                total: 10 * multiplier
            },
            infoEvents: [
                { date: '2024-01-15', description: 'Изменения в законодательстве' },
                { date: '2024-01-10', description: 'Техническое обновление системы' }
            ],
            aiAnalysis: {
                assessment: 'Уровень риска требует повышенного внимания. Наблюдается рост частоты инцидентов.',
                recommendations: 'Усилить мониторинг, провести тренинг сотрудников, обновить процедуры контроля.'
            }
        };
    }

    showError(message) {
        this.elements.detailsPanel.innerHTML = `
            <div class="error-message">
                <h3>Ошибка</h3>
                <p>${message}</p>
                <button onclick="app.init()">Повторить попытку</button>
            </div>
        `;
    }

    getFallbackData() {
        // Возвращаем базовую структуру данных для демонстрации
        return {
            "name": "Операционные риски",
            "riskLevel": "medium",
            "value": 10000000,
            "children": [
                {
                    "name": "Законы",
                    "riskLevel": "high",
                    "value": 2000000,
                    "children": [
                        {"name": "Правовые риски", "riskLevel": "high", "value": 1200000},
                        {"name": "Регуляторные риски", "riskLevel": "medium", "value": 600000},
                        {"name": "Риски информационной безопасности", "riskLevel": "high", "value": 200000}
                    ]
                },
                {
                    "name": "ИТ",
                    "riskLevel": "medium", 
                    "value": 1500000,
                    "children": [
                        {"name": "Технологические риски", "riskLevel": "medium", "value": 1500000}
                    ]
                }
            ]
        };
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
