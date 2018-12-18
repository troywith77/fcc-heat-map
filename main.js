import 'babel-polyfill'
import * as d3 from 'd3'
import Tip from 'd3-tip'

d3.tip = Tip

main()

async function main () {
  const { baseTemperature, monthlyVariance: data } = await d3.json(
    'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json'
  )
  console.log(baseTemperature, data)

  const width = 1600,
        height = 640,
        paddingV = 80,
        paddingH = 100,
        color = ["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"].reverse()

  const tip = d3.tip()
    .attr("class", "d3-tip")
    .attr("id", "tooltip")
    .html(function(d){
      return `
        <p>${d.year} - ${d.month}</p>
        <p>${(baseTemperature + d.variance).toFixed(2)}°C</p>
        <p>${d.variance}°C</p>
      `;
    })
    .direction("n")
    .offset([-10,0])
        
  const svg = d3
    .select('#root')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .call(tip)

  const minYear = d3.min(data, d => d.year)
  const maxYear = d3.max(data, d => d.year)
  const x = d3
    .scaleLinear()
    .domain([minYear, maxYear])
    .range([paddingH, width - paddingH])
  
  const xAxis = d3
    .axisBottom(x)

  svg
    .append('g')
    .attr('transform', `translate(0, ${height - paddingV})`)
    .call(xAxis)

    const y = d3
    .scaleLinear()
    .domain([0, 11])
    .range([paddingV, height - paddingV])

  const yAxis = d3
    .axisLeft(y)
    .tickFormat((month) => {
      const date = new Date(0);
      date.setUTCMonth(month);
      return d3.utcFormat("%B")(date)
    })
  
  const variance = data.map(i => i.variance)
  const minTemp = baseTemperature + Math.min(...variance)
  const maxTemp = baseTemperature + Math.max(...variance)
  const legendScaleDomain = ((min, max, count) => {
    const step = (max - min) / count
    const arr = []
    for (let i = 1; i < count; i++) {
      arr.push(min + i * step)
    }
    return arr
    // 求出threshold，最小值为min+step，最大值为max-step
  })(minTemp, maxTemp, color.length)
  
  // 映射温度值到颜色
  const legendScale = d3
    .scaleThreshold()
    .domain(legendScaleDomain)
    .range(color)

  // 创建颜色图例线性scale
  const legendX = d3
    .scaleLinear()
    .domain([minTemp, maxTemp])
    .range([paddingH, 600])

  // 创建颜色图例数轴
  const legendAxis = d3
    .axisBottom(legendX)
    .tickValues(legendScale.domain())
    .tickFormat(d3.format(".1f"))

  const legend = svg
    .append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${paddingH}, ${height - paddingV + 60})`)

  legend
    .append('g')
    .selectAll('rect')
    .data(legendScale.range().map((color) => {
      // 通过颜色反转得出对应的温度值范围
      const d = legendScale.invertExtent(color)
      if(d[0] == null) d[0] = legendX.domain()[0]
      if(d[1] == null) d[1] = legendX.domain()[1]
      return d
    }))
    .enter()
    .append('rect')
    .style('fill', (d) => legendScale(d[0]))
    .attr('x', d => legendX(d[0]))
    .attr('y', -30)
    .attr('width', d => legendX(d[1]) - legendX(d[0]))
    .attr('height', 30)

  legend
    .append('g')
    .call(legendAxis)
  
  svg
    .append('g')
    .attr('transform', `translate(${paddingH}, 0)`)
    .call(yAxis)

  const cellWidth = (width - paddingH * 2) / Math.ceil((data.length) / 12)
  const cellHeight = (height - paddingV * 2) / 12
  svg
    .append('g')
    .selectAll('.cell')
    .data(data)
    .enter()
    .append('rect')
    .attr('width', d => cellWidth)
    .attr('height', d => cellHeight)
    .attr('x', d => cellWidth * (d.year - minYear) + paddingH)
    .attr('y', d => paddingV + (d.month - 1) * cellHeight)
    .style('fill', d => legendScale(d.variance + baseTemperature))
    .on('mouseenter', function (d, i, cells) {
      d3
        .select(cells[i])
        .attr('stroke', '#000')
        .attr('stroke-width', '2')
      tip.show(d, this)
    })
    .on('mouseleave', (d, i, cells) => {
      d3
        .select(cells[i])
        .attr('stroke', undefined)
        .attr('stroke-width', undefined)
      tip.hide()
    })
}