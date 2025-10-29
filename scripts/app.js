class App {
    constructor() {
        this.chart = null;
        this.data = null;
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.initChart();
            this.setupEventHandlers();
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showError('Не удалось загрузить данные');
        }
    }

    async loadData() {
        try {
            const response = await fetch('data/dataset.json');
            this.data = await response.json();
        } catch (error) {
            console.warn('Не удалось загрузить данные из файла, используем тестовые данные');
            this.data = this.getSampleData();
        }
    }

    getSampleData() {
        return {
            name: "Операционные риски",
            children: [
                {
                    name: "Законы",
                    riskLevel: "high",
                    value: 450000,
                    children: [
                        { name: "Правовые риски", value: 180000, riskLevel: "high" },
                        { name: "Регуляторные риски", value: 150000, riskLevel: "medium" },
                        { name: "Риски информационной безопасности", value: 120000, riskLevel: "high" }
                    ]
                },
                {
                    name: "ИТ",
                    riskLevel: "medium", 
                    value: 380000,
                    children: [
                        { name: "Технологические риски", value: 380000, riskLevel: "medium" }
                    ]
                },
                {
                    name: "Клиенты",
                    riskLevel: "high",
                    value: 520000,
                    children: [
                        { name: "Риски внешнего мошенничества", value: 300000, riskLevel: "high" },
                        { name: "Риски клиентов", value: 220000, riskLevel: "medium" }
                    ]
                },
                {
                    name: "Партнеры",
                    riskLevel: "medium",
                    value: 290000,
                    children: [
                        { name: "Риски контрагентов", value: 120000, riskLevel: "medium" },
                        { name: "Риски цепочки поставок", value: 100000, riskLevel: "medium" },
                        { name: "Товарные риски", value: 70000, riskLevel: "low" }
                    ]
                },
                {
                    name: "Новости",
                    riskLevel: "low",
                    value: 90000,
                    children: [
                        { name: "Репутационные риски", value: 90000, riskLevel: "low" }
                    ]
                },
                {
                    name: "Процессы",
                    riskLevel: "medium",
                    value: 210000,
                    children: [
                        { name: "Процессные риски", value: 210000, riskLevel: "medium" }
                    ]
                },
                {
                    name: "Сотрудники",
                    riskLevel: "high",
                    value: 380000,
                    children: [
                        { name: "Риски внутреннего мошенничества", value: 220000, riskLevel: "high" },
                        { name: "Риски персонала", value: 160000, riskLevel: "medium" }
                    ]
                },
                {
                    name: "Внешние факторы",
                    riskLevel: "low",
                    value: 150000,
                    children: [
                        { name: "Природные риски", value: 60000, riskLevel: "low" },
                        { name: "Техногенные риски", value: 50000, riskLevel: "medium" },
                        { name: "Риски физической безопасности", value: 40000, riskLevel: "low" }
                    ]
                },
                {
                    name: "Проекты",
                    riskLevel: "medium",
                    value: 175000,
                    children: [
                        { name: "Проектные риски", value: 175000, riskLevel: "medium" }
                    ]
                }
            ]
        };
    }

    initChart() {
        const chartContainer = document.getElementById('chart');
        this.chart = new SunburstChart(chartContainer, this.data);
        
        this.chart.onSegmentClick((segment) => {
            this.updateDetails(segment);
            this.updateBackButton();
        });
        
        this.updateDetails(this.chart.root);
        this.updateBackButton();
    }

    updateDetails(segment) {
        const detailsContent = document.getElementById('details-content');
        
        if (!segment || segment.depth === 0) {
            detailsContent.innerHTML = `
                <div class="welcome-message">
                    <h4>Обзор операционных рисков</h4>
                    <p>Выберите категорию риска для детального анализа</p>
                    <div style="margin-top: 20px; text-align: left;">
                        <div class="metric" style="margin: 10px 0;">
                            <span class="metric-value">${this.chart.root.children ? this.chart.root.children.length : 0}</span>
                            <span class="metric-label">Всего категорий рисков</span>
                        </div>
                        <div class="metric" style="margin: 10px 0;">
                            <span class="metric-value">${d3.format(",d")(this.chart.root.value)}₽</span>
                            <span class="metric-label">Суммарные потенциальные потери</span>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        if (segment.children) {
            const totalLosses = segment.value;
            const riskCount = segment.children.length;
            const riskLevel = segment.data.riskLevel || 'low';
            
            let risksHTML = '';
            segment.children.forEach(child => {
                const riskLevelClass = child.data.riskLevel || 'low';
                risksHTML += `
                    <div class="risk-card ${riskLevelClass}">
                        <div class="risk-header">
                            <div>
                                <div class="risk-title">${child.data.name}</div>
                                <div style="color: #6c757d; font-size: 0.9rem;">
                                    Потери: ${d3.format(",d")(child.value || 0)}₽
                                </div>
                            </div>
                            <span class="risk-level-badge" style="background: ${this.chart.getRiskColor(riskLevelClass)}; color: ${(riskLevelClass === 'very-high' || riskLevelClass === 'high') ? 'white' : '#2c3e50'};">
                                ${this.chart.getRiskLevelText(riskLevelClass)}
                            </span>
                        </div>
                    </div>
                `;
            });

            detailsContent.innerHTML = `
                <div class="risk-card ${riskLevel}">
                    <div class="risk-header">
                        <div>
                            <div class="risk-title">${segment.data.name}</div>
                            <div style="color: #6c757d; font-size: 0.9rem;">
                                Категория рисков
                            </div>
                        </div>
                        <span class="risk-level-badge" style="background: ${this.chart.getRiskColor(riskLevel)}; color: ${(riskLevel === 'very-high' || riskLevel === 'high') ? 'white' : '#2c3e50'};">
                            ${this.chart.getRiskLevelText(riskLevel)}
                        </span>
                    </div>
                    
                    <div class="risk-metrics">
                        <div class="metric">
                            <span class="metric-value">${d3.format(",d")(totalLosses)}₽</span>
                            <span class="metric-label">Суммарные потери</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${riskCount}</span>
                            <span class="metric-label">Подрисков</span>
                        </div>
                    </div>
                </div>
                
                <div class="section-title">Входящие риски:</div>
                ${risksHTML}
            `;
        } else {
            const riskData = segment.data;
            const riskLevel = riskData.riskLevel || 'low';

            detailsContent.innerHTML = `
                <div class="risk-card ${riskLevel}">
                    <div class="risk-header">
                        <div>
                            <div class="risk-title">${riskData.name}</div>
                            <div style="color: #6c757d; font-size: 0.9rem;">
                                ${segment.parent.data.name} → ${riskData.name}
                            </div>
                        </div>
                        <span class="risk-level-badge" style="background: ${this.chart.getRiskColor(riskLevel)}; color: ${(riskLevel === 'very-high' || riskLevel === 'high') ? 'white' : '#2c3e50'};">
                            ${this.chart.getRiskLevelText(riskLevel)}
                        </span>
                    </div>
                    
                    <div class="risk-metrics">
                        <div class="metric">
                            <span class="metric-value">${d3.format(",d")(riskData.value || 0)}₽</span>
                            <span class="metric-label">Потенциальные потери</span>
                        </div>
                    </div>
                    
                    <div class="drivers-section">
                        <div class="section-title">Драйверы риска</div>
                        <div style="color: #495057;">
                            <div>• Изменение рыночных условий</div>
                            <div>• Внешние экономические факторы</div>
                            <div>• Операционные сбои</div>
                        </div>
                    </div>
                    
                    <div class="drivers-section">
                        <div class="section-title">Хештеги инцидентов</div>
                        <div class="hashtags">
                            <span class="hashtag">#риск</span>
                            <span class="hashtag">#инцидент</span>
                            <span class="hashtag">#${riskData.name.toLowerCase().replace(/\s+/g, '')}</span>
                        </div>
                    </div>
                    
                    <div class="incidents-section">
                        <div class="section-title">
                            Инциденты (всего: 5)
                        </div>
                        <div class="incident-item">
                            <strong>Типовой инцидент 1</strong>
                            <div style="color: #6c757d; font-size: 0.8rem;">2 инцидента</div>
                        </div>
                        <div class="incident-item">
                            <strong>Типовой инцидент 2</strong>
                            <div style="color: #6c757d; font-size: 0.8rem;">1 инцидент</div>
                        </div>
                    </div>
                    
                    <div class="coverage-section">
                        <div class="section-title">
                            Покрытие мерами (15/25)
                        </div>
                        <div class="coverage-progress">
                            <div class="coverage-bar" style="width: 60%"></div>
                        </div>
                        <div style="text-align: center; color: #28a745; font-weight: 600;">
                            60% покрыто
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="section-title">Влияющие инфоповоды</div>
                        <div class="info-item">Изменение законодательства в отрасли</div>
                        <div class="info-item">Рост числа кибератак</div>
                    </div>
                    
                    <div class="ai-section">
                        <div class="section-title">Анализ AI</div>
                        <div class="ai-conclusion">Уровень риска ${riskLevel === 'high' ? 'высокий' : riskLevel === 'medium' ? 'средний' : 'низкий'}. Рекомендуется усилить контрольные мероприятия и мониторинг.</div>
                    </div>
                </div>
            `;
        }
    }

    updateBackButton() {
        const backButton = document.getElementById('back-btn');
        const canGoBack = this.chart && this.chart.history && this.chart.history.length > 1;
        
        if (backButton) {
            if (canGoBack) {
                backButton.style.opacity = '1';
                backButton.style.cursor = 'pointer';
                backButton.disabled = false;
            } else {
                backButton.style.opacity = '0.5';
                backButton.style.cursor = 'not-allowed';
                backButton.disabled = true;
            }
        }
    }

    setupEventHandlers() {
        const backButton = document.getElementById('back-btn');
        if (backButton) {
            // Удаляем старые обработчики
            backButton.replaceWith(backButton.cloneNode(true));
            // Добавляем новый обработчик
            document.getElementById('back-btn').addEventListener('click', () => {
                if (this.chart && this.chart.goBack()) {
                    this.updateDetails(this.chart.currentRoot);
                    this.updateBackButton();
                }
            });
        }
    }

    showError(message) {
        const detailsContent = document.getElementById('details-content');
        if (detailsContent) {
            detailsContent.innerHTML = `
                <div class="error-message">
                    <h4>Ошибка</h4>
                    <p>${message}</p>
                </div>
            `;
        }
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
