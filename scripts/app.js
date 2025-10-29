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
        // Можно загружать из внешнего файла или использовать встроенные данные
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
            name: "Все данные",
            value: 1000,
            children: [
                {
                    name: "Продукция А",
                    value: 400,
                    children: [
                        { name: "Подкатегория А1", value: 150 },
                        { name: "Подкатегория А2", value: 120 },
                        { name: "Подкатегория А3", value: 130 }
                    ]
                },
                {
                    name: "Продукция Б", 
                    value: 350,
                    children: [
                        { name: "Подкатегория Б1", value: 180 },
                        { name: "Подкатегория Б2", value: 170 }
                    ]
                },
                {
                    name: "Продукция В",
                    value: 250,
                    children: [
                        { name: "Подкатегория В1", value: 100 },
                        { name: "Подкатегория В2", value: 80 },
                        { name: "Подкатегория В3", value: 70 }
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
                <div class="detail-card">
                    <h4>Общий обзор</h4>
                    <div class="metric">
                        <label>Всего элементов:</label>
                        <span>${this.chart.root.descendants().length - 1}</span>
                    </div>
                    <div class="metric">
                        <label>Общее значение:</label>
                        <span>${d3.format(",d")(this.chart.root.value)}</span>
                    </div>
                    <div class="metric">
                        <label>Основные категории:</label>
                        <span>${this.chart.root.children ? this.chart.root.children.length : 0}</span>
                    </div>
                </div>
            `;
            return;
        }

        const path = segment.ancestors().map(ancestor => ancestor.data.name).reverse().join(' → ');
        const percentage = ((segment.value / this.chart.root.value) * 100).toFixed(2);
        
        let childrenHTML = '';
        if (segment.children) {
            childrenHTML = `
                <div class="children-list">
                    <h5>Подкатегории:</h5>
                    <ul>
                        ${segment.children.map(child => 
                            `<li>${child.data.name}: ${d3.format(",d")(child.value)} 
                            (${((child.value / segment.value) * 100).toFixed(1)}%)</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }

        detailsContent.innerHTML = `
            <div class="detail-card">
                <h4>${segment.data.name}</h4>
                <div class="metrics">
                    <div class="metric">
                        <label>Полный путь:</label>
                        <span>${path}</span>
                    </div>
                    <div class="metric">
                        <label>Значение:</label>
                        <span>${d3.format(",d")(segment.value)}</span>
                    </div>
                    <div class="metric">
                        <label>Доля от общего:</label>
                        <span>${percentage}%</span>
                    </div>
                    <div class="metric">
                        <label>Уровень:</label>
                        <span>${segment.depth}</span>
                    </div>
                    ${segment.children ? `
                    <div class="metric">
                        <label>Дочерних элементов:</label>
                        <span>${segment.children.length}</span>
                    </div>` : ''}
                </div>
                ${childrenHTML}
            </div>
        `;
    }

    setupEventHandlers() {
        document.getElementById('reset-btn').addEventListener('click', () => {
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
