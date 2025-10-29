class SunburstChart {
    constructor(container, data, onSegmentClick) {
        this.container = container;
        this.data = data;
        this.onSegmentClick = onSegmentClick;
        
        // Состояние навигации
        this.history = [];
        this.currentNode = null;
        
        // Размеры
        this.width = 600;
        this.height = this.width;
        this.radius = Math.min(this.width, this.height) / 2;
        
        // Цветовая схема
        this.colorScheme = {
            'very-high': '#8B0000',
            'high': '#FF4444',
            'medium': '#FFAA00', 
            'low': '#CCCCCC'
        };
        
        this.init();
    }

    init() {
        // Очищаем контейнер
        d3.select(this.container).html('');
        
        // Создаем SVG
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .append("g")
            .attr("transform", `translate(${this.width / 2},${this.height / 2})`);

        // Строим иерархию
        this.root = d3.hierarchy(this.data);
        this.root.sum(d => d.value || 0);
        this.root.sort((a, b) => b.value - a.value);

        // Partition layout
        this.partition = d3.partition()
            .size([2 * Math.PI, this.radius]);

        this.partition(this.root);

        // Генератор дуг
        this.arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1);

        // Сохраняем начальное состояние
        this.currentNode = this.root;
        this.history = [this.root];

        // Рендерим график
        this.render();
    }

    render() {
        const nodes = this.root.descendants().filter(d => d.depth > 0);

        // Очищаем предыдущие элементы
        this.svg.selectAll("*").remove();

        // Рисуем дуги
        const path = this.svg.selectAll("path")
            .data(nodes)
            .enter().append("path")
            .attr("d", this.arc)
            .style("fill", d => this.getColor(d))
            .style("stroke", "#fff")
            .style("stroke-width", 1)
            .style("cursor", d => d.children ? "pointer" : "default")
            .style("opacity", 0.8)
            .on("click", (event, d) => this.handleClick(event, d))
            .on("mouseover", (event, d) => this.handleMouseOver(event, d))
            .on("mouseout", (event, d) => this.handleMouseOut(event, d));

        // Добавляем метки
        const label = this.svg.selectAll("text")
            .data(nodes.filter(d => this.shouldShowLabel(d)))
            .enter().append("text")
            .attr("transform", d => this.getLabelTransform(d))
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50")
            .style("pointer-events", "none")
            .style("opacity", d => this.getLabelOpacity(d))
            .text(d => d.data.name);

        // Анимация появления
        path.transition()
            .duration(750)
            .style("opacity", 0.8);

        label.transition()
            .duration(750)
            .style("opacity", d => this.getLabelOpacity(d));
    }

    getColor(d) {
        if (d.depth === 1) {
            // Первый уровень - категории рисков
            return this.colorScheme[d.data.riskLevel] || this.colorScheme.low;
        } else if (d.depth === 2) {
            // Второй уровень - наследуем цвет от родителя
            const parentRisk = d.parent.data.riskLevel;
            return this.colorScheme[parentRisk] || this.colorScheme.low;
        } else {
            // Остальные уровни
            return this.colorScheme.low;
        }
    }

    shouldShowLabel(d) {
        const angle = (d.x1 - d.x0) * 180 / Math.PI;
        const radius = d.y1 - d.y0;
        return angle > 10 && radius > 20 && d.depth <= 2;
    }

    getLabelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2;
        const rotation = x - 90;
        const translate = y;
        
        return `rotate(${rotation}) translate(${translate}) rotate(${rotation > 90 ? 180 : 0})`;
    }

    getLabelOpacity(d) {
        return this.shouldShowLabel(d) ? 1 : 0;
    }

    handleClick(event, d) {
        event.stopPropagation();
        
        // Если нет детей или это листовой узел
        if (!d.children || d.depth >= 3) {
            return;
        }

        // Сохраняем в историю
        this.history.push(d);
        this.currentNode = d;

        // Анимация перехода
        this.animateToNode(d);
        
        // Колбэк для обновления деталей
        if (this.onSegmentClick) {
            this.onSegmentClick(d);
        }
    }

    animateToNode(targetNode) {
        const duration = 750;

        // Пересчитываем координаты для нового корня
        this.partition(this.root);
        
        const nodes = this.root.descendants().filter(d => d.depth > 0);
        
        // Анимация путей
        const path = this.svg.selectAll("path")
            .data(nodes, d => d.data.name)
            .transition()
            .duration(duration)
            .attrTween("d", d => {
                const interpolate = d3.interpolate(
                    {x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1},
                    {x0: d.x0, x1: d.x1, y0: d.y0, y1: d.y1}
                );
                return t => this.arc(interpolate(t));
            })
            .style("fill", d => this.getColor(d));

        // Анимация меток
        const label = this.svg.selectAll("text")
            .data(nodes.filter(d => this.shouldShowLabel(d)), d => d.data.name)
            .transition()
            .duration(duration)
            .attr("transform", d => this.getLabelTransform(d))
            .style("opacity", d => this.getLabelOpacity(d));
    }

    goBack() {
        if (this.history.length > 1) {
            // Убираем текущий узел
            this.history.pop();
            const previousNode = this.history[this.history.length - 1];
            this.currentNode = previousNode;

            // Анимация возврата
            this.animateToNode(previousNode);
            
            // Колбэк для обновления деталей
            if (this.onSegmentClick) {
                this.onSegmentClick(previousNode);
            }
            
            return true;
        }
        return false;
    }

    handleMouseOver(event, d) {
        d3.select(event.currentTarget)
            .style("opacity", 1)
            .style("stroke-width", 2);
    }

    handleMouseOut(event, d) {
        d3.select(event.currentTarget)
            .style("opacity", 0.8)
            .style("stroke-width", 1);
    }

    getCurrentDepth() {
        return this.history.length - 1;
    }

    getNodeInfo(node) {
        return {
            name: node.data.name,
            riskLevel: node.data.riskLevel,
            value: node.data.value,
            children: node.children ? node.children.length : 0,
            depth: node.depth,
            hasChildren: !!(node.children)
        };
    }

    // Обновление данных
    updateData(newData) {
        this.data = newData;
        this.init();
    }

    destroy() {
        if (this.svg) {
            this.svg.remove();
        }
    }
}
