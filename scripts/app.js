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
                            drivers: ["Изменение законодательства", "Судебные разбирательства", "Нормативные требования"],
                            hashtags: ["#закон", "#суд", "#регулятор", "#compliance"],
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
                                "Изменение в регулировании банковской деятельности",
                                "Ужесточение требований ЦБ"
                            ],
                            aiConclusion: "Высокий уровень правовых рисков due to ужесточение законодательства и увеличение судебных разбирательств. Рекомендуется усилить compliance-контроль и провести аудит договорной работы."
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
                            riskLevel: "medium" 
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
            this.updateBackButton();
        });
        
        // Первоначальное обновление деталей
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
                    
                    ${riskData.drivers ? `
                    <div class="drivers-section">
                        <div class="section-title">Драйверы риска</div>
                        <div style="color: #495057;">
                            ${riskData.drivers.map(driver => `<div>• ${driver}</div>`).join('')}
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }
    }

    updateBackButton() {
        const backButton = document.getElementById('back-btn');
        const canGoBack = this.chart.history.length > 1;
        
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

    setupEventHandlers() {
        const backButton = document.getElementById('back-btn');
        
        backButton.addEventListener('click', () => {
            const success = this.chart.goBack();
            if (success) {
                this.updateDetails(this.chart.currentRoot);
                this.updateBackButton();
            }
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
