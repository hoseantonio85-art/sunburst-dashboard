class SunburstChart {
    constructor(container, data) {
        this.container = container;
        this.data = data;
        this.currentRoot = null;
        this.history = [];
        this.init();
    }

    init() {
        const width = 800;
        const height = width;
        const radius = width / 6;

        const hierarchy = d3.hierarchy(this.data)
            .sum(d => d.value || 0)
            .sort((a, b) => b.value - a.value);
        
        this.root = d3.partition()
            .size([2 * Math.PI, hierarchy.height + 1])
            (hierarchy);
        
        this.root.each(d => d.current = d);
        this.currentRoot = this.root;
        this.history = [this.root];

        this.arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

        // Очищаем контейнер и создаем SVG
        d3.select(this.container).select("svg").remove();
        
        this.svg = d3.select(this.container)
            .append("svg")
            .attr("viewBox", [-width / 2, -height / 2, width, width])
            .style("font", "12px sans-serif")
            .style("max-width", "100%")
            .style("height", "auto");

        this.pathGroup = this.svg.append("g");
        this.labelGroup = this.svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none");

        this.updateChart();

        this.parent = this.svg.append("circle")
            .datum(this.root)
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("click", (event) => this.handleClick(event, this.root));
    }

    getRiskColor(riskLevel) {
        const colors = {
            'very-high': '#8B0000',
            'high': '#FF4444',
            'medium': '#FFAA00',
            'low': '#CCCCCC'
        };
        return colors[riskLevel] || '#CCCCCC';
    }

    updateChart() {
        const that = this;

        // Обновляем пути
        const path = this.pathGroup
            .selectAll("path")
            .data(this.root.descendants().slice(1))
            .join("path")
            .attr("fill", d => {
                return this.getRiskColor(d.data.riskLevel || 'low');
            })
            .attr("fill-opacity", d => this.arcVisible(d.current) ? (d.children ? 0.8 : 0.7) : 0)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("pointer-events", d => this.arcVisible(d.current) ? "auto" : "none")
            .attr("d", d => this.arc(d.current));

        path.filter(d => d.children)
            .style("cursor", "pointer")
            .on("click", (event, d) => this.handleClick(event, d));

        path.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join(" → ")}\nУровень риска: ${this.getRiskLevelText(d.data.riskLevel)}\nПотери: ${d3.format(",d")(d.value || 0)}₽`);

        // Обновляем метки
        const label = this.labelGroup
            .selectAll("text")
            .data(this.root.descendants().slice(1))
            .join("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => +this.labelVisible(d.current))
            .attr("transform", d => this.labelTransform(d.current))
            .text(d => d.data.name)
            .style("font-weight", "600")
            .style("font-size", d => d.depth === 1 ? "12px" : "10px")
            .style("fill", d => {
                const riskLevel = d.data.riskLevel;
                return (riskLevel === 'very-high' || riskLevel === 'high') ? 'white' : '#2c3e50';
            });
    }

    getRiskLevelText(riskLevel) {
        const levels = {
            'very-high': 'Очень высокий',
            'high': 'Высокий',
            'medium': 'Средний',
            'low': 'Низкий'
        };
        return levels[riskLevel] || 'Не определен';
    }

    handleClick(event, p) {
        // Добавляем в историю только если переходим к новому узлу
        if (this.currentRoot !== p) {
            this.history.push(p);
        }
        
        this.currentRoot = p;
        
        // Обновляем данные для анимации
        this.root.each(d => d.target = {
            x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
            y0: Math.max(0, d.y0 - p.depth),
            y1: Math.max(0, d.y1 - p.depth)
        });

        const t = this.svg.transition().duration(750);

        // Анимация путей
        this.pathGroup.selectAll("path")
            .transition(t)
            .tween("data", d => {
                const i = d3.interpolate(d.current, d.target);
                return t => d.current = i(t);
            })
            .filter(function(d) {
                return +this.getAttribute("fill-opacity") || that.arcVisible(d.target);
            })
            .attr("fill-opacity", d => that.arcVisible(d.target) ? (d.children ? 0.8 : 0.7) : 0)
            .attr("pointer-events", d => that.arcVisible(d.target) ? "auto" : "none")
            .attrTween("d", d => () => that.arc(d.current));

        // Анимация меток
        this.labelGroup.selectAll("text")
            .filter(function(d) {
                return +this.getAttribute("fill-opacity") || that.labelVisible(d.target);
            })
            .transition(t)
            .attr("fill-opacity", d => +that.labelVisible(d.target))
            .attrTween("transform", d => () => that.labelTransform(d.current));

        if (this.onClickCallback) {
            this.onClickCallback(p);
        }
    }

    goBack() {
        if (this.history.length > 1) {
            // Удаляем текущий элемент из истории
            this.history.pop();
            // Берем предыдущий
            const previous = this.history[this.history.length - 1];
            this.handleClick(null, previous);
            return true;
        }
        return false;
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

    onSegmentClick(callback) {
        this.onClickCallback = callback;
    }
}
