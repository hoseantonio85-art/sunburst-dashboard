class SunburstChart {
    constructor(container, data, onSegmentClick) {
        this.container = container;
        this.data = data;
        this.onSegmentClick = onSegmentClick;
        this.currentRoot = null;
        this.history = [];
        
        // Размеры и отступы
        this.width = 600;
        this.height = 600;
        this.radius = Math.min(this.width, this.height) / 2;
        
        // Цветовая схема
        this.colorScheme = {
            'very-high': '#8B0000',
            'high': '#FF4444',
            'medium': '#FFAA00',
            'low': '#CCCCCC'
        };
        
        // Инициализация
        this.init();
    }

    init() {
        // Создание SVG контейнера
        this.svg = d3.select(this.container)
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('g')
            .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

        // Создание инструментов для работы с иерархией
        this.partition = d3.partition()
            .size([2 * Math.PI, this.radius]);

        this.arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1);

        // Построение иерархии из данных
        this.root = d3.hierarchy(this.data)
            .sum(d => d.value || 1)
            .sort((a, b) => b.value - a.value);

        this.partition(this.root);

        // Установка текущего корня
        this.currentRoot = this.root;
        this.history.push(this.root);

        // Первоначальная отрисовка
        this.updateChart();
    }

    updateChart() {
        const nodes = this.currentRoot.descendants().slice(1);
        const duration = 750;

        // JOIN данных с элементами
        const path = this.svg.selectAll('path')
            .data(nodes, d => d.data.name);

        // EXIT старых элементов
        path.exit()
            .transition()
            .duration(duration)
            .style('opacity', 0)
            .remove();

        // UPDATE существующих элементов
        path.transition()
            .duration(duration)
            .attrTween('d', d => {
                const interpolate = d3.interpolate(
                    { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 },
                    { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 }
                );
                return t => this.arc(interpolate(t));
            });

        // ENTER новых элементов
        const pathEnter = path.enter()
            .append('path')
            .attr('d', d => this.arc(d))
            .style('fill', d => this.getRiskColor(d.data.riskLevel))
            .style('stroke', '#fff')
            .style('stroke-width', 1)
            .style('cursor', 'pointer')
            .style('opacity', 0)
            .on('click', (event, d) => this.handleClick(event, d));

        pathEnter.transition()
            .duration(duration)
            .style('opacity', 1);

        // Добавление меток
        this.updateLabels(nodes, duration);
    }

    updateLabels(nodes, duration) {
        // JOIN меток
        const label = this.svg.selectAll('text')
            .data(nodes.filter(d => d.depth <= 2), d => d.data.name);

        // EXIT старых меток
        label.exit()
            .transition()
            .duration(duration)
            .style('opacity', 0)
            .remove();

        // UPDATE существующих меток
        label.transition()
            .duration(duration)
            .attr('transform', d => this.getLabelTransform(d))
            .style('opacity', d => this.labelVisible(d) ? 1 : 0);

        // ENTER новых меток
        const labelEnter = label.enter()
            .append('text')
            .attr('class', 'sunburst-label')
            .attr('dy', '0.35em')
            .attr('transform', d => this.getLabelTransform(d))
            .style('opacity', 0)
            .text(d => d.data.name)
            .style('font-size', d => this.getFontSize(d))
            .style('text-anchor', 'middle')
            .style('pointer-events', 'none')
            .style('fill', '#2c3e50')
            .style('font-weight', '600');

        labelEnter.transition()
            .duration(duration)
            .style('opacity', d => this.labelVisible(d) ? 1 : 0);
    }

    getLabelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    labelVisible(d) {
        // Показываем метки только для первого и второго уровней
        return d.depth <= 2 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    getFontSize(d) {
        const segmentSize = (d.y1 - d.y0) * (d.x1 - d.x0);
        if (segmentSize > 0.1) return '12px';
        if (segmentSize > 0.05) return '10px';
        return '8px';
    }

    getRiskColor(riskLevel) {
        return this.colorScheme[riskLevel] || this.colorScheme.low;
    }

    handleClick(event, clickedNode) {
        event.stopPropagation();
        
        // Если у узла нет детей или мы уже в самом глубоком уровне, не делаем ничего
        if (!clickedNode.children && !clickedNode._children) {
            return;
        }

        // Добавляем в историю
        this.history.push(clickedNode);
        this.currentRoot = clickedNode;

        // Анимация перехода
        this.animateTransition(clickedNode);
        
        // Вызываем callback для обновления деталей
        if (this.onSegmentClick) {
            this.onSegmentClick(clickedNode);
        }
    }

    animateTransition(newRoot) {
        const duration = 750;

        // Пересчитываем partition для нового корня
        this.partition(this.root);
        const nodes = newRoot.descendants().slice(1);

        // Анимация путей
        const path = this.svg.selectAll('path')
            .data(nodes, d => d.data.name);

        path.transition()
            .duration(duration)
            .attrTween('d', d => {
                const interpolate = d3.interpolate(
                    { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 },
                    { x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1 }
                );
                return t => this.arc(interpolate(t));
            });

        // Анимация меток
        this.updateLabels(nodes, duration);
    }

    goBack() {
        if (this.history.length > 1) {
            // Убираем текущий узел из истории
            this.history.pop();
            this.currentRoot = this.history[this.history.length - 1];

            // Анимация перехода назад
            this.animateTransition(this.currentRoot);

            // Вызываем callback для обновления деталей
            if (this.onSegmentClick) {
                this.onSegmentClick(this.currentRoot);
            }

            return true;
        }
        return false;
    }

    getCurrentDepth() {
        return this.history.length - 1;
    }

    getCurrentPath() {
        return this.history.map(node => node.data.name).join(' → ');
    }

    // Метод для обновления данных
    updateData(newData) {
        this.data = newData;
        
        // Перестраиваем иерархию
        this.root = d3.hierarchy(this.data)
            .sum(d => d.value || 1)
            .sort((a, b) => b.value - a.value);

        this.partition(this.root);

        // Сбрасываем историю и текущий корень
        this.currentRoot = this.root;
        this.history = [this.root];

        // Обновляем график
        this.updateChart();
    }

    // Вспомогательные методы для получения информации о узле
    getNodeInfo(node) {
        return {
            name: node.data.name,
            riskLevel: node.data.riskLevel,
            value: node.data.value,
            children: node.children ? node.children.length : 0,
            depth: node.depth,
            hasChildren: !!(node.children || node._children)
        };
    }

    // Очистка ресурсов
    destroy() {
        if (this.svg) {
            this.svg.remove();
        }
    }
}
