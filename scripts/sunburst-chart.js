class SunburstChart {
    constructor(container, data) {
        this.container = container;
        this.data = data;
        this.currentRoot = null;
        this.init();
    }

    init() {
        // Размеры и радиус
        const width = 800;
        const height = width;
        const radius = width / 6;

        // Цветовая шкала
        this.color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, this.data.children.length + 1));

        // Вычисляем иерархию
        const hierarchy = d3.hierarchy(this.data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        
        this.root = d3.partition()
            .size([2 * Math.PI, hierarchy.height + 1])
            (hierarchy);
        
        this.root.each(d => d.current = d);
        this.currentRoot = this.root;

        // Создаем генератор дуг
        this.arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

        // Создаем SVG контейнер
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("viewBox", [-width / 2, -height / 2, width, width])
            .style("font", "12px sans-serif")
            .style("max-width", "100%")
            .style("height", "auto");

        // Группа для путей
        this.pathGroup = this.svg.append("g");

        // Добавляем дуги
        this.updateChart();

        // Добавляем родительский круг для клика
        this.parent = this.svg.append("circle")
            .datum(this.root)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("click", (event) => this.clicked(event, this.root));
    }

    updateChart() {
        const that = this;

        // Обновляем пути
        const path = this.pathGroup
            .selectAll("path")
            .data(this.root.descendants().slice(1))
            .join("path")
            .attr("fill", d => { 
                while (d.depth > 1) d = d.parent; 
                return this.color(d.data.name); 
            })
            .attr("fill-opacity", d => this.arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("pointer-events", d => this.arcVisible(d.current) ? "auto" : "none")
            .attr("d", d => this.arc(d.current));

        // Делаем кликабельными элементы с детьми
        path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", (event, d) => this.clicked(event, d));

        // Добавляем title
        path.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${d3.format(",d")(d.value)}`);

        // Обновляем метки
        const label = this.svg.selectAll("text")
            .data(this.root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +this.labelVisible(d.current))
            .attr("transform", d => this.labelTransform(d.current))
            .text(d => d.data.name);

        // Удаляем старые метки
        this.svg.selectAll("text")
            .data(this.root.descendants().slice(1))
            .exit()
            .remove();
    }

    clicked(event, p) {
        this.currentRoot = p;
        
        // Обновляем данные для анимации
        this.root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
        });

        const t = this.svg.transition().duration(event && event.altKey ? 7500 : 750);

        // Анимация путей
        this.pathGroup.selectAll("path")
            .transition(t)
            .tween("data", d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function(d) {
                return +this.getAttribute("fill-opacity") || this.arcVisible(d.target);
            })
            .attr("fill-opacity", d => this.arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
            .attr("pointer-events", d => this.arcVisible(d.target) ? "auto" : "none")
            .attrTween("d", d => () => this.arc(d.current));

        // Анимация меток
        this.svg.selectAll("text")
            .filter(function(d) {
                return +this.getAttribute("fill-opacity") || this.labelVisible(d.target);
            })
            .transition(t)
            .attr("fill-opacity", d => +this.labelVisible(d.target))
            .attrTween("transform", d => () => this.labelTransform(d.current));

        // Вызываем callback для обновления деталей
        if (this.onClickCallback) {
            this.onClickCallback(p);
        }
    }

    arcVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
    }

    labelVisible(d) {
        return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
    }

    labelTransform(d) {
        const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
        const y = (d.y0 + d.y1) / 2 * (800 / 6);
        return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
    }

    resetZoom() {
        this.clicked(null, this.root);
    }

    onSegmentClick(callback) {
        this.onClickCallback = callback;
    }
}
