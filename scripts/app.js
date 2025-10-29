class App {
    constructor() {
        this.chart = null;
        this.data = null;
        this.init();
    }

    async init() {
        try {
            // Загружаем данные
            await this.loadData();
            
            // Инициализируем график
            this.initChart();
            
            // Настраиваем обработчики событий
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
                        { 
                            name: "Правовые риски", 
                            value: 180000, 
                            riskLevel: "high",
                            directLosses: 100000,
                            indirectLosses: 80000,
                            limit: 500000,
                            forecast: 200000,
                            drivers: ["Изменение законодательства", "Судебные разбирательства"],
                            hashtags: ["#закон", "#суд", "#регулятор"],
                            incidentCount: 5,
                            topIncidents: [
                                { name: "Судебный иск от клиента", count: 2 },
                                { name: "Штраф от регулятора", count: 1 },
                                { name: "Нарушение compliance", count: 2 }
                            ],
                            coveredRisks: 15,
                            totalRisks: 25,
                            infoEvents: [
                                "Принятие нового закона о налогах",
                                "Изменение в регулировании банковской деятельности"
                            ],
                            aiConclusion: "Высокий уровень правовых рисков due to ужесточение законодательства и увеличение судебных разбирательств. Рекомендуется усилить compliance-контроль."
                        },
                        { 
                            name: "Регуляторные риски", 
                            value: 150000, 
                            riskLevel: "medium" 
                        },
                        { 
                            name: "Риски ИБ", 
                            value: 120000, 
                            riskLevel: "high" 
                        }
                    ]
                },
                {
                    name: "ИТ",
                    riskLevel: "medium",
                    value: 280000,
                    children: [
                        { 
                            name: "Технологические риски", 
                            value: 280000, 
                            riskLevel: "medium",
                            directLosses: 150000,
                            indirectLosses: 130000,
                            limit: 400000,
                            forecast: 250000,
                            drivers: ["Устаревшая инфраструктура", "Кибератаки"],
                            hashtags: ["#ИТ", "#кибербезопасность", "инфраструктура"],
                            incidentCount: 8,
                            topIncidents: [
                                { name: "Сбой системы", count: 3 },
                                { name: "Кибератака", count: 2 },
                                { name: "Потеря данных", count: 3 }
                            ],
                            coveredRisks: 20,
                            totalRisks: 35,
                            infoEvents: [
                                "Рост кибератак в отрасли",
                                "Внедрение новых технологических стандартов"
                            ],
                            aiConclusion: "Средний уровень технологических рисков. Необходимо обновить ИТ-инфраструктуру и усилить меры кибербезопасности."
                        }
                    ]
                },
                {
                    name: "Клиенты",
                    riskLevel: "high",
                    value: 520000,
                    children: [
                        { 
                            name: "Риски внешнего мошенничества", 
                            value: 300000, 
                            riskLevel: "high" 
                        },
                        { 
                            name: "Риски клиентов", 
                            value: 220000, 
                            riskLevel: "medium" 
                        }
                    ]
                },
                {
                    name: "Партнеры",
                    riskLevel: "medium",
                    value: 190000,
                    children: [
                        { name: "Риски контрагентов", value: 80000, riskLevel: "medium" },
                        { name: "Риски цепочки поставок", value: 70000, riskLevel: "low" },
                        { name: "Товарные риски", value: 40000, riskLevel: "medium" }
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
                    value: 110000,
                    children: [
                        { name: "Природные риски", value: 50000, riskLevel: "low" },
                        { name: "Техногенные риски", value: 40000, riskLevel: "medium" },
                        { name: "Риски физической безопасности", value: 20000, riskLevel: "low" }
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
        
        // Настраиваем обработчик кликов
        this.chart.onSegmentClick((segment) => {
            this.updateDetails(segment);
        });
        
        // Первоначальное обновление деталей
        this.updateDetails(this.chart.root);
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
                            <span class="metric-value">${this.chart.root.descendants().length - 1}</span>
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

        // Если это категория (не листовой узел)
        if (segment.children) {
            const totalLosses = segment.value;
            const riskCount = segment.descendants().length - 1;
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
            // Если это листовой узел (конкретный риск)
            const riskData = segment.data;
            const riskLevel = riskData.riskLevel || 'low';
            const coveragePercent = riskData.coveredRisks && riskData.totalRisks ? 
                Math.round((riskData.coveredRisks / riskData.totalRisks) * 100) : 0;

            // Генерация инцидентов
            let incidentsHTML = '';
            if (riskData.topIncidents) {
                riskData.topIncidents.forEach(incident => {
                    incidentsHTML += `
                        <div class="incident-item">
                            <strong>${incident.name}</strong>
                            <div style="color: #6c757d; font-size: 0.8rem;">${incident.count} инцидентов</div>
                        </div>
                    `;
                });
            }

            // Генерация хештегов
            let hashtagsHTML = '';
            if (riskData.hashtags) {
                riskData.hashtags.forEach(tag => {
                    hashtagsHTML += `<span class="hashtag">${tag}</span>`;
                });
            }

            // Генерация инфоповодов
            let infoEventsHTML = '';
            if (riskData.infoEvents) {
                riskData.infoEvents.forEach(event => {
                    infoEventsHTML += `<div class="info-item">${event}</div>`;
                });
            }

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
                            <span class="metric-value">${d3.format(",d")(riskData.directLosses || 0)}₽</span>
                            <span class="metric-label">Прямые потери</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${d3.format(",d")(riskData.indirectLosses || 0)}₽</span>
                            <span class="metric-label">Косвенные потери</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${d3.format(",d")(riskData.limit || 0)}₽</span>
                            <span class="metric-label">Лимит риска</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">${d3.format(",d")(riskData.forecast || 0)}₽</span>
                            <span class="metric-label">Прогноз</span>
                        </div>
                    </div>
                    
                    ${riskData.drivers ? `
                    <div class="drivers-section">
                        <div class="section-title">Драйверы риска</div>
                        <div style="color: #495057;">
                            ${riskData.drivers.map(driver => `<div>• ${driver}</div>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${hashtagsHTML ? `
                    <div class="drivers-section">
                        <div class="section-title">Хештеги инцидентов</div>
                        <div class="hashtags">${hashtagsHTML}</div>
                    </div>
                    ` : ''}
                    
                    ${riskData.incidentCount ? `
                    <div class="incidents-section">
                        <div class="section-title">
                            Инциденты (всего: ${riskData.incidentCount})
                        </div>
                        ${incidentsHTML}
                    </div>
                    ` : ''}
                    
                    ${coveragePercent > 0 ? `
                    <div class="coverage-section">
                        <div class="section-title">
                            Покрытие мерами (${riskData.coveredRisks}/${riskData.totalRisks})
                        </div>
                        <div class="coverage-progress">
                            <div class="coverage-bar" style="width: ${coveragePercent}%"></div>
                        </div>
                        <div style="text-align: center; color: #28a745; font-weight: 600;">
                            ${coveragePercent}% покрыто
                        </div>
                    </div>
                    ` : ''}
                    
                    ${infoEventsHTML ? `
                    <div class="info-section">
                        <div class="section-title">Влияющие инфоповоды</div>
                        ${infoEventsHTML}
                    </div>
                    ` : ''}
                    
                    ${riskData.aiConclusion ? `
                    <div class="ai-section">
                        <div class="section-title">Анализ AI</div>
                        <div class="ai-conclusion">${riskData.aiConclusion}</div>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    }

    setupEventHandlers() {
        document.getElementById('back-btn').addEventListener('click', () => {
            this.chart.resetZoom();
            this.updateDetails(this.chart.root);
        });
    }

    showError(message) {
        const detailsContent = document.getElementById('details-content');
        detailsContent.innerHTML = `
            <div class="error-message">
                <h4>Ошибка</h4>
                <p>${message}</p>
            </div>
        `;
    }
}

// Инициализация приложения после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
