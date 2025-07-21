// Sample data for the chart
const generateSampleData = () => {
    const data = [];
    const startDate = new Date('2025-06-01');
    const endDate = new Date('2025-06-15');
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const baseVolume = Math.random() * 100000 + 30000;
        const accepted = baseVolume * (0.5 + Math.random() * 0.3);
        const declined = baseVolume * (0.15 + Math.random() * 0.15);
        const blocked = baseVolume * (0.1 + Math.random() * 0.15);
        const failure = baseVolume * (0.02 + Math.random() * 0.05);
        
        data.push({
            date: new Date(d),
            accepted: accepted,
            declined: declined,
            blocked: blocked,
            failure: failure,
            total: accepted + declined + blocked + failure
        });
    }
    
    // Add some variation to match the pattern in the image
    data[data.length - 8].accepted *= 1.8; // Make one bar higher
    data[data.length - 8].total = data[data.length - 8].accepted + data[data.length - 8].declined + data[data.length - 8].blocked + data[data.length - 8].failure;
    
    return data;
};

// Chart configuration
const config = {
    margin: { top: 20, right: 30, bottom: 40, left: 60 },
    colors: {
        accepted: '#9966FF',    // Purple
        declined: '#D1D5DB',    // Light gray
        blocked: '#C0123C',     // Dark red
        failure: '#44139F'      // Dark purple
    }
};

// Initialize the chart
const initChart = () => {
    const data = generateSampleData();
    const container = d3.select('#chart');
    const containerRect = container.node().getBoundingClientRect();
    
    const width = containerRect.width - config.margin.left - config.margin.right;
    const height = 350 - config.margin.top - config.margin.bottom;
    
    // Clear any existing chart
    container.selectAll('*').remove();
    
    // Create SVG
    const svg = container
        .append('svg')
        .attr('width', width + config.margin.left + config.margin.right)
        .attr('height', height + config.margin.top + config.margin.bottom);
    
    const g = svg.append('g')
        .attr('transform', `translate(${config.margin.left},${config.margin.top})`);
    
    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.date))
        .range([0, width])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.total)])
        .range([height, 0]);
    
    // Create stack
    const stack = d3.stack()
        .keys(['accepted', 'declined', 'blocked', 'failure'])
        .order(d3.stackOrderNone)
        .offset(d3.stackOffsetNone);
    
    const stackedData = stack(data);
    
    // Add grid lines
    const yAxis = d3.axisLeft(yScale)
        .tickSize(-width)
        .tickFormat('')
        .ticks(5);
    
    g.append('g')
        .attr('class', 'grid')
        .call(yAxis)
        .selectAll('line')
        .attr('class', 'grid-line');
    
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tooltip');
    
    // Create bars
    const series = g.selectAll('.series')
        .data(stackedData)
        .enter().append('g')
        .attr('class', 'series')
        .attr('fill', d => config.colors[d.key]);
    
    const bars = series.selectAll('rect')
        .data(d => d)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.data.date))
        .attr('y', height)
        .attr('height', 0)
        .attr('width', xScale.bandwidth())
        .on('mouseover', function(event, d) {
            const key = d3.select(this.parentNode).datum().key;
            const value = d[1] - d[0];
            const percentage = ((value / d.data.total) * 100).toFixed(1);
            const formattedValue = formatCurrency(value);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            tooltip.html(`
                <div><strong>${capitalizeFirst(key)}</strong></div>
                <div>${formattedValue} (${percentage}%)</div>
                <div>${formatDate(d.data.date)}</div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .classed('show', true);
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0)
                .on('end', () => tooltip.classed('show', false));
        });
    
    // Replace top segments with rounded paths
    series.filter(d => d.key === 'failure')
        .selectAll('rect')
        .remove();
    
    const topSegments = series.filter(d => d.key === 'failure')
        .selectAll('path')
        .data(d => d)
        .enter().append('path')
        .attr('class', 'bar bar-top')
        .attr('d', d => {
            const x = xScale(d.data.date);
            const y = height;
            const w = xScale.bandwidth();
            const h = 0;
            const r = 4;
            
            // Create path with rounded top corners only
            return `M ${x + r} ${y}
                    L ${x + w - r} ${y}
                    Q ${x + w} ${y} ${x + w} ${y + r}
                    L ${x + w} ${y + h}
                    L ${x} ${y + h}  
                    L ${x} ${y + r}
                    Q ${x} ${y} ${x + r} ${y} Z`;
        })
        .on('mouseover', function(event, d) {
            const key = d3.select(this.parentNode).datum().key;
            const value = d[1] - d[0];
            const percentage = ((value / d.data.total) * 100).toFixed(1);
            const formattedValue = formatCurrency(value);
            
            tooltip.transition()
                .duration(200)
                .style('opacity', 1);
            
            tooltip.html(`
                <div><strong>${capitalizeFirst(key)}</strong></div>
                <div>${formattedValue} (${percentage}%)</div>
                <div>${formatDate(d.data.date)}</div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
                .classed('show', true);
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0)
                .on('end', () => tooltip.classed('show', false));
        });

    // Animate regular bars (rectangles)
    bars.transition()
        .duration(800)
        .delay((d, i) => i * 20)
        .attr('y', d => yScale(d[1]))
        .attr('height', d => yScale(d[0]) - yScale(d[1]));
    
    // Animate top segments (paths)
    topSegments.transition()
        .duration(800)
        .delay((d, i) => i * 20)
        .attr('d', d => {
            const x = xScale(d.data.date);
            const y = yScale(d[1]);
            const w = xScale.bandwidth();
            const h = yScale(d[0]) - yScale(d[1]);
            const r = 4;
            
            // Create path with rounded top corners only
            return `M ${x + r} ${y}
                    L ${x + w - r} ${y}
                    Q ${x + w} ${y} ${x + w} ${y + r}
                    L ${x + w} ${y + h}
                    L ${x} ${y + h}  
                    L ${x} ${y + r}
                    Q ${x} ${y} ${x + r} ${y} Z`;
        });
    
    // Add Y axis
    const yAxisGenerator = d3.axisLeft(yScale)
        .tickFormat(d => formatCurrency(d, true))
        .ticks(5);
    
    g.append('g')
        .attr('class', 'axis')
        .call(yAxisGenerator);
    
    // Add X axis (minimal, just start and end dates)
    g.append('text')
        .attr('class', 'axis')
        .attr('x', 0)
        .attr('y', height + 25)
        .attr('text-anchor', 'start')
        .text(formatDate(data[0].date));
    
    g.append('text')
        .attr('class', 'axis')
        .attr('x', width)
        .attr('y', height + 25)
        .attr('text-anchor', 'end')
        .text(formatDate(data[data.length - 1].date));
};

// Utility functions
const formatCurrency = (value, short = false) => {
    if (short) {
        if (value >= 1000000) {
            return `$${(value / 1000000).toFixed(1)}M`;
        } else if (value >= 1000) {
            return `$${(value / 1000).toFixed(0)}K`;
        }
        return `$${value.toFixed(0)}`;
    }
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(value);
};

const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

const capitalizeFirst = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Handle window resize
const handleResize = () => {
    initChart();
};

// Initialize chart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    window.addEventListener('resize', handleResize);
});

// Add interactivity to metric cards
document.addEventListener('DOMContentLoaded', () => {
    const metricCards = document.querySelectorAll('.metric-card');
    
    metricCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove highlight from all cards
            metricCards.forEach(c => c.classList.remove('highlighted'));
            // Add highlight to clicked card
            card.classList.add('highlighted');
            
            // Simulate updating the chart based on selected metric
            setTimeout(() => {
                initChart();
            }, 100);
        });
    });
    
    // Add functionality to period selector
    const periodSelect = document.querySelector('.period-select');
    if (periodSelect) {
        periodSelect.addEventListener('change', (e) => {
            console.log('Period changed to:', e.target.value);
            // In a real app, this would fetch new data
            initChart();
        });
    }
    
    // Add functionality to download button
    const downloadBtn = document.querySelector('.download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            // Simulate download functionality
            const data = generateSampleData();
            const csvContent = convertToCSV(data);
            downloadCSV(csvContent, 'payment-metrics.csv');
        });
    }
});

// CSV export functionality
const convertToCSV = (data) => {
    const headers = ['Date', 'Accepted', 'Declined', 'Blocked', 'Failure', 'Total'];
    const rows = data.map(d => [
        d.date.toISOString().split('T')[0],
        d.accepted.toFixed(2),
        d.declined.toFixed(2),
        d.blocked.toFixed(2),
        d.failure.toFixed(2),
        d.total.toFixed(2)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}; 