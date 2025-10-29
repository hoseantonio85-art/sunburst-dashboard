class SunburstChart {
    constructor(container, data, onSegmentClick) {
        this.container = container;
        this.data = data;
        this.onSegmentClick = onSegmentClick;
        this.currentRoot = null;
        this.history = [];
        
        // Размеры и отступы как в оригинальном примере
        this.width = 600;
        this.height = this.width;
        this.radius = this.width / 6;
        
        // Цветовая схема для рисков
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
        // Очищаем контейнер
        d3.select(this.container).html('');
        
        // Создаем SVG контейнер как в примере
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("viewBox", [-this.width / 2, -this.height / 2, this.width, this.width])
            .style("font", "10px sans-serif")
            .style("width", "100%")
            .style("height", "100%");

        // Вычисляем иерархию
        this.hierarchy = d3.hierarchy(this.data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        // Создаем partition layout
        this.partition = d3.partition()
            .size([2 * Math.PI, this.hierarchy.height + 1]);

        this.root = this.partition(this.hierarchy);
        this.root.each(d => d.current = d);

        // Создаем генератор дуг с настройками из примера
        this.arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(this.radius * 1.5)
            .innerRadius(d => d.y0 * this.radius)
            .outerRadius(d => Math.max(d.y0 * this.radius, d.y1 * this.radius - 1));

        // Добавляем группу для путей
        this.pathGroup = this.svg.append("g");

        // Добавляем дуги
        this.path = this.pathGroup
            .selectAll("path")
            .data(this.root.descendants().slice(1))
            .join("path")
            .attr("fill", d => this.getRiskColor(d))
            .attr("fill-opacity", d => this.arcVisible(d.current) ? (d.children ? 0.8 : 0.6) : 0)
            .attr("pointer-events", d => this.arcVisible(d.current) ? "auto" : "none")
            .attr("d", d => this.arc(d.current))
            .style("cursor", "pointer")
            .on("click", (event, d) => this.handleClick(event, d));

        // Добавляем подсказки
        this.path.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${this.formatValue(d.value)}`);

        // Добавляем метки
        this.labelGroup = this.svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none");

        this.label = this.labelGroup
            .selectAll("text")
            .data(this.root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +this.labelVisible(d.current))
            .attr("transform", d => this.labelTransform(d.current))
            .text(d => d.data.name)
            .style("font-size", "11px")
            .style("font-weight", "600")
            .style("fill", "#2c3e50");

        // Добавляем центральный круг для возврата (как в примере)
        this.parent = this.svg.append("circle")
            .datum(this.root)
            .attr("r", this.radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .style("cursor", "pointer")
            .on("click", (event, p) => this.handleClick(event, p));

        // Устанавливаем начальное состояние
        this.currentRoot = this.root;
        this.history = [this.root];
    }

    getRiskColor(d) {
        // Для корневого уровня используем градиент серого
        if (d.depth === 0) return "#f0f0f0";
        
        // Находим родительский узел для определения цвета категории
        let parent = d;
        while (parent.depth > 1) parent = parent.parent;
        
        const riskLevel = parent.data.riskLevel;
        return this.colorScheme[riskLevel] || this.colorScheme.low;
    }

    formatValue(value) {
        return new Intl.NumberFormat('ru-RU').format(value);
    }

    handleClick(event, p) {
        event.stopPropagation();
        
        // Если кликнули на центральный круг и есть куда возвращаться
        if (p === this.root && this.history.length > 1) {
            this.goBack();
            return;
        }

        // Если у узла нет детей, не делаем zoom
        if (!p.children && !p._children) return;

        // Добавляем в историю
        this.history.push(p);
        this.currentRoot = p;

        // Выполняем анимацию перехода (как в оригинальном примере)
        this.animateTransition(p);
        
        // Вызываем callback для обновления деталей
        if (this.onSegmentClick) {
            this.onSegmentClick(p);
        }
    }

    animateTransition(p) {
        // Обновляем данные для анимации (как в оригинальном примере)
        this.parent.datum(p.parent || this.root);

        this.root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
        });

        const t = this.svg.transition().duration(750);

        // Анимация путей
        this.path.transition(t)
            .tween("data", d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function(d) {
                return +this.getAttribute("fill-opacity") || this.arcVisible(d.target);
            })
            .attr("fill-opacity", d => this.arcVisible(d.target) ? (d.children ? 0.8 : 0.6) : 0)
            .attr("pointer-events", d => this.arcVisible(d.target) ? "auto" : "none")
            .attrTween("d", d => () => this.arc(d.current));

        // Анимация меток
        this.label.filter(function(d) {
            return +this.getAttribute("fill-opacity") || this.labelVisible(d.target);
        }).transition(t)
            .attr("fill-opacity", d => +this.labelVisible(d.target))
            .attrTween("transform", d => () => this.labelTransform(d.current));
    }

    arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * this.radius;
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    goBack() {
        if (this.history.length > 1) {
            // Убираем текущий узел из истории
            this.history.pop();
            const previousNode = this.history[this.history.length - 1];
            this.currentRoot = previousNode;

            // Выполняем анимацию перехода назад
            this.animateTransition(previousNode);

            // Вызываем callback для обновления деталей
            if (this.onSegmentClick) {
                this.onSegmentClick(previousNode);
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

    // Метод для обновления данных
    updateData(newData) {
        this.data = newData;
        
        // Перестраиваем иерархию
        this.hierarchy = d3.hierarchy(this.data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);

        this.root = this.partition(this.hierarchy);
        this.root.each(d => d.current = d);

        // Сбрасываем историю и текущий корень
        this.currentRoot = this.root;
        this.history = [this.root];

        // Обновляем график
        this.updateChart();
    }

    updateChart() {
        // Обновляем пути
        this.path = this.pathGroup
            .selectAll("path")
            .data(this.root.descendants().slice(1))
            .join("path")
            .attr("fill", d => this.getRiskColor(d))
            .attr("fill-opacity", d => this.arcVisible(d.current) ? (d.children ? 0.8 : 0.6) : 0)
            .attr("pointer-events", d => this.arcVisible(d.current) ? "auto" : "none")
            .attr("d", d => this.arc(d.current))
            .style("cursor", "pointer")
            .on("click", (event, d) => this.handleClick(event, d));

        // Обновляем подсказки
        this.path.selectAll("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${this.formatValue(d.value)}`);

        // Обновляем метки
        this.label = this.labelGroup
            .selectAll("text")
            .data(this.root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +this.labelVisible(d.current))
            .attr("transform", d => this.labelTransform(d.current))
            .text(d => d.data.name);
    }

    // Очистка ресурсов
    destroy() {
        if (this.svg) {
            this.svg.remove();
        }
    }
}
